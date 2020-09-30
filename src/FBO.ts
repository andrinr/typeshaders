/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 *
 */

import {Manager} from './Manager';

export interface IFBOProps {
  manager: Manager,
  feedback?: boolean,
  autoSwap?: boolean,
  outputTextures?: number
}

/**
 * Creates a framebuffer object
 */
export class FBO {

  static defaultProperties: IFBOProps = {
    manager: null,
    feedback: false,
    autoSwap: false,
    outputTextures: 1
  };

  public props: IFBOProps;

  frameBuffer: WebGLFramebuffer;
  protected textures: WebGLTexture[][];
  protected write: number;
  protected read: number;
  protected drawBuffers: number[];
  protected colorAttachments: number[];
  protected drawBufferExtension: WEBGL_draw_buffers;

  /**
   * Swap can be performed manually on the output function
   * @param properties
   */
  constructor(properties: IFBOProps) {

    this.props = Object.assign({},FBO.defaultProperties,properties);


    this.drawBuffers = [this.props.manager.gl.COLOR_ATTACHMENT0];
    if (properties.outputTextures > 1){
      this.drawBufferExtension = this.props.manager.gl.getExtension('WEBGL_draw_buffers');

      this.colorAttachments = [
        this.drawBufferExtension.COLOR_ATTACHMENT0_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT1_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT2_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT3_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT4_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT5_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT6_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT7_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT8_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT9_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT10_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT11_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT12_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT13_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT14_WEBGL,
        this.drawBufferExtension.COLOR_ATTACHMENT15_WEBGL,
      ];

      this.drawBuffers = [
        this.drawBufferExtension.DRAW_BUFFER0_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER1_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER2_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER3_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER4_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER5_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER6_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER7_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER8_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER9_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER10_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER11_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER12_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER13_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER14_WEBGL,
        this.drawBufferExtension.DRAW_BUFFER15_WEBGL,
      ];

      this.drawBufferExtension.drawBuffersWEBGL(this.colorAttachments.slice(0,this.props.outputTextures));
    }


    this.write = 0;
    this.read = 1;

    this.frameBuffer = this.props.manager.gl.createFramebuffer() as WebGLFramebuffer;
    this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);

    this.textures = [];

    for (let i = 0; i < this.props.outputTextures; i++){

      if (this.props.feedback)
        this.textures.push([this.createTexture([400, 400]), this.createTexture([400, 400])]);

      else
        this.textures.push([this.createTexture([400, 400])]);

    }
  }

  protected createTexture(size: number[]): WebGLTexture {

    const gl = this.props.manager.gl;
    const gl2 = this.props.manager.gl as WebGL2RenderingContext;

    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.NEAREST,
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.NEAREST,
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE,
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE,
    );

    const internalFormat = this.props.manager.webGL2IsSupported ? gl2.RGBA16F : gl.RGBA;

    const format = gl.RGBA;

    const type = this.props.manager.webGL2IsSupported ? gl2.FLOAT : gl.UNSIGNED_BYTE;

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      size[0],
      size[1],
      0,
      format,
      type,
      null,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture as WebGLTexture;
  }

  /**
   * Inspired by: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/
   */
  protected checkRenderTextureFormatSupport() {

  }

  /**
   * Update the FBO, usually done after/before one frame
   * Swapping is done after rendering the frame
   */
  update() {
    this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);
    if (this.props.feedback) {
      if (this.props.autoSwap && this.props.feedback) this.swap();
      this.props.manager.gl.bindTexture(this.props.manager.gl.TEXTURE_2D, this.textures[this.write]);
    }
  }

  /**
   * Resize event called by the props.manager
   */
  onResize(size: number[]) {
    /**
     * Copy texture and write it back after a resize event
     * This prevents data loss after rewriting since we have to create new textures with new sizes
     */
    if (this.props.feedback) {
      for (let readWrite of this.textures){
        this.props.manager.copyRenderer.props.fragment.uniforms[0].source = () => this.output();
        this.props.manager.copyRenderer.setSize(size);
        this.props.manager.copyRenderer.onResize();
        this.props.manager.copyRenderer.update();
        this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);
        readWrite[this.write] = this.props.manager.copyRenderer.output;
        readWrite[this.read] = this.createTexture(size);
      }

    }
    /**
     * If there is no feedback, no data can be lost
     */
    else {
      for (let readWrite of this.textures) {
        readWrite[this.write] = this.createTexture(size);
      }
    }

    for (let i = 0; i< this.textures.length; i++){
      this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);
      this.props.manager.gl.framebufferTexture2D(
        this.props.manager.gl.FRAMEBUFFER,
        this.drawBuffers[i],
        this.props.manager.gl.TEXTURE_2D,
        this.textures[i][this.write],
        0,
      );
    }
  }

  /**
   * Access current read texture, since output is called after update
   * @param index
   * @param swap If swap is true, textures are swapped before getting the current read texture
   */
  output(index?: number, swap?: boolean): WebGLTexture {
    if (swap && !this.props.autoSwap) this.swap();

    if (!this.props.feedback) return this.textures[index | 0 ][this.write];
    else return this.textures[index | 0][this.read];
  }

  /**
   * Swap textures
   */
  swap() {
    this.write = ++this.write % 2;
    this.read = ++this.read % 2;
    this.props.manager.gl.framebufferTexture2D(
      this.props.manager.gl.FRAMEBUFFER,
      this.props.manager.gl.COLOR_ATTACHMENT0,
      this.props.manager.gl.TEXTURE_2D,
      this.textures[this.write],
      0,
    );
  }
}
