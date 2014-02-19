var demoApp = function(){
	
	var canvas = document.getElementById('canvas'),
		canvas_logo = document.getElementById('canvas_logo'),
		logoImg = document.getElementById('logoImg'),
		textureImg = document.getElementById('xiaoxiaoImg');
	var toggleTrue = document.getElementById('toggle_on'),
		toggleFlase = document.getElementById('toggle_off');

	var demoScene = new alloyge.Scene(canvas.getContext('2d')),
		logoScene = new alloyge.Scene(canvas_logo.getContext('2d'));
	var	xiaoxiao = new alloysk.Armature('xiaoxiao',textureImg),
		logoman = new alloysk.Armature('xiaoxiao',textureImg);

	/********************     开场动画    ***************************/
	function animEndHandler(){
		lin.addClass(logoImg,'logo_show');
		lin.addClass(canvas_logo,'canvas_logo_hidden');
	}

	lin.addClass(canvas_logo,'canvas_logo_start');  
	lin.addEvent(canvas_logo,'webkitAnimationEnd',animEndHandler);  //for chrome
	lin.addEvent(canvas_logo,'animationend',animEndHandler);        //for firefox
	lin.addEvent(canvas_logo,'MSAnimationEnd',animEndHandler);      //for IE
	lin.addEvent(canvas_logo,'oAnimationEnd',animEndHandler);       //for Opera


	logoman.setEaseType(false);
	logoman.setPos(65,50);
	logoman.setSize(0.38);
	logoScene.addObj(logoman);
	logoScene.setFPS(40);

	//整套动作列表所有帧(包括过度帧)为206帧,scene的fps为40,则整套的播放时间为201/40=5s
	logoman.playTo('run',30,5,false); 
	var starting_anim = [
		// {animName : 'run',totalF : 30,transF : 5},    //35
		{animName : 'jump_kick',totalF : 12,transF : 8}, //20
		{animName : 'simpleHit',totalF : 12,transF : 5}, //17
		{animName : 'simpleHit',totalF : 12,transF : 5}, //17
		{animName : 'secondHit',totalF : 8,transF : 6},  //14
		{animName : 'jump_kick',totalF : 12,transF : 8}, //20

		{animName : 'roll',totalF : 30,transF : 10},     //40
		{animName : 'comeon',totalF : 35,transF : 8}     //43
	]

	logoScene.start(function(){
		if(logoman.isComplete() && starting_anim.length != 0){
			var oneAnim = starting_anim.shift();
			logoman.playTo(oneAnim.animName, oneAnim.totalF, oneAnim.transF,false);
		}
	});


	/********************		demo  	 ******************************/
	xiaoxiao.setEaseType(false);
	xiaoxiao.playTo('comeon',40,10,false);
	xiaoxiao.setPos(250,300);

	demoScene.addObj(xiaoxiao);
	demoScene.setFPS(40);


	lin.addEvent(window,'keydown',keydownHandler);
	lin.addEvent(window,'keyup',keyupHandler);

	lin.addEvent(toggleTrue,'click',function(){
		lin.addClass(toggleBtn,'toggle-off');
		if(xiaoxiao) xiaoxiao.setVector(true);
	})
	lin.addEvent(toggleFlase,'click',function(){
		lin.removeClass(toggleBtn,'toggle-off');
		if(xiaoxiao) xiaoxiao.setVector(false);
	})


	var animStack = [],
		comboStack = [],
		keyName = '';
	function keydownHandler(e){
		if(animStack.length > 8) return;

		if(e.keyCode == '74'){  //'j' 左拳
			animStack.push({
				animName :'simpleHit',
				totalFrames : 12,
				transitionFrames : 5
			});
			keyName = 'j';
		}
		if(e.keyCode == '75'){  //'k' 右拳
			animStack.push({
				animName : 'secondHit',
				totalFrames : 6,
				transitionFrames : 8
			});
			keyName = 'k';
		}
		if(e.keyCode == '76'){	//'l' 踢
			animStack.push({
				animName : 'jump_kick',
				totalFrames : 12,
				transitionFrames : 8
			});
			keyName = 'l';
		}
		if(e.keyCode == '77'){  // 'm' come on
			animStack.push({
				animName : 'comeon', 
				totalFrames : 35,
				transitionFrames : 8
			})
		}
		if(e.keyCode == '78'){  // 'n' 擦擦大腿
			animStack.push({
				animName : 'relax',
				totalFrames : 25,
				transitionFrames : 10
			});
			keyName = 'n';
		}
		if(e.keyCode == '79'){  // 'o' 捡肥皂
			animStack.push({
				animName : 'soap',
				totalFrames : 40,
				transitionFrames : 15
			});
			keyName = 'o';
		}
		if(e.keyCode == '80'){  // 'p'  滚
			animStack.push({
				animName : 'roll',
				totalFrames : 30,
				transitionFrames : 10
			});
			keyName = 'p';
		}
		if(e.keyCode == '82'){  // 'r' 跑
			animStack.push({
				animName : 'run',
				totalFrames : 30,
				transitionFrames : 1
			});
			keyName = 'r'
		}
		if(e.keyCode == '32'){  //空格暂停
			xiaoxiao.pause();  
		}
		comboStack.push(keyName);

		//按钮响应“按下”样式的逻辑
		var doms = document.getElementsByClassName('key_'+keyName);
		for(var i = 0; i<doms.length; i++){
			lin.addClass(doms[i],'pressdown');
		}
	};

	function keyupHandler(e){

		var doms = document.getElementsByClassName('key_'+keyName);

		for(var i = 0; i<doms.length; i++){
			lin.removeClass(doms[i],'pressdown');
		}
	}

	var animing = false;
	var combos = [   ['j','j','k','l'],
					['j','j','k','l','n'],
					['o','p','n'],
					['r','o','n'],
					['r','p','l']];

	var steps = document.getElementsByClassName('step');

	demoScene.start(function(){
		var combos_done = [true,true,true,true,true];

		combos.forEach(function(combo,i){
			for(var ci in combo){
				if(combo[ci] != comboStack[ci]){
					combos_done[i] = false;
					continue;
				}
			}
		});
		
	
		for(var index in  combos_done){
			if (combos_done[index] && comboStack.length == combos[index].length) {
				var step_dom = document.getElementById('step'+(index*1+1));
				step_dom.style.opacity = index == 1 ? .2 : 1;
				step_dom.setAttribute('data-combo-done','true');

				document.getElementById('combo'+(index*1+1)).style.opacity = 0;
			}	
		}
		var all_done = true;
		for(var k =0; k<steps.length; k++){
			if(!steps[k].getAttribute('data-combo-done')){
				all_done = false;
			}
		}
		if(all_done) document.getElementById('step6').style.opacity = 1;

		if(animStack.length && animing == false){
			var oneAnim = animStack.shift();
			xiaoxiao.playTo(oneAnim.animName,oneAnim.totalFrames,oneAnim.transitionFrames,oneAnim.isloop);
			animing = true;
		}
		if(xiaoxiao.isComplete()){
			animing = false;
		}
		if(xiaoxiao.isComplete() && animStack.length == 0){
			comboStack.shift();
		}
	});

}

