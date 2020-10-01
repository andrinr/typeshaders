import {Scene} from './Scene';


/**
 * The Animation class handles frame animation and simple interaction Events
 */
export class Animation {

  protected prevMousePos: number[];
  protected active: boolean;
  protected startTime: number;

  protected scene: Scene;
  protected canvas: HTMLCanvasElement;

  /**
   *  Animation
   */
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;
    // bindings
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.run = this.run.bind(this);
    // event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    // start animation
    this.start();
  }

  set(scene: Scene) {
    this.scene = scene;

    // initialize time
    this.scene.time = {
      frameCount: 0,
      milliSeconds: 0,
      delta: 1 / 60,
    };
    this.startTime = new Date().getTime();

    this.scene.dimensions = {
      size: [this.canvas.width, this.canvas.height],
      aspectRatio: this.canvas.width / this.canvas.height,
    };

    this.scene.start();
    this.onResize();
    this.scene.onResize();
  }

  start() {
    this.run();
  }

  run() {
    if (this.scene) {
      // CPU updates before GPU updates
      this.scene.update();

      // time
      this.scene.time.frameCount++;
      const millis = new Date().getTime() - this.startTime;
      this.scene.time.delta = millis - this.scene.time.milliSeconds;
      this.scene.time.milliSeconds = new Date().getTime() - this.startTime;
    }

    if (this.active) window.requestAnimationFrame(this.run);
  }

  onResize() {
    if (this.scene) {
      // CPU updates before GPU updates
      this.scene.onResize();
      this.scene.dimensions = {
        size: [this.canvas.width, this.canvas.height],
        aspectRatio: this.canvas.width / this.canvas.height,
      };
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.scene) {
      const rect: DOMRect = this.canvas.getBoundingClientRect();
      // calculate relative mouse position to canvas element
      const x = Math.min(Math.max((event.x - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((rect.height - event.y - rect.top) / rect.height, 0), 1);
      if (!this.prevMousePos) this.prevMousePos = [x, y];
      const speed = [x - this.prevMousePos[0], y - this.prevMousePos[1]];
      this.prevMousePos = [x, y];
      this.scene.onMouseMove([x, y], speed);
    }
  }

  destroy() {
    this.active = false;
  }
}
