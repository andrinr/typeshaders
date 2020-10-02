/**
 * WebGL typescript integration for shaders
 * Andrin Rehmann 2020
 */
import {Renderer} from './Renderer';
import {ShaderAnimation} from './ShaderAnimation';

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
  time: ITime;
  dimensions: IDimensions;

  protected manager: ShaderAnimation;

  constructor(manager: ShaderAnimation) {
    this.manager = manager;
    this.manager.set(this);
  }

  /* tslint:disable:no-empty */
  start() {}

  /* tslint:disable:no-empty */
  private updateDev() {}

  /* tslint:disable:no-empty */
  update() {}

  /* tslint:disable:no-empty */
  onResize() {}

  /* tslint:disable:no-empty */
  onMouseMove(pos: number[], vel: number[]) {}
}
