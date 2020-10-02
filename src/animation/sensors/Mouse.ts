import Victor = require('victor');
import { Sensor } from './Sensor';
import Manager from '../Manager';

export interface IMouse {
  pos: Victor,
  vel: Victor
}

export class Mouse extends Sensor{
  data : IMouse;
  prevPos : Victor;

  constructor(animation: Manager)
  {
    super(animation);
    this.data = {
      pos : new Victor(0,0),
      vel : new Victor(0,0)
    };
    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseMove(event: MouseEvent)
  {
    const rect: DOMRect = this.animation.canvasElement.getBoundingClientRect();

    this.data.pos.x = Math.min(Math.max((event.x - rect.left), 0),  rect.width);
    this.data.pos.y = Math.min(Math.max((rect.height - event.y - rect.top) , 0),  rect.height);

    if (!this.prevPos){
      this.prevPos.x = this.data.pos.x;
      this.prevPos.y = this.data.pos.y;
    }

    this.data.vel.zero().add(this.data.pos).subtract(this.prevPos);
    this.prevPos.zero().add(this.data.pos);

    this.notify();
  }
}