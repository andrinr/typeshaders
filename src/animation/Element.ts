import Manager from './Manager';


export interface IDimensions {
    size: number[],
    aspectRatio: number
}

/**
 * The parent class for all elements
 */
export default class Element {

    context: CanvasRenderingContext2D;

    protected manager: Manager;
    protected hash: string;
    protected visible: boolean;

    constructor(manager: Manager) {
        this.manager = manager;
        this.visible = true;
        this.genHash();
        this.manager.setElement(this, this.hash);
    }

    start() {

    }

    update() {

    }

    onResize() {

    }

    deactivate(){
        this.manager.removeElement(this.hash);
    }

    genHash(){
        this.hash = this.manager.time.milliSeconds.toString() + this.constructor.name;
    }

    get isInGame(): boolean{
        return this.visible;
    }
}