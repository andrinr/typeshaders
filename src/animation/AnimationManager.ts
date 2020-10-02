/**
 * The manager controls the scene and initiates the webgl rendering context
 */
import AnimationElement from './AnimationElement';
import AnimationTime from './AnimationTime';

export interface IDimensions {
    size: number[],
    aspectRatio: number
}

export default class AnimationManager {
    canvasElement: HTMLCanvasElement;

    protected elements: Map<string,AnimationElement> = new Map();

    protected active: boolean;

    public dimensions: IDimensions;
    public time: AnimationTime;

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

        this.time = new AnimationTime();

        // init dimensions
        this.dimensions = {
            size: [this.canvasElement.width, this.canvasElement.height],
            aspectRatio: this.canvasElement.width / this.canvasElement.height
        };
        // start animation
        this.init();
    }

    requestDeviceOrientationIOS() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response == 'granted') {
                        this.addOrientationEventListener();
                    }
                })
                .catch(console.error)
        } else {
            this.addOrientationEventListener();
        }
    }

    setElement(element: AnimationElement, hash: string){
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

        for (const key of this.elements.keys()){
            if (!this.elements.get(key).isInGame){
                this.elements.delete(key);
            }
            this.elements.get(key).update();
        }

        if (this.active)
            window.requestAnimationFrame(this.run);
    }

    onResize() {

        this.dimensions = {
            size: [document.documentElement.clientWidth, document.documentElement.clientHeight],
            aspectRatio: document.documentElement.clientWidth / document.documentElement.clientHeight
        };

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