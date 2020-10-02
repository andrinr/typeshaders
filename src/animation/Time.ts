/**
 * Currently kinda hacky, needs to be adjusted if time played needs to be known
 */
export default class Time{
    frameCount: number;
    milliSeconds: number;
    delta: number;

    startMilliSeconds: number;

    isRunning: boolean;

    constructor() {
        this.frameCount = 0;
        this.milliSeconds = 0;
        this.delta = 0;
        this.isRunning = false;
        this.startMilliSeconds = new Date().getTime();
    }

    update(){
        if (this.isRunning){
            this.frameCount++;
            const millis = new Date().getTime() - this.startMilliSeconds;
            this.delta = millis - this.milliSeconds;
            this.milliSeconds = new Date().getTime() - this.startMilliSeconds;
        }
        else{
            this.delta = 0;
        }
    }

    start(){
        this.isRunning = true;
        this.milliSeconds = 0;
        this.startMilliSeconds = new Date().getTime();
    }

    pause(){
        this.isRunning = false;
    }

    stop(){
        this.isRunning = false;
        this.frameCount = 0;
        this.milliSeconds = 0;
        this.delta = 0;
        this.startMilliSeconds = new Date().getTime();
    }

}
