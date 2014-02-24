/**
* 简单的HTML5游戏引擎(辅助alloyStick)
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