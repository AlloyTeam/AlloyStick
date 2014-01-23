
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