window.onload = demoApp;

/**************    utils function   **********/
var lin = {};
lin.addEvent = function(eventTarget, eventType, eventHandler) {
    if (eventTarget.addEventListener) {
        eventTarget.addEventListener(eventType, eventHandler, false);
    } else {
        if (eventTarget.attachEvent) {
            eventType = "on" + eventType;
            eventTarget.attachEvent(eventType, eventHandler);
        } else {
            eventTarget["on" + eventType] = eventHandler;
        }
    }
}
lin.hasClass = function(inElement, inClassName){
    if(!inElement) return;
    var regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)');
    return regExp.test(inElement.className);
}

lin.addClass = function(inElement, inClassName){
    if(!inElement) return;
    if (!this.hasClass(inElement, inClassName))
        inElement.className = [inElement.className, inClassName].join(' ');
}

lin.removeClass = function(inElement, inClassName){
    if(!inElement) return;
    if (this.hasClass(inElement, inClassName)) {
        var regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)', 'g');
        var curClasses = inElement.className;
        inElement.className = curClasses.replace(regExp, ' ');
    }
}

lin.toggleClass = function(inElement, inClassName){
    if (this.hasClass(inElement, inClassName))
        this.removeClass(inElement, inClassName);
    else
        this.addClass(inElement, inClassName);
}

lin.replaceClass = function(inElement,oldClass,newClass){
    if(!inElement) return;
    if (this.hasClass(inElement, oldClass)) {
        var regExp = new RegExp('(?:^|\\s+)' + oldClass + '(?:\\s+|$)', 'g');
        var curClasses = inElement.className;
        inElement.className = curClasses.replace(regExp, ' '+newClass);
    }
}

	