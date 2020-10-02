import AnimationManager from '../AnimationManager';

export class Sensor {

  animation: AnimationManager;
  data: any;
  callbacks : { (data: any): void; } [];

  constructor(animation : AnimationManager) {
    this.animation = animation;
  }

  public subscribe(callback : {(data: any): void; }){
    this.callbacks.push(callback)
  }

  protected update(){
    for (let callback of this.callbacks){
      callback(this.data);
    }
  }

}