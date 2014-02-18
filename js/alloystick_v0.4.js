/**
* 简单的HTML5游戏引擎
* @author   bizaitan
* @version  0.4
*
*/
var alloyge = {};


;(function(){

var requestAnimationFrame = window.requestAnimationFrame ||
							window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.msRequestAnimationFrame ||
							function( callback ){  
					            window.setTimeout(callback, 1000/60);  
					        };  



/**************  AlloyStict 基础函数 || 辅助类 *****************/
;(function(){
    function emptyFn() {};

    alloyge.inherit = function(child, parent) {
      var tmp = child;
      emptyFn.prototype = parent.prototype;
      child.prototype = new emptyFn;
      child.prototype.constructor = tmp;
      
      child.prototype._super = parent.prototype;
      return child;  
   	};

  	alloyge.delegate = function(fn,target){
   		//注意这个匿名函数非常重要，即让fn不立刻执行，还能够让arguments正确传参
   		return function(){
			fn.apply(target,arguments);
		}
   	};


   	alloyge.type = {
   		isArray : function(o){
			return o && (o.constructor === Array || ots.call(o) === "[object Array]");
		},
	    isObject : function(o) {
	    	return o && (o.constructor === Object || ots.call(o) === "[object Object]");
		},
	    isBoolean : function(o) {
	    	return (o === false || o) && (o.constructor === Boolean);
		},
	    isNumber : function(o) {
	    	return (o === 0 || o) && o.constructor === Number;
		},
	    isUndefined : function(o) {
	   		return typeof(o) === "undefined";
		},
	    isNull : function(o) {
	   		return o === null;
		},
	    isFunction : function(o) {
	   		return o && (o.constructor === Function);
		},
		isString : function(o) {
	    	return (o === "" || o) && (o.constructor === String);
		}
   	}
   


   	alloyge.monitorDom = null; 
   	alloyge.monitorFPS = function(scene){
   		if(!alloyge.monitorDom){
   			var monitorDom = document.createElement('div');
   			monitorDom.id = 'alloyge_monitor';
   			monitorDom.setAttribute('style','width: 150px;height: 80px;background-color: rgba(60, 60, 60, 0.51);'+
   				'position: absolute;top: 0;left: 0;color: #ddd;');
   			monitorDom.innerHTML = 'FPS:'+scene.avgFPS;
   			document.body.appendChild(monitorDom);

   			alloyge.monitorDom = monitorDom;
   		}
   	};

   	//辅助函数，获取page visibility的前缀
   	function getHiddenPrefix() {
	    return 'hidden' in document ? 'hidden' : function() {
	        var r = null;
	        ['webkit', 'moz', 'ms', 'o'].forEach(function(prefix) {
	            if((prefix + 'Hidden') in document) {
	                return r = prefix + 'Hidden';
	            }
	        });
	 
	        return r;
	    }();
	};

	alloyge.initEvenHadler = false;
   	alloyge.addGobalEvenHandler = function(scene){
   		if(getHiddenPrefix() == null || alloyge.initEvenHadler == true) return;  //不支持pagevisiblility 直接退出

   		alloyge.initEvenHadler = true;	//全局之执行一次
   		var hPrefix = getHiddenPrefix(),
   			prefix = hPrefix.substring(0, hPrefix.length - 6);

		document.addEventListener(prefix+'visibilitychange',function(){
			console.log('I have paused: ',scene.paused);
			//if(scene.paused){
				//切换回来的时候才用delay的方式防止“暴走动画”。TODO不是最优的解决“暴走动画的bug”
			//	setTimeout(function(){scene.pause();},50);
			//}else{
				scene.pause();
			//}
			
		});
   		
   	}

})();

/******************************		Obj 对象继承类	************************************/
;(function(){
	alloyge.Obj = function(){
		this.height = 0;
		this.width = 0;
		this.x = 0;			    //这个x,y是骨骼的偏移位置（具体实现在bone的updateDisplay的时候具体赋值）
		this.y = 0;			
		this.scaleX = 1;
		this.scaleY = 1;
		this.alpha = 1;
		this.originX = 0;		//这里是位图旋转中心，就是决定关节joint的位置	
		this.originY = 0;		//如果为0,0就是左上角为旋转中心
		this.rotation = 0;
		this.visible = true;	
		this.size = 1; 			//骨骼按比例渲染


		this.scene = null;
		this.parent = null;
	}

	var ptt = alloyge.Obj.prototype;
	//具体的render函数，由具体实现类去实现
	ptt.render = function(){}; 

	//私有方法 ,子类继承后，重写render类即可。_render方法有游戏循环调用
	ptt._render = function(context) {
		if(this.visible && this.alpha > 0){
			context.save();
			
			this._transform(context); //根据自身的参数映射到ctx中去
			
			this.render(context);
			context.restore();
		}  
	};

	ptt._transform = function(context) {

		context.translate(this.x*this.size, this.y*this.size); 
		if(this.size !== 1 ){ //整体上缩放
			context.scale(this.size, this.size); 
		}
		if(this.rotation % 360 > 0){
			context.rotate(this.rotation % 360 / 180 * Math.PI);
		}
		if(this.scaleX != 1 || this.scaleY != 1) {
			context.scale(this.scaleX, this.scaleY);
		}
		
		context.translate(-this.originX, -this.originY);
		
		context.globalAlpha *= this.alpha;	
	};

})();


/******************************		Display		**************************************/
(function() {


	/**
	* Display 渲染类
	* 具体有两种渲染方式：矢量渲染和图片渲染
	* x,y是骨骼的偏移位置，具体的由Armature类的x,y决定。
	*/
	alloyge.Display = function(image, frame) {
		alloyge.Obj.call(this);
		//x,y变量都没有赋值，按照默认的为0，因为是因为具体绘画位置xy是由bone的_render确定位置，
		this.image = image;
		this.frame = alloyge.type.isArray(frame) ? frame : [0, 0, image.width, image.height];  //注意位图资源先加载

		this.width = this.frame[2];
		this.height = this.frame[3];

		this.originX = -this.frame[4] || 0;  //origin参数在_render方法里面需要
		this.originY = -this.frame[5] || 0;  

		this.isVector = false;
	}; 

	alloyge.inherit(alloyge.Display, alloyge.Obj);
	var ptt = alloyge.Display.prototype;

	//注意是先执行_render
	ptt.render = function(context) {
		//  矢量的渲染实现
		if(this.isVector){
			context.strokeStyle="#aaa";
			context.strokeRect(0,0,this.width,this.height);
			//context.fillStyle="#fff";
			//context.fillRect(0,0,this.width,this.height);
		}else{
			//img,sx,sy,swidth,sheight,x,y,width,height
			//img; 裁切的xy，裁切的w,h  ; 在canvas上绘图的xy,在绘制的w,h
			context.drawImage(this.image, this.frame[0], this.frame[1], this.frame[2], this.frame[3], 0, 0, this.width, this.height);
		}
	}

})();

/******************************		Scene		**************************************/
;(function(){
	alloyge.Scene = function(context){
		this.context = context;
		this.canvas = context.canvas;

		this.children = [];

		this.cb = null;   //函数的额外回调函数

		this.paused = false;
		this.fps = 60;
		this.avgFPS = 0;  //实际运行的每秒的fps
		this.intervalID = null;
	};

	var ptt = alloyge.Scene.prototype;

	ptt.addObj = function(obj){
		obj.scene = this;
		this.children.push(obj);
	};
	ptt.removeObj = function(obj){
		var index = this.children.indexOf(obj);
		if(index > 0 || index < this.children.length){
			this.children.splice(index,1);
		}
	}

	ptt.setFPS = function(fps){
		this.fps = fps;
	};
	ptt.getFPS = function(){
		return this.fps;
	}

	ptt.start = function(cb){
		this.cb = alloyge.type.isFunction(cb) ? cb : null;
		requestAnimationFrame(this.loop.call(this));

		//alloyge.addGobalEvenHandler(this); //引擎的一些全局事件处理
	}

	ptt.pause = function(value){
		if(value == undefined){
			this.paused = !this.paused;
		}else{
			this.paused = value;
		}
	}

	ptt.loop = function(){

		var lastTime = window.mozAnimationStartTime || Date.now(),
			//都是用于计算平均fps
			frameCountPerSecond = 0,  //计算每秒实际绘制的次数 
       		preCountTime = lastTime;

		var	_this = this;

		//这玩意就用来控制fps的
		var sumDuration = 0,  //实际的时间间隔和
			sumInterval = 0,  //期望的时间间隔和
			frameDrawCount = 1; //实际的绘画次数而不是进入loop的次数

		return function(){

			var now = Date.now(),
				duration = now - lastTime,   //这是实际的时间间隔
				interval = 1000 / _this.fps;  //这是期望的时间间隔

			frameCountPerSecond++;		//这里主循环没loop一次就++记录一次

			//以一秒为一个周期对一些参数进击计算和更新
			if(now - preCountTime > 1000){

                _this.avgFPS = frameCountPerSecond; //平均fps
                frameCountPerSecond = 0;  //清0后重新计算
                preCountTime = now;       //再次记录每秒fps的起始记录时间

                if(alloyge.monitorDom){
                	alloyge.monitorDom.innerHTML = 'FPS:' + _this.avgFPS;
                }
                //console.log('avgFPS:',_this.avgFPS,' drawCount:',frameDrawCount);

                //这里每一秒就会对sumTime清零，虽然这样不能百分百控制实际fps绘制，但权衡得不错了
                sumDuration = 0;  
                sumInterval = 0;
                frameDrawCount = 1;
            }

			//检查停止循环的条件
			if (!_this.paused ) {

				/* TODO 下面的渲染计算其实可以优化到具体每个子类里面，也可以为每个子类设置fps，自己渲染计算
				*  这样一些场景不需要这么高的重绘率，会给整个游戏提高性能，这个有待优化
				*/
				sumDuration += duration;
	            sumInterval = interval * frameDrawCount;
	            if (_this.fps == 60 || sumDuration >= sumInterval) {

	                /************		所以这里是逻辑计算更新			**************/
					if(_this.cb != null) _this.cb(duration); //调用主程序的callback

					for (var i = 0, len = _this.children.length; i < len; i++) {
						_this.children[i].update(duration);
					}
						
					/************		所以这里是把更新计算的内容绘画			**************/
					_this.render(this.context);


	                frameDrawCount++; //更新实际绘画次数
	            };
			}

			lastTime = now;  //暂停了也要记录lastTime
			requestAnimationFrame(arguments.callee);
		}
		
	};


	ptt.render = function(context,rect){
		if (!context) context = this.context;
		if(rect){
			this.clear(rect.x,rect.y, rect.width, rect.height)
		}else{
			this.clear();
		}
		
		//把Scene中的Obj都render
		for (var i = 0, len = this.children.length; i < len; i++) {
			this.children[i].render(context);
		}
	}

	ptt.clear = function(x, y, width, height) {
		if(arguments.length >= 4){
			 this.context.clearRect(x, y, width, height);
		}else{
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
		}
	};
})();


})();



