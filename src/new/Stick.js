/**
 * Created by iconie on 20/07/2017.
 */

import Display from './Display';
const PI = Math.PI;
const HALF_PI = Math.PI * 0.5;
const DEG = PI/180;

class Node{
    constructor(x, y, rotation){
        /**  渲染变量 **/
        this.x = x || 0;
        this.y = y || 0;
        this.rotation = rotation || 0;
        this.offR = 0;  //是否旋转过一圈 ，所以真实是角度应该是rotation+360*offR
        this.scaleX = 1;
        this.scaleY = 1;
        this.alpha = 1;
        this.frame = 1;
    };

    initValue(data){
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.scaleX = data.scaleX || 1;
        this.scaleY = data.scaleY || 1;
        this.alpha = data.alpha || 1;
        this.frame = data.frame || 1;
        this.offR = data.offR || 0;
    }
}

class TweenNode extends Node{
    constructor(x, y, rotation){
        super(x, y, rotation);
        /**  _sXX起始变量  _dXX差值变量 根据currentPrencent调用tweento来更新 **/
        this._sR = 0;   // from节点的rotation
        this._sX = 0;	// from节点的x
        this._sY = 0;	// from节点的y
        this._sSX = 0;	// from节点的scaleX
        this._sSY = 0;	// from节点的scaleY
        this._sA = 0;	// from节点的alpha
        this._dR = 0;	// rotation的差值
        this._dX = 0;	// x的差值
        this._dY = 0;	// y的差值
        this._dSX = 0;	// scaleX的差值
        this._dSY = 0;	// scaleY的差值
        this._dA = 0;	// alpha的差值
    };

    betweenValue(from, to) {
        this._sR = from.rotation;
        this._sX = from.x;
        this._sY = from.y;
        this._sSX = from.scaleX;
        this._sSY = from.scaleY;
        this._sA = from.alpha;
        if(to.offR){
            this._dR = to.rotation + to.offR * 360 - this._sR;
        }else{
            this._dR = to.rotation - this._sR;
        }

        // 基于输出数据是跨度不超过180
        if(this._dR > 180 ){
            this._dR = this._dR-360;
        }else if(this._dR < -180){
            this._dR = this._dR + 360;
        }

        this._dX = to.x - this._sX;
        this._dY = to.y - this._sY;
        this._dSX = to.scaleX - this._sSX;
        this._dSY = to.scaleY - this._sSY;
        this._dA = to.alpha - this._sA;
    };

    tweenTo(currentPercent){
        this.rotation = this._sR + this._dR * currentPercent;
        this.x = this._sX + this._dX * currentPercent;
        this.y = this._sY + this._dY * currentPercent;

        if(this._dSX){
            this.scaleX = this._sSX + this._dSX * currentPercent;
        }else{
            this.scaleX = NaN;
        }
        if(this._dSY){
            this.scaleY = this._sSY + this._dSY * currentPercent;
        }else{
            this.scaleY = NaN;
        }
        if(this._dA){
            this.alpha = this._sA + this._dA * currentPercent;
        }else{
            this.alpha = NaN;
        }
    };
}

class Tween{
    constructor(tweenNode){
        this.tweenNode = tweenNode;
        // 下面一块的变量是在playTo的时候才具体赋值
        this.nodeList = [];
        this.delay = 0;
        this.transitionFrames = 0;          // 过渡动画的需要的总帧数
        this.totalFrames = 0; 	 			// 总帧数 是要演示使用的共多少帧(包括补间帧)
        this.keyFrametotal = 0;             // 总的关键帧数 区分totalFrames 在playTo的时候才具体赋值
        this.loopTpye = -2;                 // 循环类型，-1静态显示(包括循环不循环)，-2动态循环显示，-3动态不循环显示
        this.ease = true;        			// 默认为true
        this.rate = 1;           		    // 显示帧的速率
        this.hasTransition = true;          // 用于表示过渡动画展示了没有(每次playTo后都重新更新)
        this.currentPercent = 0;
        this.currentFrame = 0;
        this.isComplete = false;
        this.isPause = false;
        this.betweenFrame = 0;              // 运行到某个关键帧obj的frame
        this.listEndFrame = 0;              // 某个关键帧obj自身加上前面所有的关键帧obj的frame之和，临界点判断是否要切换from，to的node
    }

