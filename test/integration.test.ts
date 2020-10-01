import { EShaderTypes, FBO, ShaderAnimation, Renderer, Scene, Shader } from '../src';

test('Initialisation', () => {
  document.body.innerHTML =
    '<canvas id="canvasID">' +
    '</canvas>';

  const manager = new ShaderAnimation({
    canvasID: 'canvasID'
  });

  expect(manager.webGL2IsSupported).toBe(false);

  new TestScene(manager);

  console.log(manager.gl.getError());
});


class TestScene extends Scene{
  start(){
    const fbo = new FBO(
      {
        manager: this.manager,
        feedback: true,
        autoSwap: true,
        outputTextures: 3
      }
    );
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
          geo: this.manager.baseGeo,
          fbo: fbo,
          autoFeedback: true
        }
      )
    )
  }

  update(){

  }
}