/**
* alloysk   HTML5骨骼动画引擎
* @author   bizaitan
* @version  0.4
*
*/


var alloysk = {};

;(function(){


//全局变量
var PI = Math.PI,
	HALF_PI = Math.PI * 0.5,
	DEG = PI/180;

//资源文件数据
alloysk.textureDatas = {};
alloysk.boneDatas = {};
alloysk.animationDatas = {};


//输出格式结构优化，减少处理逻辑
alloysk.addTextureData = function(data){
	alloysk.textureDatas = data;
};
//编辑器输出格式结构优化，减少处理逻辑
alloysk.addBoneData = function(data){
	alloysk.boneDatas = data;
}
//编辑器输出格式结构优化，减少处理逻辑
alloysk.addAnimationData = function(data){
	alloysk.animationDatas = data;
}

//旧版编辑器输出数据格式
alloysk.addSkeletonData = function(data){
	//console.log('data',data);
	for(var name in data){

		var boneDatas = data[name].bone;  //is Array
		var obj = {};
		for(var i = 0; i<boneDatas.length; i++){
			obj[boneDatas[i].name] =  boneDatas[i]
		}
		alloysk.boneDatas[name] = obj;


		var animationDatas = data[name].animation; //is Array
		
		var _obj = {};
		for(var j = 0; j<animationDatas.length;j++){


			var _aniObj = {},node = null, _bone = {};
			//将动画数据封装到Node类中去
			for(var boneName in animationDatas[j]){
				if(boneName == 'eventFrame') continue;
				var boneAniData = animationDatas[j][boneName];

				if(boneName == 'frame' || boneName == 'name'){
					_aniObj[boneName] = boneAniData;  //保持一样的数据
				}else{
					
					if(typeof boneAniData.length == 'undefined'){
						node = new alloysk.Node();
						node.initValue(boneAniData);
						_aniObj[boneName] = {
							'scale' : boneAniData.scale,
							'delay' : boneAniData.delay,
							'nodeList' : [node]   //注意这里如果只有一帧也用数组包装起来
						}
						
					}else{
						var nodeArray = [];
						for(var k =0; k<boneAniData.length; k++){
							node = new alloysk.Node();
							node.initValue(boneAniData[k]);
							nodeArray[k] = node;
						}
						_aniObj[boneName] = {
							'scale' : boneAniData[0].scale,
							'delay' : boneAniData[0].delay,
							'nodeList' : nodeArray   //注意这里如果只有一帧也用数组包装起来
						}
							
					}

				}
			}

			_obj[animationDatas[j].name] = _aniObj;
		}
		alloysk.animationDatas[name] = _obj;

	}
	//console.log('boneDatas',alloysk.boneDatas);
	//console.log('animationDatas',alloysk.animationDatas);
};

//兼容龙骨Flash编辑器输出的数据(先把数据转为旧数据再用addSkeletonData方法转换新数据)
alloysk.addDragonBoneData = function(data){
	var outputObj = {};
	for(var i = 0; i<data.armature.length; i++){
		var roleName = data.armature[i].name,
			old_bones = data.armature[i].bone,
			old_anims = data.armature[i].animation,
			old_skin = data.armature[i].skin[0];  //这里先默认只有一层skin

		var new_bones = [];
		for(var j = 0; j<old_bones.length; j++){
			var old_bone = old_bones[j];
			new_bones.push({
				'name' : old_bone.name,
				//'parent' : old_bone.parent,
				'x' : old_bone.transform.x,
				'y' : old_bone.transform.y,
				'scaleX' : old_bone.transform.scX,
				'scaleY' : old_bone.transform.scY
				// 'z'
			});
		}

		var new_anims = [];
		for(var k = 0; k<old_anims.length; k++){
			var anim = old_anims[k];
			var new_anim = {
				'name': anim.name,
				'frame' : anim.duration
			}
			for(var m = 0; m< anim.timeline.length; m++){
				var timeline = anim.timeline[m];
				var new_oneBoneAnimFrames = [];
				var delay = timeline.offset;  //TODO 龙骨编辑器的delay参数实现出现断骨的bug

				for(var n = 0; n<timeline.frame.length; n++){
					var frame = timeline.frame[n];
					var obj = {
						'x' : frame.transform.x,
						'y' : frame.transform.y,
						'z' : frame.z,
						'scaleX' : frame.transform.scX,
						'scaleY' : frame.transform.scY,
						'frame' : frame.duration,
						'rotation' : frame.transform.skX  //skX 和skY一样
					}
					//这里是转换为旧的格式，旧格式delay是在第一个关键帧obj上赋值delay的
					if(n == 0 && delay !== 0) 
						obj.delay = delay;   

					new_oneBoneAnimFrames.push(obj);
				}
				//某个骨骼的在这个动作里面的所有帧处理
				new_anim[timeline.name] = new_oneBoneAnimFrames;
			}
			new_anims.push(new_anim);
		}

		//对skin数据处理
		for(var x =0; x< old_skin.slot.length; x++){
			var slot = old_skin.slot[x];
			//z之后整理数据格式后会很好处理，这里先放着，小小的z现在不会影响
			//new_bones[slot.name].z = slot.z;
			alloysk.textureDatas[roleName][slot.name].originX = slot.display[0].transform.x;
			alloysk.textureDatas[roleName][slot.name].originY = slot.display[0].transform.y;
		}

		outputObj[roleName] = {
			'bone': new_bones,
			'animation' : new_anims
		}
	}

	alloysk.addSkeletonData(outputObj);
	
}

/**************  Node 基础节点类  *****************/
;(function(){
	//只带有渲染变量
	alloysk.Node = function(x,y,rotation){
		/**  渲染变量 **/
		this.x = x || 0;
		this.y = y || 0;
		this.rotation = rotation || 0;
		this.offR = 0;  //是否旋转过一圈 ，所以真实是角度应该是rotation+360*offR

		this.scaleX = 1;
		this.scaleY = 1;
		this.alpha = 1;
		this.frame = 1;
	}

	alloysk.Node.prototype.initValue = function(data){
		this.x = data.x;
		this.y = data.y;
		this.rotation = data.rotation;

		
		this.scaleX = data.scaleX || 1;
		this.scaleY = data.scaleY || 1;
		this.alpha = data.alpha || 1;
		this.frame = data.frame || 1;
		this.offR = data.offR || 0;
	}

})();


/**************  TweenNode 缓动节点类  ****************/
;(function(){

	alloysk.TweenNode = function(x, y, rotation){
		/**  渲染变量 **/
		alloysk.Node.call(this,x,y,rotation);

		/**  _sXX起始变量  _dXX差值变量 **/
		//_sXX,_dXX都是用于，根据currentPrencent调用tweento来更新

		this._sR = 0;   //from节点的rotation
		this._sX = 0;	//from节点的x
		this._sY = 0;	//from节点的y
		this._sSX = 0;	//from节点的scaleX
		this._sSY = 0;	//from节点的scaleY
		this._sA = 0;	//from节点的alpha
		
		this._dR = 0;	//rotation的差值
		this._dX = 0;	//x的差值
		this._dY = 0;	//y的差值
		this._dSX = 0;	//scaleX的差值
		this._dSY = 0;	//scaleY的差值
		this._dA = 0;	//alpha的差值
	}
	alloysk.TweenNode.prototype = new alloysk.Node();

	var ptt = alloysk.TweenNode.prototype;

	/**
	* 差值计算这个tweenNode的_sR,_sX等差值变量
	* from,to 可以是Node类也可以是TweenNode类
	* 但是如果是TweenNode类是不会用到里面_sR,_sX等的差值
	*/
	ptt.betweenValue = function(from, to){
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

		//TODO hack 基于输出数据是跨度不超过180
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
	}
	/**
	* 差值计算这个tweenNode的rotation,x,y等渲染变量
	* 注意：这个函数需要先执行betweenValue方法计算了差值后，才能正确调用
	* 根据上面betweenValue的差值和要缓动的precent，计算这个TweenNode的实际x,y,rotation,scaleX,scaleY,alpha
	*/
	ptt.tweenTo = function(currentPercent){
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
	}

})();

/**************	 Tween 每个骨骼的缓动动画管理类  *****************/
;(function(){

	alloysk.Tween = function(tweenNode){
		this.tweenNode = tweenNode;

		//下面一块的变量是在playTo的时候才具体赋值
		this.nodeList = [];                
		this.delay = 0;						
		this.transitionFrames = 0;          //过渡动画的需要的总帧数 
		this.totalFrames = 0; 	 			//总帧数 是要演示使用的共多少帧(包括补间帧)  
		this.keyFrametotal = 0;             //总的关键帧数 区分totalFrames 在playTo的时候才具体赋值 
		this.loopTpye = -2;                 //循环类型，-1静态显示(包括循环不循环)，-2动态循环显示，-3动态不循环显示
		
		this.ease = true;        			 //默认为true
		this.rate = 1;           		     //显示帧的速率
		this.hasTransition = true;           //用于表示过渡动画展示了没有(每次playTo后都重新更新)

		this.currentPercent = 0;   
		this.currentFrame = 0;
		
		this.isComplete = false;
		this.isPause = false; 
		

		this.betweenFrame = 0;  //运行到某个关键帧obj的frame
		this.listEndFrame = 0;  //某个关键帧obj自身加上前面所有的关键帧obj的frame之和，临界点判断是否要切换from，to的node

	};

	var ptt = alloysk.Tween.prototype;

	ptt.update = function(){
		
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
				/***  这里过渡动画执行结束后，根据loopTpye切换参数更新currentPercen t***/
				this.hasTransition = false;

				//静态显示  TODO 输出数据上没有输出静态显示的数据，待优化
				if(this.loopTpye == -1){
					this.currentPrecent = 1;
					this.isComplete = true;   //静态显示设置了isComplete，之后的update都不用做逻辑更新了
				}
				//动态循环显示
				if(this.loopTpye == -2){
					if(this.delay != 0){
						this.currentFrame = (1 - this.delay) * this.totalFrames;
						this.currentPercent += this.currentFrame / this.totalFrames;
					}
					this.currentPercent %= 1;  //这里我们更新了currentPercent
					this.listEndFrame = 0;    //注意这里赋值了一个这样的变量
				}
				//动态不循环显示
				if(this.loopTpye == -3){
					this.currentPercent = (this.currentPercent-1)*this.transitionFrames/this.totalFrames;
					if(this.currentPercent <1){
						this.currentPrecent %= 1;
						this.listEndFrame = 0;
					}
				}

				this.updateCurrentPercent();			
			}
		}else{
			this.currentFrame += this.rate;//每次updatey一次都会根据rate(显示速度)增加
			this.currentPercent = this.currentFrame / this.totalFrames;
			this.currentFrame %= this.totalFrames;	
			if(this.loopTpye == -3 && this.currentPercent >= 1){
				//动态不循环动画在循环动画执行一次后就停止了
				this.currentPercent = 1;
				this.isComplete = true;
			}else{
				this.currentPercent %= 1; 
			}

			this.updateCurrentPercent();	
		}
		
		this.tweenNode.tweenTo(this.currentPercent);
	};

	ptt.updateCurrentPercent = function(){
		//playedKeyFrames  相对于总关键帧和，运行到某个的当前帧数 
		var playedKeyFrames = this.keyFrametotal * this.currentPercent;
		/**
		* 关键帧obj切换的时候更新node差值
		*/
		if(playedKeyFrames <= this.listEndFrame-this.betweenFrame || playedKeyFrames > this.listEndFrame){
			this.listEndFrame = 0;
			var toIndex = 0,fromIndex = 0;
			//循环显示的核心
			while(playedKeyFrames >= this.listEndFrame){
				this.betweenFrame = this.nodeList[toIndex].frame;
				this.listEndFrame += this.betweenFrame;
				fromIndex = toIndex;
				//当运动到最后一个关键帧obj的时候，循环动画的时候，我们就使用from为最后一个关键帧obj，to为第一个关键帧obj
				if(++toIndex >= this.nodeList.length){
					toIndex = 0;
				}
			}
			
			var fromNode = this.nodeList[fromIndex];
			var toNode = this.nodeList[toIndex];

			//每当切换 关节帧之间的动作 会更新node的差值
			this.tweenNode.betweenValue(fromNode, toNode);
		}
		
		//这里我们换算currentPrecent，原来的currentPrecent是在总帧数上面，换算当前帧在某个关键帧obj的百分比
		this.currentPercent = 1 - (this.listEndFrame - playedKeyFrames) / this.betweenFrame;
		if(this.ease){
			this.currentPercent = 0.5 * (1 - Math.cos(this.currentPercent * PI));
		}
	}

})();



