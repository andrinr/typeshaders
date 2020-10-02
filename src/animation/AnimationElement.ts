import AnimationManager from "@/game/AnimationManager";
import AnimationTime from "@/game/AnimationTime";
import Victor from "victor";


export interface IDimensions {
    size: number[],
    aspectRatio: number
}

/**
 * The parent class for all scenes
 */
export default class AnimationElement {
    /**
     *  renderers[n-1] is the default renderer which renders to the canvas, all others will render to a fbo
     */
    context: CanvasRenderingContext2D;

    protected manager: AnimationManager;
    protected hash: string;
    protected inGame: boolean;

    constructor(manager: AnimationManager) {
        this.manager = manager;
        this.inGame = true;
        this.genHash();
        this.manager.setElement(this, this.hash);
    }

    start() {

    }

    update() {

    }

    onResize() {

    }

    onMouseMove() {

    }

    onRotation(){

    }

    onTouchStart(){

    }

    onClick(){

    }

    onKey(){

    }

    deactivate(){
        this.manager.removeElement(this.hash);
    }

    genHash(){
        this.hash = this.manager.time.milliSeconds.toString() + this.constructor.name;
    }

    get isInGame(): boolean{
        return this.inGame;
    }
}