    update(easeFunction){
        if(this.isComplete || this.isPause){
            return;
        }
        if(this.hasTransition){
            this.currentFrame += this.rate;
            this.currentPercent = this.currentFrame / this.transitionFrames;
            this.currentFrame %= this.transitionFrames;
            if(this.currentPercent < 1){
                if(this.ease){
                    this.currentPercent = Math.sin(this.currentPercent * HALF_PI);
                }
            }else {
                /***  这里过渡动画执行结束后，根据loopTpye切换参数更新currentPercent  ***/
                this.hasTransition = false;

                //静态显示  TODO 输出数据上没有输出静态显示的数据，待优化
                if(this.loopTpye === -1){
                    this.currentPrecent = 1;
                    this.isComplete = true;   // 静态显示设置了isComplete，之后的update都不用做逻辑更新了
                }
                // 动态循环显示
                if(this.loopTpye === -2){
                    if(this.delay !== 0){
                        this.currentFrame = (1 - this.delay) * this.totalFrames;
                        this.currentPercent += this.currentFrame / this.totalFrames;
                    }
                    this.currentPercent %= 1;  // 这里我们更新了currentPercent
                    this.listEndFrame = 0;
                }
                // 动态不循环显示
                if(this.loopTpye === -3){
                    this.currentPercent = (this.currentPercent-1)*this.transitionFrames/this.totalFrames;
                    if(this.currentPercent <1){
                        this.currentPrecent %= 1;
                        this.listEndFrame = 0;
                    }
                }

                this.updateCurrentPercent(easeFunction);
            }
        }else{
            this.currentFrame += this.rate;  // 每次update一次都会根据rate(显示速度)增加
            this.currentPercent = this.currentFrame / this.totalFrames;
            this.currentFrame %= this.totalFrames;
            if(this.loopTpye === -3 && this.currentPercent >= 1){
                // 动态不循环动画在循环动画执行一次后就停止了
                this.currentPercent = 1;
                this.isComplete = true;
            }else{
                this.currentPercent %= 1;
            }

            this.updateCurrentPercent(easeFunction);
        }
        this.tweenNode.tweenTo(this.currentPercent);
    };

    updateCurrentPercent(easeFunction){
        let playedKeyFrames = this.keyFrametotal * this.currentPercent;  // 相对于总关键帧和，运行到某个的当前帧数
        /*
         * 关键帧obj切换的时候更新node差值
         */
        if(playedKeyFrames <= this.listEndFrame-this.betweenFrame || playedKeyFrames > this.listEndFrame){
            this.listEndFrame = 0;
            let toIndex = 0,fromIndex = 0;
            // 循环显示的核心
            while(playedKeyFrames >= this.listEndFrame){
                this.betweenFrame = this.nodeList[toIndex].frame;
                this.listEndFrame += this.betweenFrame;
                fromIndex = toIndex;
                // 当运动到最后一个关键帧obj的时候，循环动画的时候，我们就使用from为最后一个关键帧obj，to为第一个关键帧obj
                if(++toIndex >= this.nodeList.length){
                    toIndex = 0;
                }
            }

            let fromNode = this.nodeList[fromIndex];
            let toNode = this.nodeList[toIndex];
            // 每当切换关节帧之间的动作 会更新node的差值
            this.tweenNode.betweenValue(fromNode, toNode);
        }

        // 这里我们换算currentPrecent，原来的currentPrecent是在总帧数上面，换算当前帧在某个关键帧obj的百分比
        this.currentPercent = 1 - (this.listEndFrame - playedKeyFrames) / this.betweenFrame;
        if(this.ease){
            if(easeFunction) this.currentPercent = easeFunction(this.currentPercent);
            else this.currentPercent = 0.5 * (1 - Math.cos(this.currentPercent * PI));
        }
    }
}

