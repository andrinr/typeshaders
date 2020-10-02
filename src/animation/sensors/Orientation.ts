import { Sensor } from './Sensor';
import AnimationManager from '../AnimationManager';

export interface IOrientation {
  beta: number;
  gamma: number;
  alpha?: number;
}

export class Orientation extends Sensor{
  data : IOrientation;

  constructor(animation: AnimationManager)
  {
    super(animation);
    this.data = {
      beta : undefined,
      gamma : undefined,
      alpha : undefined
    };
    this.addOrientationEventListener = this.addOrientationEventListener.bind(this);
    this.requestDeviceOrientationIOS();
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

  addOrientationEventListener(){
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (event) => {
        this.data.beta = event.beta;
        this.data.gamma = event.gamma;
        this.update()
      }, true);
    } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (event) => {
        this.data.beta = event.acceleration.x * 2;
        this.data.gamma = event.acceleration.y * 2;
        this.update();
      }, true);
    } else {
      window.addEventListener("MozOrientation", (event) => {
        // @ts-ignore
        this.data.beta = event.x * 50;
        // @ts-ignore
        this.data.gamma = event.y * 50;
        this.update();
      }, true);
    }
  }
}