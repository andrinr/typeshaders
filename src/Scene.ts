/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */
import {Renderer} from './Renderer';
import {Manager} from './Manager';

export interface ITime {
  frameCount: number;
  milliSeconds: number;
  delta: number;
}

export interface IDimensions {
  size: number[];
  aspectRatio: number;
}

/**
 * The parent class for all scenes
 */
export abstract class Scene {
  /**
   *  renderers[n-1] is the default renderer which renders to the canvas, all others will render to a fbo
   */
  renderers: Renderer[];
  time: ITime;
  dimensions: IDimensions;

  protected manager: Manager;

  protected constructor(manager: Manager) {
    this.manager = manager;
    this.renderers = [];
    this.manager.set(this);
  }

  /* tslint:disable:no-empty */
  start() {}

  /* tslint:disable:no-empty */
  update() {}

  /* tslint:disable:no-empty */
  onResize() {}

  /* tslint:disable:no-empty */
  onMouseMove(pos: number[], vel: number[]) {}
}
