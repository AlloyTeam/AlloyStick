var demoApp = function(){
	
	var canvas = document.getElementById('canvas'),
		textureImg = document.getElementById('xiaoxiaoImg');

	var Stage = new alloyge.Stage(canvas.getContext('2d'));
	var	xiaoxiao = new alloysk.Armature('xiaoxiao',textureImg);

	xiaoxiao.setEaseType(false);
	xiaoxiao.playTo('comeon',40,10,false);
	xiaoxiao.setPos(250,300);


	Stage.addObj(xiaoxiao);
	Stage.setFPS(40);

	if(window.addEventListener){
		window.addEventListener('keydown',keydownHandler);
		window.addEventListener('keyup',keyupHandler);
	}else{
		window.attachEvent('onkeydown',keydownHandler);
		window.attachEvent('onkeyup',keyupHandler);
	}

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

		if( e.keyCode == '75'){  //'k' 右拳
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

		// if(e.keyCode == '77'){
		// 	animStack.push({
		// 		animName : 'drop',
		// 		totalFrames : 10,
		// 		transitionFrames : 10
		// 	})
		// }

		if(e.keyCode == '77'){   // 'm' come on
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

		if(e.keyCode == '82'){  //   'r' 跑
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
			doms[i].classList.add('pressdown');
		}
	};

	function keyupHandler(e){

		var doms = document.getElementsByClassName('key_'+keyName);

		for(var i = 0; i<doms.length; i++){
			doms[i].classList.remove('pressdown');
		}
	}

	var animing = false;
	var combos = [   ['j','j','k','l'],
					['j','j','k','l','n'],
					['o','p','n'],
					['r','o','n'],
					['r','p','l']];

	var steps = document.getElementsByClassName('step');

	Stage.start(function(){
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
	