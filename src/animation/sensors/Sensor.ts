import Manager from '../Manager';

export class Sensor {

  animation: Manager;
  data: any;
  callbacks : { (data: any): void; } [];

  constructor(animation : Manager) {
    this.animation = animation;
  }

  public subscribe(callback : {(data: any): void; }){
    this.callbacks.push(callback)
  }

  protected notify(){
    for (let callback of this.callbacks){
      callback(this.data);
    }
  }

}