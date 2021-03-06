/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 *
 */

import {Manager} from './Manager';

/**
 * Creates a framebuffer object
 */
export class FBO {
  frameBuffer: WebGLFramebuffer;
  protected manager: Manager;
  protected feedback: boolean;
  protected autoSwap: boolean;
  protected textures: WebGLTexture[];
  protected write: number;
  protected read: number;
  protected formatRGBA: any;

  /**
   * @param manager The FBO object needs to know the webGL manager
   * @param feedback When enabled there is a read and write texture which will enables texture feedback. Default is False.
   * @param autoSwap Texture feedback requires swapping of the textures. Default is True.
   * Swap can be performed manually on the output function
   */
  constructor(manager: Manager, feedback?: boolean, autoSwap?: boolean) {
    this.manager = manager;
    this.feedback = feedback || false;
    this.autoSwap = autoSwap || true;
    this.write = 0;
    this.read = 1;

    this.frameBuffer = this.manager.gl.createFramebuffer() as WebGLFramebuffer;
    this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, this.frameBuffer);

    this.textures = [this.createTexture([400, 400])];

    if (this.feedback) this.textures.push(this.createTexture([400, 400]));
  }

  protected createTexture(size: number[]): WebGLTexture {

    const gl = this.manager.gl;
    const gl2 = this.manager.gl as WebGL2RenderingContext;

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

    const internalFormat = this.manager.webGL2IsSupported ? gl2.RGBA16F : gl.RGBA;

    const format = gl.RGBA;

    const type = this.manager.webGL2IsSupported ? gl2.FLOAT : gl.UNSIGNED_BYTE;

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
    this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, this.frameBuffer);
    if (this.feedback) {
      if (this.autoSwap && this.feedback) this.swap();
      this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, this.textures[this.write]);
    }
  }

  /**
   * Resize event called by the manager
   */
  onResize(size: number[]) {
    /**
     * Copy texture and write it back after a resize event
     * This prevents data loss after rewriting since we have to create new textures with new sizes
     */
    if (this.feedback) {
      this.manager.copyRenderer.fragment.uniforms[0].source = () => this.output();
      this.manager.copyRenderer.setSize(size);
      this.manager.copyRenderer.onResize();
      this.manager.copyRenderer.update();
      this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, this.frameBuffer);
      this.textures[this.write] = this.manager.copyRenderer.output;
      this.textures[this.read] = this.createTexture(size);
    }
    /**
     * If there is no feedback, no data can be lost
     */
    else this.textures[this.write] = this.createTexture(size);

    this.manager.gl.bindFramebuffer(this.manager.gl.FRAMEBUFFER, this.frameBuffer);
    this.manager.gl.framebufferTexture2D(
      this.manager.gl.FRAMEBUFFER,
      this.manager.gl.COLOR_ATTACHMENT0,
      this.manager.gl.TEXTURE_2D,
      this.textures[this.write],
      0,
    );
  }

  /**
   * Access current read texture, since output is called after update
   * @param swap If swap is true, textures are swapped before getting the current read texture
   */
  output(swap?: boolean): WebGLTexture {
    if (swap && !this.autoSwap) this.swap();

    if (!this.feedback) return this.textures[this.write];
    else return this.textures[this.read];
  }

  /**
   * Swap textures
   */
  swap() {
    this.write = ++this.write % 2;
    this.read = ++this.read % 2;
    this.manager.gl.framebufferTexture2D(
      this.manager.gl.FRAMEBUFFER,
      this.manager.gl.COLOR_ATTACHMENT0,
      this.manager.gl.TEXTURE_2D,
      this.textures[this.write],
      0,
    );
  }
}
