import { EShaderTypes, Manager, Renderer, Scene, Shader } from '../src';

test('Initialisation', () => {
  document.body.innerHTML =
    '<canvas id="canvasID">' +
    '</canvas>';

  const manager = new Manager('canvasID');

  expect(manager.webGL2IsSupported).toBe(false);

  const scene = new TestScene(manager);

  //expect(manager.gl.getError()).toBe(manager.gl.NO_ERROR);
});


class TestScene extends Scene{
  start(){
    this.renderers.push(
      new Renderer(
        {
          vertex: this.manager.baseVertexShader,
          fragment: new Shader(
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
            
            void main() {
                gl_FragColor = vec4(1,0,1,1);
            }
            `,
            EShaderTypes.fragment,
            []
          ),
          geo: this.manager.baseGeo
        }
      )
    )
  }

  update(){

  }
}