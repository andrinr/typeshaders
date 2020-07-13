/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */

/**
 * The geo class handles geometry
 */
export default class Geo {
  vertices: Float32Array;
  vertexBuffer: WebGLBuffer;
  gl: WebGLRenderingContext;
  dimensions: number;

  constructor(vertices: number[]) {
    this.vertices = new Float32Array(vertices);
  }

  initialize(gl: WebGLRenderingContext, dimensions?: number) {
    this.gl = gl;
    this.dimensions = dimensions || 2;
    this.vertexBuffer = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
  }

  update(program: WebGLProgram) {
    const attribLocation = this.gl.getAttribLocation(program, 'aPosition');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(
      attribLocation, this.dimensions, this.gl.FLOAT, false, 0, 0);

    this.gl.enableVertexAttribArray(attribLocation);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / this.dimensions);
  }
}
