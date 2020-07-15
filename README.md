# typeshaders

Easy WebGL shader playground in Typescript.

## State of the project
This project is still in early stages, 
and there will be major changes and added examples in the future.

## Get started

#### 0. Installation

```npm i typeshaders```

#### 1. Create a canvas object 

Make sure to add a custom id to the object. 
The shader will be rendered on this canvas.

````html
<canvas id = "canvasID"/>
````

#### 2. Create a new manager

Pass the custom id to the ``Manager``.

The ``Manager`` function will handle the animation frames, as well as the ``Scene``
and its corresponding ``Renderer``'s. 

````typescript
const manager = new Manager("canvasID");
````

#### 3. Create a new Scene

Implement the ``start`` and if desired the ``update`` method. 
The ``start`` function is called when the Scene is initialized, 
the ``update`` function is called once in each frame. 

Don't override the constructor and use the ``start`` function,
unless you know what you are doing.

````typescript
class myScene extends Scene{

    start(){
 
    }

    update(){
    
    }
}
````

##### 3.1 Create a new Shader

Each ``Shader`` requires a codestring, shadertype and an array containing the required ``IUniform`` objects. 
The name of the uniform object needs to be written just as in the codestring describing the shader.
````typescript
new Shader(
    `
    precision mediump float;
    uniform vec4 uColor;
    void main () {
        gl_FragColor = uColor;
    }
    `,
    EShaderTypes.fragment,
    [
      {
        name: 'uColor',
        source:  [0,1,1,1],
        type: EUniformTypes.f4
      }
    ] 
)
````

##### 3.2 Create a new Renderer

Each ``Renderer`` consists of a fragment shader, vertex shader, geometry object and
optionally a ``FBO`` (frameBufferObject). Optionally one can set the number of iterations
the program will be run in each frame. In case the shader requires a feedback loop,
we can set ``autoFeedback`` to true.

````typescript
start(){
    this.renderers.push(
        new Renderer(
            {
                vertex: VertexSahderObject,
                fragment: FragmentShaderObject,
                geo: GeometryShaderObject,
                fbo: FrameBufferObject,
                iterations: 1,
                autoFeedback: false
            }
        )   
    )
}
````

In most cases we only want to render on a plain 2D plane. 
In that case we can simply use the ``baseVertexShader`` and ``baseGeo``
which can be found inside the ``Manger`` class.

**IMPORTANT:** the last element of the ``renderers`` array is expected
to have no ``FBO`` object attached and will automatically render to the canvas object. 

##### 3.3 Feedback loops

To create a feedback loop, we need to set ``autoFeedback`` parameter of the specific ``Renderer`` to true.
Furthermore inside the fragment shader the very first sampler2D variable needs to be called
*feedback*. *Typeshaders* uses a ping pong technique where each ``FBO`` object has two textures, which are
alternately associated the role of the read and write texture. 

A standard fragment shader which can used along the ``baseVertexShader``
looks like this:

````glsl
precision mediump float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D feedback;

void main() {
    gl_FragColor = texture2D(feedback,vUv) + vec4(0.002,0,0,0);
}
````

##### 3.4 FBO's

Inside the ``Scene`` class we can create a ``FBO`` as following:
````typescript
const fbo1 = new FBO(this.manager, true)
````

The second parameter enables the feedback inside the ``FBO``. 

The reason for differentiation between the two variables: 
``autoFeedback`` of the ``Renderer`` class and ``feedback`` of the ``FBO`` class is as follows:

There are certain scenarios where we want to have the possibility of a feedback loop, but not 
make use of it in each frame. Then one would set ``àutoFeedback`` to false, ``feedback`` to true,
and manually swap the ``FBO`` write and read textures. We can for example simply call ``FBO.output(true)``
to get the output of the ``FBO`` object and swap the textures. 

We can then pass this ``FBO`` to a ``Renderer``:

````typescript
new Renderer(
    {
        vertex: VertexSahderObject,
        fragment: FragmentShaderObject,
        geo: GeometryShaderObject,
        fbo: fbo1,
        iterations: 1,
        autoFeedback: true
    }
)   
````

And use the output of the ``FBO`` as a uniform for a fragment shader:

````typescript
new Shader(
    `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    
    uniform sampler2D feedback;
    uniform sampler2D fbo1;

    void main () {
        gl_FragColor = texture2D(feedback,vUv) + texture2D(fbo1,vUv);
    }
    `,
    EShaderTypes.fragment,
    [
      {
        name: 'fbo1',
        source: () => fbo1.output(),
        type: EUniformTypes.tex
      }
    ] 
)
````