class Bone{
    constructor(roleName,boneName,display,alloysk){
        this.body = null;  		// 继承关系的父亲，一般都是armature类
        this._parent = null;  	// 骨骼上的父子关系
        this.name = boneName;
        this.display = display;
        this.tweenNode = new TweenNode();

        let boneData = alloysk.boneDatas[roleName][boneName] || {};

        this._lockX = boneData.x || 0;
        this._lockY = boneData.y || 0;
        this._lockZ = boneData.z || 0;

        // _parent父骨骼的_transform属性
        this._parentX = 0;
        this._parentY = 0;
        this._parentR = 0;

        // 根据update的时候赋值
        this._transformX = 0;		//要偏移的x
        this._transformY = 0;		//要偏移的y
    }

    changeImage(image,positionData){
        this.display.changeImage(image,positionData);
    }

    addChild(child){
        child._parent = this;
        return child;
    }

    getGlobalX(){
        return this._transformX + this._parentX;
    };
    getGlobalY(){
        return this._transformY + this._parentY;
    };
    getGlobalR(){
        return this.tweenNode.rotation + this._parentR;
    };

    update(){
        //bone的自身update
        if(this._parent){
            //更新parent属性
            this._parentX = this._parent.getGlobalX();
            this._parentY = this._parent.getGlobalY();
            this._parentR = this._parent.getGlobalR();

            let _dX = this._lockX  + this.tweenNode.x;
            let _dY = this._lockY  + this.tweenNode.y;
            let _r = Math.atan2(_dY, _dX)/*从 X 轴正向逆时针旋转到点 (x,y) 时经过的角度*/ + this._parentR * DEG;
            let _len = Math.sqrt(_dX * _dX + _dY * _dY);
            this._transformX = _len * Math.cos(_r);
            this._transformY = _len * Math.sin(_r);
        } else {
            //下面这句代码我们可以看出：
            //playTo过后Bone的tweenNode的起值(_sXX)和差值(_dXX)是赋值了，
            //而在这个Bone.update上面现有Tween的update，其实就是Bone.tweenNode的update(本质就是根据currentPercent来tweenTo来使到tweenNode的渲染值得到赋值)
            //所以下面两句代码中的tweenNode.x就是我所说的tween在每次update后的赋值
            this._transformX = this.tweenNode.x;
            this._transformY = this.tweenNode.y;
        }

        //display的update
        this.updateDisplay();
    };

    updateDisplay(){
        //也存在没有display渲染层的bone
        if(this.display){
            this.display.x = this._transformX + this._parentX;
            this.display.y = this._transformY + this._parentY;
            let rotation = this.tweenNode.rotation + this._parentR; //i delete node
            rotation%=360;
            if(rotation<0){
                rotation+=360;
            }
            this.display.rotation = rotation;

            if(isNaN(this.tweenNode.scaleX)){
            }else{
                this.display.scaleX = this.tweenNode.scaleX;
            }
            if(isNaN(this.tweenNode.scaleY)){
            }else{
                this.display.scaleY = this.tweenNode.scaleY;
            }
            if(!isNaN(this.tweenNode.alpha)){
                if(this.tweenNode.alpha){
                    this.display.visible = true;
                    this.display.alpha = this.tweenNode.alpha;
                }else{
                    this.display.visible = false;
                }
            }
        }
    }
}
/**
 * @obj 包含的内容:
 *   roleName
 *   image
 *   data
 *   fps(optional)
 * */
