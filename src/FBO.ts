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
  numberOfTextures?: number
}

/**
 * Creates a framebuffer object
 */
export class FBO {

  static defaultProperties: IFBOProps = {
    manager: null,
    feedback: false,
    autoSwap: false,
    numberOfTextures: 1
  };

  protected props: IFBOProps;

  frameBuffer: WebGLFramebuffer;
  protected textures: WebGLTexture[];
  protected write: number;
  protected read: number;

  /**
   * Swap can be performed manually on the output function
   * @param properties
   */
  constructor(properties: IFBOProps) {

    this.props = Object.assign({},FBO.defaultProperties,properties);

    this.write = 0;
    this.read = 1;

    this.frameBuffer = this.props.manager.gl.createFramebuffer() as WebGLFramebuffer;
    this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);

    this.textures = [this.createTexture([400, 400])];

    if (this.props.feedback) this.textures.push(this.createTexture([400, 400]));
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
      this.props.manager.copyRenderer.fragment.uniforms[0].source = () => this.output();
      this.props.manager.copyRenderer.setSize(size);
      this.props.manager.copyRenderer.onResize();
      this.props.manager.copyRenderer.update();
      this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);
      this.textures[this.write] = this.props.manager.copyRenderer.output;
      this.textures[this.read] = this.createTexture(size);
    }
    /**
     * If there is no feedback, no data can be lost
     */
    else this.textures[this.write] = this.createTexture(size);

    this.props.manager.gl.bindFramebuffer(this.props.manager.gl.FRAMEBUFFER, this.frameBuffer);
    this.props.manager.gl.framebufferTexture2D(
      this.props.manager.gl.FRAMEBUFFER,
      this.props.manager.gl.COLOR_ATTACHMENT0,
      this.props.manager.gl.TEXTURE_2D,
      this.textures[this.write],
      0,
    );
  }

  /**
   * Access current read texture, since output is called after update
   * @param swap If swap is true, textures are swapped before getting the current read texture
   */
  output(swap?: boolean): WebGLTexture {
    if (swap && !this.props.autoSwap) this.swap();

    if (!this.props.feedback) return this.textures[this.write];
    else return this.textures[this.read];
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
