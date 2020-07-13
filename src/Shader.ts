/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */

export enum EUniformTypes {
  'f','i','f1', 'f2', 'f3', 'f4', 'tex'
}

export enum EShaderTypes {
  'vertex',
  'fragment'
}

export interface IUniform {
  name: string;
  source: any | object;
  field?: string;
  type: EUniformTypes;
}

/**
 * Shader class handles uniforms and code string of a shader and compiles it
 * If a feedback loop is desired, the uniform variable of type sampler2D needs
 * to be present and on top of the other sampler2D variables.
 */
export default class Shader {
  codeString: string;
  glShader: WebGLShader;
  uniforms: IUniform[];
  type: EShaderTypes;

  constructor(codeString: string, type: EShaderTypes, uniforms?: IUniform[]) {
    this.codeString = codeString;
    this.type = type;
    if (uniforms)
      this.uniforms = uniforms;
  }

  compileShader(context: WebGLRenderingContext) {
    const type = this.type === EShaderTypes.vertex ? context.VERTEX_SHADER : context.FRAGMENT_SHADER;

    const compiledShader = context.createShader(type) as WebGLShader;
    context.shaderSource(compiledShader, this.codeString);
    context.compileShader(compiledShader);

    if (!context.getShaderParameter(compiledShader, context.COMPILE_STATUS))
      throw new Error(`Error compiling vertex shader: ${context.getShaderInfoLog(compiledShader)}`);

    this.glShader = compiledShader;
  }
}