export default class Armature{
    constructor(obj){
        this.visible = true;
        this.alpha = 1;
        this.x = 0;
        this.y = 0;

        this.boneList = [];		   // 两种不同的结构对bone的存储
        this.boneObjs = {};
        this.tweenObjs = {};       // 装的是骨骼的tween类
        this.roleName = obj.roleName;  // 记录这个armature的name

        this.fps = obj.fps || 60;             // 一秒重绘多少次画面
        this.avgFPS = 0;
        this.scene = null;         // 表示这个armature被那个scene add，最重要的是使到两者数据打通
        this.size = 1;			   // 按输出数据的比例播放

        this.boneDatas = obj.data.boneDatas;
        this.textureDatas = obj.data.textureDatas;
        this.animationDatas = obj.data.animationDatas;

        let boneDatas = obj.data.boneDatas[obj.roleName];
        let textureDatas = obj.data.textureDatas[obj.roleName];

        for(let boneName in boneDatas){
            let boneTd =  textureDatas[boneName];
            let display = new Display(obj.image,[boneTd.x,boneTd.y,boneTd.width,boneTd.height,boneTd.originX,boneTd.originY]);
            // 这里没有把bone的父子关系逻辑放到构造函数里面，一是由于输出数据的独立性，二是bone可以不依赖关系就可以new出来
            let bone = new Bone(obj.roleName,boneName,display,this);
            bone.body = this;  //bone的parent在外面赋值
            this.boneList.push(bone);
            this.boneObjs[boneName] = bone;
            this.tweenObjs[boneName] = new Tween(bone.tweenNode); //这里先赋值上一个空的tween类
        }
        //建立bone的关系
        this.buildJonit();
    };

    setPos(x,y){
        this.x = x;
        this.y = y;
    };

    setFps(fps){
        this.fps = fps;
    };

    setFrameTotals(totalFrames){
        for(let boneName in this.tweenObjs){
            this.tweenObjs[boneName].totalFrames = totalFrames;
        }
    };

    setEaseType(type,easeFunction){
        for(let boneName in this.tweenObjs){
            this.tweenObjs[boneName].ease = type;
        }
        if(easeFunction)this.easeFunction = easeFunction;
    };

    setSize(newSize){
        for(let boneName in this.boneObjs){
            this.boneObjs[boneName].display.size = newSize;
        }
    };

    isVector(){
        for(let boneName in this.boneObjs){
            if(this.boneObjs[boneName].display.isVector === false){
                return false
            }
        }
        return true;
    };

    setVector(isVector){
        if(typeof isVector === "undefined"){
            this.setVector(!this.isVector());
        }else{
            for(let boneName in this.boneObjs){
                this.boneObjs[boneName].display.isVector = isVector;
            }
        }
    };

    isComplete(){
        //注意不是所有的骨骼的动画总帧数是一样的（如有scale参数的骨骼），所以不能以一代全。
        for(let boneName in this.tweenObjs){
            if(this.tweenObjs[boneName].isComplete === false){
                return false
            }
        }
        return true;
    };

    isPause(){
        for(let boneName in this.tweenObjs){
            if(this.tweenObjs[boneName].isPause === false){
                return false
            }
        }
        return true;
    };

    // 目前的逻辑是,也就是原来的逻辑,第一次pause是暂停,再一次pause就是重新开始
    pause(value){
        if(typeof value === 'undefined'){
            let isPause = this.isPause();
            this.pause(!isPause);
        }else{
            for(let boneName in this.tweenObjs){
                this.tweenObjs[boneName].isPause = value;
            }
        }
    };

    buildJonit(){
        let boneDatas = this.boneDatas[this.roleName],
            boneObjs = this.boneObjs,
            bone,boneData,boneParent;
        for(let boneName in boneDatas){
            boneData = boneDatas[boneName];
            bone = boneObjs[boneName];
            boneParent = boneObjs[boneData._parent];
            if(boneParent){
                boneParent.addChild(bone); //TODO 目前的demo实际上这里目前并没有执行到
            }
        }
    };

