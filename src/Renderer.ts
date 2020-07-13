/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */
import Geo from './Geo';
import Shader, { EShaderTypes, EUniformTypes } from './Shader';
import FBO from './FBO';
import Manager from './Manager';


export interface IRendererProps {
  vertex: Shader,
  fragment: Shader,
  geo: Geo,
  fbo?: FBO,
  autoFeedback?: boolean,
  clearColor?: number[],
  fixedSize?: number[],
  iterations?: number,
}

/**
 * The render class creates a webgl program from a pair of shaders
 */
export default class Renderer {
  vertex: Shader;
  fragment: Shader;
  program: WebGLProgram;
  fbo: FBO | null;
  geo: Geo;

  protected manager: Manager;
  protected clearColor: number[];
  protected autoFeedback: boolean;
  protected fixedSize: number[] | null;
  protected iterations: number;

  /**
   * Called by the user
   * @param properties
   */
  constructor(properties : IRendererProps) {
    if (properties.vertex.type !== EShaderTypes.vertex || properties.fragment.type !== EShaderTypes.fragment)
      throw  new Error('Renderer - vertex or fragment shader is not of correct type');

    this.clearColor = properties.clearColor || [0, 0, 0, 1];

    if (this.clearColor.length !== 4)
      throw new Error('Renderer - clearColor is not an array of length 4 (RGBA)');

    this.geo = properties.geo;
    this.vertex = properties.vertex;
    this.fragment = properties.fragment;
    this.fbo = properties.fbo || null;
    this.autoFeedback = properties.autoFeedback || false;
    this.fixedSize = properties.fixedSize || null;
    this.iterations = properties.iterations || 1;
  }

  /**
   * Called by the Manager class
   */
  public initialize(manager: Manager, usesFBO: boolean): Renderer{
    this.manager = manager;

    this.vertex.compileShader(this.manager.gl);
    this.fragment.compileShader(this.manager.gl);
    this.geo.initialize(this.manager.gl);

    this.program = this.manager.gl.createProgram() as WebGLProgram;
    this.manager.gl.attachShader(this.program, this.vertex.glShader as WebGLProgram);
    this.manager.gl.attachShader(this.program, this.fragment.glShader as WebGLProgram);
    this.manager.gl.linkProgram(this.program);

    if (!this.manager.gl.getProgramParameter(this.program, this.manager.gl.LINK_STATUS))
      throw new Error(`Error linking shader program ${this.manager.gl.getProgramInfoLog(this.program)}`);

    if (usesFBO && !this.fbo)
      this.fbo = new FBO(this.manager, this.autoFeedback, this.autoFeedback);

    return this;
  }

  get output() {
    if (this.fbo)
      return this.fbo.output();
    else
      throw new Error('Renderer.output - this a default renderer and thus directly renders to the canvas object.');
  }

  update(): Renderer {
    this.manager.gl.disable(this.manager.gl.BLEND);

    for (let i = 0; i < this.iterations; i++){
      // the framebuffer null is the canvas object
      if (!this.fbo)
        this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, null);

      else
        this.fbo.update();

      this.manager.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
      this.manager.gl.clear(this.manager.gl.COLOR_BUFFER_BIT);

      this.manager.gl.useProgram(this.program);

      // feedback uniform
      if (this.fbo && this.autoFeedback) {
        const location = this.manager.gl.getUniformLocation(this.program, 'feedback');
        this.manager.gl.activeTexture(this.manager.gl.TEXTURE0);
        this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, this.fbo.output());
        this.manager.gl.uniform1i(location, 0);
      }

      this.setShaderUniforms(this.vertex);
      this.setShaderUniforms(this.fragment);

      this.geo.update(this.program);

      this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, null);
    }
    return this;
  }

  setSize(size: number[]){
    this.fixedSize = size;
  }

  onResize(){
    const width = this.fixedSize ? this.fixedSize[0] : this.manager.canvasElement.getBoundingClientRect().width;
    const height = this.fixedSize ? this.fixedSize[1] : this.manager.canvasElement.getBoundingClientRect().height;
    this.manager.canvasElement.width = width;
    this.manager.canvasElement.height = height;
    this.manager.gl.viewport(0,0, width, height);
    if (this.fbo)
        this.fbo.onResize([width,height]);
  }

  private setShaderUniforms(shader: Shader) {
    const gl = this.manager.gl;
    let textInd = (this.fbo && this.autoFeedback) ? 1 : 0;

    for (const item of shader.uniforms) {
      const location = gl.getUniformLocation(this.program, item.name);

      if (item.source) {
        const source = typeof item.source === 'function' ? item.source() : item.source;
        switch (item.type) {
          case EUniformTypes.f :
            gl.uniform1f(location, source);
            break;
          case EUniformTypes.i :
            gl.uniform1i(location, source);
            break;
          case EUniformTypes.f1 :
            gl.uniform1fv(location, source);
            break;
          case EUniformTypes.f2 :
            gl.uniform2fv(location, source);
            break;
          case EUniformTypes.f3 :
            gl.uniform3fv(location, source);
            break;
          case EUniformTypes.f4 :
            gl.uniform4fv(location, source);
            break;
          case EUniformTypes.tex :
            gl.uniform1i(location, textInd);
            gl.activeTexture(gl.TEXTURE0 +textInd++);
            gl.bindTexture(gl.TEXTURE_2D, source);
            break;
        }
      }
    }
  }
}
