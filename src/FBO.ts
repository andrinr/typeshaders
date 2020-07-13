/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 *
 */

import Manager from './Manager';

/**
 * Creates a framebuffer object
 */
export default class FBO {
  frameBuffer: WebGLFramebuffer;
  protected manager: Manager;
  protected feedback: boolean;
  protected autoSwap: boolean;
  protected textures: WebGLTexture[];
  protected write: number;
  protected read: number;

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
    this.manager.gl.activeTexture(this.manager.gl.TEXTURE0);
    const texture = this.manager.gl.createTexture();
    this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, texture);
    this.manager.gl.texParameteri(
      this.manager.gl.TEXTURE_2D,
      this.manager.gl.TEXTURE_MAG_FILTER,
      this.manager.gl.NEAREST,
    );
    this.manager.gl.texParameteri(
      this.manager.gl.TEXTURE_2D,
      this.manager.gl.TEXTURE_MIN_FILTER,
      this.manager.gl.NEAREST,
    );
    this.manager.gl.texParameteri(
      this.manager.gl.TEXTURE_2D,
      this.manager.gl.TEXTURE_WRAP_S,
      this.manager.gl.CLAMP_TO_EDGE,
    );
    this.manager.gl.texParameteri(
      this.manager.gl.TEXTURE_2D,
      this.manager.gl.TEXTURE_WRAP_T,
      this.manager.gl.CLAMP_TO_EDGE,
    );
    this.manager.gl.texImage2D(
      this.manager.gl.TEXTURE_2D,
      0,
      this.manager.gl.RGBA,
      size[0],
      size[1],
      0,
      this.manager.gl.RGBA,
      this.manager.gl.UNSIGNED_BYTE,
      null,
    );
    this.manager.gl.bindTexture(this.manager.gl.TEXTURE_2D, null);
    return texture as WebGLTexture;
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
    } else this.textures[this.write] = this.createTexture(size);
    /**
     * If there is no feedback, no data can be lost
     */

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
   * @param swap If swap is true, textures are swapped before
   */
  output(swap?: boolean): WebGLTexture {
    if (swap && !this.autoSwap) this.swap();

    if (!this.feedback) return this.textures[this.write];
    else return this.textures[this.read];
  }

  /**
   * Swap textures, I'm not sure if this method or the method of having two fbos is faster
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
