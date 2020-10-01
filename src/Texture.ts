export interface ITextureProps {
  feedback? : boolean
  fixedSize? : number[],
}


export class Texture {
  protected static defaultProps : ITextureProps= {
    feedback : false,
    fixedSize : undefined
  };
  protected props : ITextureProps;

  constructor(props: ITextureProps) {
    this.props = Object.assign({}, Texture.defaultProps, props);

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

}