    update(duration){
        for(let index = 0,len = this.boneList.length; index < len; index++){
            /************      bone的tweenNode的update   ****************/
            let bone = this.boneList[index];

            //why 不把tween类的更新放到bone类中去？
            //因为有延迟动画的计算，tween类的currentPercent需要重新计算，当把计算currentPercent放到每个骨骼里面去了
            //又会缺少一些全局参数，例如totoalFrame。所以抽离tween类为Armature类统一管理，计算结果自然到bone的tweenNode中
            this.tweenObjs[bone.name].update(this.easeFunction);
            bone.update();
        }
    };

    render(context) {
        if(this.visible && this.alpha > 0){
            context.save();
            context.translate(this.x,this.y);
            for(let i =0; i< this.boneList.length; i++){
                this.boneList[i].display._render(context);
            }
            context.restore();
        }
    };

    playTo(aniName,totalFrames,transitionFrames,isloop){
        let aniData = this.animationDatas[this.roleName][aniName],
            fromNode = new TweenNode(),
            toNode  = new TweenNode();

        for(let boneName in aniData){
            if(boneName !== 'name' && boneName !== 'frame'){

                let bone = this.boneObjs[boneName],
                    boneAniData = aniData[boneName];

                // tween具体赋值。
                let tween = this.tweenObjs[boneName];
                tween.nodeList = boneAniData.nodeList;
                tween.delay = boneAniData.delay || 0;
                tween.keyFrametotal = aniData['frame'];
                tween.totalFrames = totalFrames * (boneAniData.scale || 1);
                tween.transitionFrames = transitionFrames;
                tween.hasTransition = true;    //重新更新
                tween.isComplete = tween.isPause = false;  //刷新

                /**************    这里计算的from to 是过渡动画的   ****************/
                fromNode.initValue(tween.tweenNode); // fromNode使用上一次的tweenNode的渲染值作为起始值，如果上一次没有，则是空值开始

                if(boneAniData.nodeList.length > 1){
                    //如果isloop为false，则是动态不循环动画(默认是动态循环动画)
                    if(!isloop){
                        tween.loopTpye = -3;
                        tween.keyFrametotal -= 1;
                    }else{
                        tween.loopTpye = -2;   //这里如果在动画切换的时候上一次是-3，切换回-2的时候，你这里不赋值就出错了。
                    }
                    if(tween.delay !== 0){
                        // delay比如是0.05
                        // delay不是所谓的延迟,而是延后,这样就能够解释清楚了
                        // 这个delay的计算跟Tween类的updateCurrentPercent方法的逻辑是一模一样的，TODO 看以后可以优化为一个函数不？
                        let playedKeyFrames = tween.keyFrametotal * (1 - tween.delay);
                        let fromIndex = 0,
                            toIndex = 0,
                            listEndFrame = 0,
                            betweenFrame = 0;
                        while(playedKeyFrames >= listEndFrame){
                            betweenFrame = tween.nodeList[toIndex].frame;
                            listEndFrame += betweenFrame;
                            fromIndex = toIndex;
                            if(++toIndex >= tween.nodeList.length){
                                toIndex = 0;
                            }
                        }
                        toNode.betweenValue(tween.nodeList[fromIndex],tween.nodeList[toIndex]);
                        let currentPercent = 1 - (listEndFrame - playedKeyFrames)/betweenFrame;
                        if(tween.ease){
                            // 如果是缓动就调用缓动函数，
                            if(this.easeFunction)currentPercent=this.easeFunction(currentPercent);
                            else currentPercent = 0.5 * (1 - Math.cos(currentPercent * PI ));
                        }
                        toNode.tweenTo(currentPercent);

                    }else {
                        toNode.initValue(aniData[boneName].nodeList[0]);
                    }

                }else {
                    // 静态显示
                    toNode.initValue(aniData[boneName].nodeList[0]); //(数据做了处理，静态显示的也装在只有一个数据的数组里面)
                    tween.loopTpye = -1;
                }

                bone.tweenNode.betweenValue(fromNode,toNode);
            }
        }
    };

    changeBoneImage(boneName,image,positionData){
        this.boneObjs[boneName].changeImage(image,positionData)
    }
}