/**************  Bone 骨骼类           *****************/
;(function(){
	alloysk.Bone = function(roleName,boneName,display){
		this.body = null;  		//继承关系的父亲，一般都是armature类
		this._parent = null;  	//骨骼上的父子关系
		this.name = boneName;
		this.display = display;
		this.tweenNode = new alloysk.TweenNode();

		var boneData = alloysk.boneDatas[roleName][boneName] || {};

		//TODO 骨骼的绑定位置（没有选择角度）
		this._lockX = boneData.x || 0;
		this._lockY = boneData.y || 0;
		this._lockZ = boneData.z || 0;  //TODO目前还没有实现z排序的功能

		//_parent父骨骼的_transform属性
		this._parentX = 0;
		this._parentY = 0;
		this._parentR = 0;

		//根据update的时候赋值
		this._transformX = 0;		//要偏移的x
		this._transformY = 0;		//要偏移的y

	}

	var ptt = alloysk.Bone.prototype;

	ptt.addChild = function(child){
		child._parent = this;
		return child;
	}

	ptt.getGlobalX = function(){
		return this._transformX + this._parentX;
	}
	ptt.getGlobalY = function(){
		return this._transformY + this._parentY;
	}
	ptt.getGlobalR = function(){
		return this.tweenNode.rotation + this._parentR;
	}

	//update顺序：
	//1.tweenNode的update  (统一交给了Tween管理,bone的update都是在tweenupdate之后)
	//2.bone的update  (tweennode在上一步得到赋值)
	//3 bone.display的update
	ptt.update = function(){
		//bone的自身update
		if(this._parent){
			//更新parent属性
			this._parentX = this._parent.getGlobalX();	
			this._parentY = this._parent.getGlobalY();
			this._parentR = this._parent.getGlobalR();
			
			var _dX = this._lockX  + this.tweenNode.x;
			var _dY = this._lockY  + this.tweenNode.y;
			var _r = Math.atan2(_dY, _dX) + this._parentR * DEG;
			var _len = Math.sqrt(_dX * _dX + _dY * _dY);
			this._transformX = _len * Math.cos(_r);
			this._transformY = _len * Math.sin(_r);
		}else{
			//下面这句代码我们可以看出：
			//playTo过后Bone的tweenNode的起值(_sXX)和差值(_dXX)是赋值了，
			//而在这个Bone.update上面现有Tween的update，其实就是Bone.tweenNode的update(本质就是根据currentPercent来tweenTo来使到tweenNode的渲染值得到赋值)
			//所以下面两句代码中的tweenNode.x就是我所说的tween在每次update后的赋值
			this._transformX = this.tweenNode.x;
			this._transformY = this.tweenNode.y;
		}

		//display的update
		this.updateDisplay();
	}

	ptt.updateDisplay = function(){
		//也存在没有display渲染层的bone
		if(this.display){
			this.display.x = this._transformX + this._parentX;
			this.display.y = this._transformY + this._parentY;
			var rotation = this.tweenNode.rotation + this._parentR; //i delete node
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

})();



/**************  Armature 整体类       *****************/

;(function(){	
	alloysk.Armature = function(roleName,img){
		this.visible = true;
		this.alpha = 1;
		this.x = 0;
		this.y = 0;

		this.boneList = [];		   //两种不同的结构对bone的存储
		this.boneObjs = {};
		this.tweenObjs = {};       //装的是骨骼的tween类
		this.roleName = roleName;  //记录这个armature的name

		this.fps = 60;             //一秒重绘多少次画面，只影响性能(速度？) TODO 目前fps没有应用到具体某个armature,后记统一性能优化处理 
		this.scene = null;         //表示这个armature被那个scene add，最重要的是使到两者数据打通
		this.size = 1;			   //按输出数据的比例播放

		var boneDatas = alloysk.boneDatas[roleName];
		var textureDatas = alloysk.textureDatas[roleName];

		for(var boneName in boneDatas){
			var boneTd =  textureDatas[boneName];
			//TODO 是否也把这个display用list装起来放到armature的变量里面
			//TODO Display类优化
			var display = new alloyge.Display(img,[boneTd.x,boneTd.y,boneTd.width,boneTd.height,boneTd.originX,boneTd.originY]);

			//这里没有把bone的父子关系逻辑放到构造函数里面，一是由于输出数据的独立性，二是bone可以不依赖关系就可以new出来
			var bone = new alloysk.Bone(roleName,boneName,display);
			bone.body = this;  //bone的parent在外面赋值
			this.boneList.push(bone);
			this.boneObjs[boneName] = bone;

			this.tweenObjs[boneName] = new alloysk.Tween(bone.tweenNode); //这里先赋值上一个空的tween类
		}

		//建立bone的关系
		this.buildJoint();
	}

	var ptt = alloysk.Armature.prototype;

	ptt.setPos = function(x,y){
		this.x = x;
		this.y = y;
	};
	ptt.setFps = function(fps){
		this.fps = fps;
	};
	ptt.setFrameTotals = function(totalFrames){
		for(var boneName in this.tweenObjs){
			this.tweenObjs[boneName].totalFrames = totalFrames;
		}
	};

	ptt.setEaseType = function(type){
		for(var boneName in this.tweenObjs){
			this.tweenObjs[boneName].ease = type;
		}
	};
	ptt.setSize = function(newSize){
		for(var boneName in this.boneObjs){
			this.boneObjs[boneName].display.size = newSize;
		}
	};
	ptt.isVector = function(){
		for(var boneName in this.boneObjs){
			if(this.boneObjs[boneName].display.isVector == false){
				return false
			}
		}
		return true;
	};
	//不传值代表取反
	ptt.setVector = function(isVector){
		if(isVector == undefined){
			this.setVector(! this.isVector());
		}else{
			for(var boneName in this.boneObjs){
				this.boneObjs[boneName].display.isVector = isVector;
			}
		}
	};
	ptt.isComplete = function(){
		//注意不是所有的骨骼的动画总帧数是一样的（如有scale参数的骨骼），所以不能以一代全。
		for(var boneName in this.tweenObjs){
			if(this.tweenObjs[boneName].isComplete == false){
				return false
			}
		}
		return true;
	};
	ptt.isPause = function(){
		for(var boneName in this.tweenObjs){
			if(this.tweenObjs[boneName].isPause == false){
				return false
			}
		}
		return true;
	}
	//不传值就是取反动画的pause值
	ptt.pause = function(value){
		if(value == undefined){
			var isPause = this.isPause();
			this.pause(!isPause);
		}else{
			for(var boneName in this.tweenObjs){
				this.tweenObjs[boneName].isPause = value;
			}
		}
	}

	//bone都new好后，建立bone之间的父子关系
	ptt.buildJoint = function(){
		var boneDatas = alloysk.boneDatas[this.roleName],
			boneObjs = this.boneObjs,
			bone,boneData,boneParent;
		for(var boneName in boneDatas){

			boneData = boneDatas[boneName];
			bone = boneObjs[boneName];
			boneParent = boneObjs[boneData._parent];
			if(boneParent){
				boneParent.addChild(bone);
			}
		}
	};
	
	ptt.update = function(duration){
		
		for(var index = 0,len = this.boneList.length; index < len; index++){

			/************      bone的tweenNode的update   ****************/
			var bone = this.boneList[index];

			//why 不把tween类的更新放到bone类中去？
			//因为有延迟动画的计算，tween类的currentPercent需要重新计算，当把计算currentPercent放到每个骨骼里面去了
			//又会缺少一些全局参数，例如totoalFrame。所以抽离tween类为Armature类统一管理，计算结果自然到bone的tweenNode中
			this.tweenObjs[bone.name].update();
			bone.update();							
		}
	};

	ptt.render = function(context) {
		if(this.visible && this.alpha > 0){
			context.save();

			//this.transform(context);
			context.translate(this.x,this.y);

			for(var i =0; i< this.boneList.length; i++){
				this.boneList[i].display._render(context);
			}
			context.restore();
		}  
	};

	/**
	* 本质上这里实现了bone的某个动画tweenNode的差值(tween类赋值)
	*/
	ptt.playTo = function(aniName,totalFrames,transitionFrames,isloop){
		var aniData = alloysk.animationDatas[this.roleName][aniName],
			fromNode = new alloysk.TweenNode(),
			toNode  = new alloysk.TweenNode();

		for(var boneName in aniData){
			if(boneName != 'name' && boneName != 'frame'){

				var bone = this.boneObjs[boneName],
					boneAniData = aniData[boneName];

				//tween具体赋值。
				var tween = this.tweenObjs[boneName];
				tween.nodeList = boneAniData.nodeList;
				tween.delay = boneAniData.delay || 0;
				tween.keyFrametotal = aniData['frame'];
				tween.totalFrames = totalFrames * (boneAniData.scale || 1);
				tween.transitionFrames = transitionFrames;
				tween.hasTransition = true;    //重新更新
				tween.isComplete = tween.isPause = false;  //刷新
 
				

				/**************    这里计算的from to 是过渡动画的   ****************/
				//fromNode使用上一次的tweenNode的渲染值作为起始值，如果上一次没有，则是空值开始
				fromNode.initValue(tween.tweenNode);

				if(boneAniData.nodeList.length > 1){
					//如果isloop为false，则是动态不循环动画(默认是动态循环动画)
					if(!isloop){
						tween.loopTpye = -3;
						tween.keyFrametotal -= 1;
					}else{
						tween.loopTpye = -2;   //这里如果在动画切换的时候上一次是-3，切换回-2的时候，你这里不赋值就出错了。
					}
					
					if(tween.delay !== 0){

						//这个delay的计算跟Tween类的updateCurrentPercent方法的逻辑是一模一样的，TODO 看以后可以优化为一个函数不？
						var playedKeyFrames = tween.keyFrametotal * (1 - tween.delay);
						var fromIndex = 0,
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
						var currentPercent = 1 - (listEndFrame - playedKeyFrames)/betweenFrame;
						if(tween.ease){
							currentPercent = 0.5 * (1 - Math.cos(currentPercent * PI ));
						}
						toNode.tweenTo(currentPercent);

					}else {
						toNode.initValue(aniData[boneName].nodeList[0]);
					}

				}else {
					//静态显示
					toNode.initValue(aniData[boneName].nodeList[0]); //(数据做了处理，静态显示的也装在只有一个数据的数组里面)
					tween.loopTpye = -1;
				}

				bone.tweenNode.betweenValue(fromNode,toNode);	
				
			}
		}
	};

})();


})(); //end of all
