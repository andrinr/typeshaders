/**
 * The manager controls the scene and initiates the webgl rendering context
 */
import Element from './Element';
import Time from './Time';
import Victor = require('victor');

export interface IDimensions {
    size: Victor,
    aspectRatio: number
}

export default class Manager {
    canvasElement: HTMLCanvasElement;

    protected elements: Map<string, Element> = new Map();

    protected active: boolean;

    public dimensions: IDimensions;
    public time: Time;

    protected onPause: boolean;


    /**
     * @param divName Requires the name of the canvas gl object in order to access it
     */
    constructor(divName: string) {
        this.canvasElement = document.getElementById(divName) as HTMLCanvasElement;
        this.canvasElement.getContext('2d').imageSmoothingEnabled = false;
        this.active = true;
        this.onPause = true;

        // bindings
        this.onResize = this.onResize.bind(this);
        this.run = this.run.bind(this);

        // event listeners
        window.addEventListener('resize', this.onResize);

        this.time = new Time();

        // init dimensions
        this.dimensions = {
            size: new Victor(this.canvasElement.width, this.canvasElement.height),
            aspectRatio: this.canvasElement.width / this.canvasElement.height
        };
        // start animation
        this.init();
    }

    setElement(element: Element, hash: string){
        // Basic vertex shader which simply passes the vertices to the fragment shader
        this.elements.set(hash,element);
        this.elements.get(hash).start();
        this.elements.get(hash).context = this.canvasElement.getContext('2d');

        this.onResize();
        this.elements.get(hash).onResize();
    }

    removeElement(hash: string){
        this.elements.delete(hash);
    }

    init() {
        this.run();
    }

    run() {
        this.time.update();

        this.elements.forEach(
          (value, key) => {
            if (!value.isInGame){
                this.elements.delete(key);
            }
            else{
                value.update();
            }
          }
        );

        if (this.active)
            window.requestAnimationFrame(this.run);
    }

    onResize() {
        this.dimensions.size.x = document.documentElement.clientWidth;
        this.dimensions.size.y = document.documentElement.clientHeight;
        this.dimensions.aspectRatio = document.documentElement.clientWidth / document.documentElement.clientHeight;
        this.canvasElement.width = document.documentElement.clientWidth;
        this.canvasElement.height = document.documentElement.clientHeight;
    }


    destroy() {
        this.active = false;
    }

    activate(){
        this.active = true;
    }
}