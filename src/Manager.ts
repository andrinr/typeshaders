import {Shader, EShaderTypes, EUniformTypes } from './Shader';
import {Geo} from './Geo';
import {Renderer} from './Renderer';
import {Scene} from './Scene';

/**
 * The manager controls the scene and initiates the webgl rendering context
 */
export class Manager {
  canvasElement: HTMLCanvasElement;
  gl: WebGLRenderingContext;

  baseVertexShader: Shader;
  copyFragmentShader: Shader;
  baseGeo: Geo;
  copyRenderer: Renderer;

  webGL2IsSupported : boolean;

  protected prevMousePos: number[];
  protected active: boolean;
  protected startTime: number;

  protected scene: Scene;

  /**
   * @param divName Requires the name of the canvas gl object in order to access it
   * @param shaderRoot Root of shader files. Use .glsl
   */
  constructor(divName: string) {
    this.canvasElement = document.getElementById(divName) as HTMLCanvasElement;
    this.active = true;
    const params = { alpha: false, depth: false, stencil: false, antialias: false };

    this.gl = this.canvasElement.getContext('webgl2', params) as WebGL2RenderingContext;
    this.webGL2IsSupported = true;

    // Fallback 1, webgl1
    if (!this.gl){
      this.gl = this.canvasElement.getContext('webgl', params) as WebGLRenderingContext;
      this.webGL2IsSupported = false;

      // https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float
      this.gl.getExtension('OES_texture_float');
    }

    this.gl.getExtension('EXT_color_buffer_float');

    // Throw error when to webgl is supported
    if (!this.gl)
      throw new Error("WebGL not supported!");


    // bindings
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.run = this.run.bind(this);
    // event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    // start animation
    this.start();
  }

  set(scene: Scene) {
    // Basic vertex shader which simply passes the vertices to the fragment shader
    this.baseVertexShader = new Shader(
      `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
      `,
      EShaderTypes.vertex,
      [
        {
          name: 'texelSize',
          source: () => [
            1 / this.canvasElement.getBoundingClientRect().width,
            1 / this.canvasElement.getBoundingClientRect().height,
          ],
          type: EUniformTypes.f2,
        },
      ],
    );

    // Copy shader copies the input texture
    this.copyFragmentShader = new Shader(
      `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      
      uniform sampler2D uSampler;
      
      void main() {
          vec4 tex = texture2D(uSampler, vUv);
          gl_FragColor = tex;
      }
      `,
      EShaderTypes.fragment,
      [
        {
          name: 'uSampler',
          source: null,
          type: EUniformTypes.tex,
        },
      ],
    );

    // Basis geometry fills the entire viewport
    this.baseGeo = new Geo([-1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]);

    this.copyRenderer = new Renderer({
      vertex: this.baseVertexShader,
      fragment: this.copyFragmentShader,
      geo: this.baseGeo,
      autoFeedback: false,
    }).initialize(this, true);

    this.scene = scene;

    // initialize time
    this.scene.time = {
      frameCount: 0,
      milliSeconds: 0,
      delta: 1 / 60,
    };
    this.startTime = new Date().getTime();

    this.scene.dimensions = {
      size: [this.canvasElement.width, this.canvasElement.height],
      aspectRatio: this.canvasElement.width / this.canvasElement.height,
    };

    this.scene.start();

    // initialize fbo renderers
    for (let i = 0; i < this.scene.renderers.length - 1; i++) this.scene.renderers[i].initialize(this, true);

    // last element in list will render to the canvas, thus doesn't need an fbo

    if (this.scene.renderers.length > 0)
      this.scene.renderers[this.scene.renderers.length - 1].initialize(this, false);

    else
      throw new Error("Scene renderer array is empty!");


    this.onResize();
    this.scene.onResize();
  }

  start() {
    this.run();
  }

  run() {
    if (this.scene) {
      // CPU updates before GPU updates
      this.scene.update();
      for (const renderer of this.scene.renderers) renderer.update();

      // time
      this.scene.time.frameCount++;
      const millis = new Date().getTime() - this.startTime;
      this.scene.time.delta = millis - this.scene.time.milliSeconds;
      this.scene.time.milliSeconds = new Date().getTime() - this.startTime;
    }

    if (this.active) window.requestAnimationFrame(this.run);
  }

  onResize() {
    if (this.scene) {
      // CPU updates before GPU updates
      this.scene.onResize();
      this.scene.dimensions = {
        size: [this.canvasElement.width, this.canvasElement.height],
        aspectRatio: this.canvasElement.width / this.canvasElement.height,
      };

      for (const renderer of this.scene.renderers) renderer.onResize();
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.scene) {
      const rect: DOMRect = this.canvasElement.getBoundingClientRect();
      // calculate relative mouse position to canvas element
      const x = Math.min(Math.max((event.x - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((rect.height - event.y - rect.top) / rect.height, 0), 1);
      if (!this.prevMousePos) this.prevMousePos = [x, y];
      const speed = [x - this.prevMousePos[0], y - this.prevMousePos[1]];
      this.prevMousePos = [x, y];
      this.scene.onMouseMove([x, y], speed);
    }
  }

  destroy() {
    this.active = false;
  }
}
