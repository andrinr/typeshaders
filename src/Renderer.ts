/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */
import {Geo} from './Geo';
import {Shader, EShaderTypes, EUniformTypes } from './Shader';
import {FBO} from './FBO';
import {Manager} from './Manager';

export interface IRendererProps {
  vertex: Shader;
  fragment: Shader;
  geo: Geo;
  fbo?: FBO;
  autoFeedback?: boolean;
  clearColor?: number[];
  fixedSize?: number[];
  iterations?: number;
}

/**
 * The render class creates a webgl program from a pair of shaders
 */
export class Renderer {
  public props : IRendererProps;
  static defaultProps : IRendererProps = {
    vertex: undefined,
    fragment: undefined,
    geo: undefined,
    fbo: undefined,
    autoFeedback: true,
    clearColor: [0,0,0,1],
    fixedSize: undefined,
    iterations: 1
  };

  protected manager: Manager;
  protected program: WebGLProgram;


  /**
   * Called by the user
   * @param properties
   */
  constructor(properties: IRendererProps) {
    if (properties.vertex.type !== EShaderTypes.vertex || properties.fragment.type !== EShaderTypes.fragment)
      throw new Error('Renderer - vertex or fragment shader is not of correct type');

    this.props = Object.assign({}, Renderer.defaultProps, properties);

    if (this.props.clearColor.length !== 4) throw new Error('Renderer - clearColor is not an array of length 4 (RGBA)');


  }

  /**
   * Called by the Manager class
   */
  public initialize(manager: Manager, usesFBO: boolean): Renderer {
    this.manager = manager;

    this.props.vertex.compileShader(this.manager.gl);
    this.props.fragment.compileShader(this.manager.gl);
    this.props.geo.initialize(this.manager.gl);

    this.program = this.manager.gl.createProgram() as WebGLProgram;
    this.manager.gl.attachShader(this.program, this.props.vertex.glShader as WebGLProgram);
    this.manager.gl.attachShader(this.program, this.props.fragment.glShader as WebGLProgram);
    this.manager.gl.linkProgram(this.program);

    if (!this.manager.gl.getProgramParameter(this.program, this.manager.gl.LINK_STATUS))
      throw new Error(`Error linking shader program ${this.manager.gl.getProgramInfoLog(this.program)}`);

    if (usesFBO && !this.props.fbo) this.props.fbo = new FBO({
      manager : this.manager,
      autoSwap: this.props.autoFeedback,
      feedback: this.props.autoFeedback
    });

    return this;
  }

  get output() {
    if (this.props.fbo) return this.props.fbo.output();
    else throw new Error('Renderer.output - this a default renderer and thus directly renders to the canvas object.');
  }

  update(): Renderer {
    this.manager.gl.disable(this.manager.gl.BLEND);

    for (let i = 0; i < this.props.iterations; i++) {
      // the framebuffer null is the canvas object
      if (!this.props.fbo) this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, null);
      else this.props.fbo.update();

      this.manager.gl.clearColor(this.props.clearColor[0], this.props.clearColor[1], this.props.clearColor[2], this.props.clearColor[3]);
      this.manager.gl.clear(this.manager.gl.COLOR_BUFFER_BIT);

      this.manager.gl.useProgram(this.program);

      // feedback uniform
      if (this.props.fbo && this.props.autoFeedback) {
        for (let j = 0; j < this.props.fbo.props.outputTextures; j++){
          const location = this.manager.gl.getUniformLocation(this.program, `uFeedback${j}`);
          this.manager.gl.uniform1i(location, 0);
          this.manager.gl.activeTexture(this.manager.gl.TEXTURE0 + j);
          this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, this.props.fbo.output(j));
        }
      }

      this.setShaderUniforms(this.props.vertex);
      this.setShaderUniforms(this.props.fragment);

      this.props.geo.update(this.program);

      this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, null);
    }
    return this;
  }

  setSize(size: number[]) {
    this.props.fixedSize = size;
  }

  onResize() {
    const width = this.props.fixedSize ? this.props.fixedSize[0] : this.manager.canvasElement.getBoundingClientRect().width;
    const height = this.props.fixedSize ? this.props.fixedSize[1] : this.manager.canvasElement.getBoundingClientRect().height;
    this.manager.canvasElement.width = width;
    this.manager.canvasElement.height = height;
    this.manager.gl.viewport(0, 0, width, height);
    if (this.props.fbo) this.props.fbo.onResize([width, height]);
  }

  private setShaderUniforms(shader: Shader) {
    const gl = this.manager.gl;
    let textInd = this.props.fbo && this.props.autoFeedback ? 1 : 0;

    for (const item of shader.uniforms) {
      const location = gl.getUniformLocation(this.program, item.name);

      if (item.source) {
        const source = typeof item.source === 'function' ? item.source() : item.source;
        switch (item.type) {
          case EUniformTypes.f:
            gl.uniform1f(location, source);
            break;
          case EUniformTypes.i:
            gl.uniform1i(location, source);
            break;
          case EUniformTypes.f1:
            gl.uniform1fv(location, source);
            break;
          case EUniformTypes.f2:
            gl.uniform2fv(location, source);
            break;
          case EUniformTypes.f3:
            gl.uniform3fv(location, source);
            break;
          case EUniformTypes.f4:
            gl.uniform4fv(location, source);
            break;
          case EUniformTypes.tex:
            gl.uniform1i(location, textInd);
            gl.activeTexture(gl.TEXTURE0 + this.props.fbo.props.outputTextures + textInd++);
            gl.bindTexture(gl.TEXTURE_2D, source);
            break;
        }
      }
    }
  }
}
