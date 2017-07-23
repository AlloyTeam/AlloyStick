/**
 * Created by iconie on 20/07/2017.
 *
 * AlloyEngine主要提供绘制层功能，AlloyStick主要提供数据层功能
 *
 */

import Utils from "./Utils";
import FpsMonitor from "./assist/FpsMonitor";

export default class Scene{

    constructor(context){
        this.context = context;
        this.canvas = context.canvas;
        this.children = [];
        this.cb = null;   //函数的额外回调函数
        this.paused = false;
        this.fps = 60;
        this.avgFPS = 0;  //实际运行的每秒的fps
        this.intervalID = null;
    }

    addObj(obj){
        obj.scene = this;
        this.children.push(obj);
    };

    removeObj(obj){
        let index = this.children.indexOf(obj);
        if(index > 0 || index < this.children.length){
            this.children.splice(index,1);
        }
    };

    showFPS(dom){
        this.fpsInstance = new FpsMonitor(dom);
    };

    hideFPS(){
        this.fpsInstance.destory();
        this.fpsInstance = undefined;
    };

    start(cb){  // 该函数需要首先被调用
        this.cb = Utils.type.isFunction(cb) ? cb : null;
        requestAnimationFrame(this.loop.call(this));
    };

    pause(value){
        if(value === undefined){
            this.paused = !this.paused;
        }else{
            this.paused = value;
        }
    };

    clear(x, y, width, height) {
        if(arguments.length >= 4){
            this.context.clearRect(x, y, width, height);
        }else{
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
    };

    render(context,rect){
        if (!context) context = this.context;
        if(rect){
            this.clear(rect.x,rect.y, rect.width, rect.height)
        }else{
            this.clear();
        }

        //把Scene中的Obj都render
        for (let i = 0, len = this.children.length; i < len; i++) {
            this.children[i].render(context);
        }
    };

    /*
    * @iconie 重写loop函数,现在可以针对同一个场景内的不同实例运用不同的fps,从而提供了一种控制相对速度的更好的方法
    * */

    loop(){
        let lastTime = Date.now(),
            frameCountPerSecond = [],
            preCountTimes = [],
            sumDurations = [],
            sumIntervals = [],
            frameDrawCounts = [],
            intervals = []
        ;

        let that = this;
        let reRender = false;

        for(let i = 0 ; i < this.children.length;i++){
            frameCountPerSecond[i] = 0;
            preCountTimes[i] = lastTime;
            sumDurations[i] = 0;
            sumIntervals[i] = 0;
            frameDrawCounts[i] = 0;
            intervals[i] = 1000 / this.children[i].fps;
        }

        return function childLoop(){

            let now = Date.now(),
                duration = now - lastTime;

            for(let i = 0 ; i < that.children.length ; i+=1){

                frameCountPerSecond[i] += 1;

                if (now - preCountTimes[i] > 1000){
                    //每超过一秒更新一些数值记录
                    that.children[i].avgFPS = frameCountPerSecond[i];

                    frameCountPerSecond[i] = 0;
                    preCountTimes[i] = now;
                    sumDurations[i] = 0;
                    sumIntervals[i] = 0;
                    frameDrawCounts[i] = 1;
                }

                if (!that.paused){
                    sumDurations[i] += duration;
                    sumIntervals[i] = intervals[i] * frameDrawCounts[i];

                    if(that.children[i].fps >= 60 || sumDurations[i] >= sumIntervals[i]){
                        that.children[i].update(duration); //update到下一帧或者下n帧,这个在children中可以进行设置
                        reRender = true;
                        frameDrawCounts[i]+=1;
                    }
                }
            }

            if(that.fpsInstance){
                that.fpsInstance.monitorFPS(that);
            }

            if (reRender){
                if(that.cb)that.cb(duration);
                that.render(that.context);
            }

            lastTime = now;
            requestAnimationFrame(childLoop);
            reRender = false;
        }
    };
}
