/**
 * Created by hh on 22/07/2017.
 */

import Utils from "./Utils";

// 包含一些基本的信息,主要是为Display类提供数据支持
export class Instance{
    constructor(){
        this.height = 0;
        this.width = 0;
        this.x = 0;			    // 这个x,y是骨骼的偏移位置（具体实现在bone的updateDisplay的时候具体赋值）
        this.y = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.alpha = 1;
        this.originX = 0;		// 这里是位图旋转中心，就是决定关节joint的位置
        this.originY = 0;		// 如果为0,0就是左上角为旋转中心
        this.rotation = 0;
        this.visible = true;
        this.size = 1; 			// 骨骼按比例渲染
        this.scene = null;
        this.parent = null;
    }

    render(){} // 应该被子类重写

    _render(context) {
        if(this.visible && this.alpha > 0){
            context.save();
            this._transform(context); // 根据自身的参数映射到ctx中去
            this.render(context);
            context.restore();
        }
    };

    _transform(context) {

        context.translate(this.x*this.size, this.y*this.size);
        if(this.size !== 1 ){ //整体上缩放
            context.scale(this.size, this.size);
        }
        if(this.rotation % 360 > 0){
            context.rotate(this.rotation % 360 / 180 * Math.PI);
        }
        if(this.scaleX !== 1 || this.scaleY !== 1) {
            context.scale(this.scaleX, this.scaleY);
        }

        context.translate(-this.originX, -this.originY);

        context.globalAlpha *= this.alpha;
    };
}

/**
 * Display 渲染类
 * 具体有两种渲染方式：矢量渲染和图片渲染
 * x,y是骨骼的偏移位置，具体的由Armature类的x,y决定。
 */
export default class Display extends Instance{

    constructor(image, frame){
        super();
        this.image = image;
        this.frame = Utils.type.isArray(frame) ? frame : [0, 0, image.width, image.height];  //注意位图资源先加载
        this.width = this.frame[2];
        this.height = this.frame[3];
        this.originX = -this.frame[4] || 0;  //origin参数在_render方法里面需要
        this.originY = -this.frame[5] || 0;
        this.isVector = false;
    }

    //对实时换装的功能的支持
    changeImage(image,frame){
        this.image = image;
        this.frame = Utils.type.isArray(frame) ? frame : [0, 0, image.width, image.height];  //注意位图资源先加载
        this.width = this.frame[2];
        this.height = this.frame[3];
        this.originX = -this.frame[4] || 0;  //origin参数在_render方法里面需要
        this.originY = -this.frame[5] || 0;
    }

    render(context) {
        //  矢量的渲染实现 实际上这个函数虽然每次都被调用，但是并不承担变化功能，相反，我们是每次在_render函数里面改变context(相对运动原理)，所以这就解释了为什么_render中的写法比较奇怪
        if(this.isVector){ // 抽象框架方式渲染
            context.strokeStyle="#aaa";
            context.strokeRect(0,0,this.width,this.height);
        }else{ //具体蒙皮方式渲染
            context.drawImage(this.image, this.frame[0], this.frame[1], this.frame[2], this.frame[3], 0, 0, this.width, this.height);
        }
    }
}
