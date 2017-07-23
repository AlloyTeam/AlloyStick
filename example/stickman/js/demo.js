/**
 * Created by iconie on 23/07/2017.
 */

window.onload = function() {

    let canvas = document.getElementById('canvas'),
        textureImg = document.getElementById('xiaoxiaoImg'),
        toggleTrue = document.getElementById('toggle_on'),
        toggleFlase = document.getElementById('toggle_off'),
        toggleBtn = document.getElementById("toggleBtn");

    let demoInstance = new window.AlloyStick({context:canvas.getContext('2d')});

    demoInstance.addObj(
        {
            roleName:'xiaoxiao',
            image:textureImg,
            data:AlloyData,
            fps:40
        },
        ['comeon',40,10,false],
        {
            x:250,
            y:300
        },
        {
            ifEase:true,
        }
    );

    demoInstance.addObj(
        {
            roleName:'dada',
            image:textureImg,
            data:AlloyData2,
            fps:40
        },
        ['comeon',40,10,false],
        {
            x:1100,
            y:300
        },
        {
            ifEase:true,
        }
    );

    demoInstance.mapKeyToAni(
        {
            'j':{rules:[{role:'xiaoxiao',action:['simpleHit',12,5,false]},{role:'dada',action:['simpleHit',12,5,false]}]},
            'k':{rules:[{role:'xiaoxiao',action:['secondHit',6,8,false]},{role:'dada',action:['secondHit',6,8,false]}]},
            'l':{rules:[{role:'xiaoxiao',action:['jump_kick',12,8,false]},{role:'dada',action:['jump_kick',12,8,false]}]},
            'm':{rules:[{role:'xiaoxiao',action:['comeon',35,8,false]},{role:'dada',action:['comeon',35,8,false]}]},
            'n':{rules:[{role:'xiaoxiao',action:['relax',25,10,false]},{role:'dada',action:['relax',25,10,false]}]},
            'o':{rules:[{role:'xiaoxiao',action:['soap',40,15,false]},{role:'dada',action:['soap',40,15,false]}]},
            'p':{rules:[{role:'xiaoxiao',action:['roll',30,10,false]},{role:'dada',action:['roll',30,10,false]}]},
            'r':{rules:[{role:'xiaoxiao',action:['run',30,1,false]},{role:'dada',action:['run',30,1,false]}]},
        },
        'keydown',
        {
            beforeKeyDown:function(e){
                let doms = document.getElementsByClassName('key_'+e.key);
                for(let i = 0; i<doms.length; i++){
                    AlloyUtils.addClass(doms[i],'pressdown');
                }
            },
            afterKeyUp:function(e){
                let doms = document.getElementsByClassName('key_'+e.key);
                for(let i = 0; i<doms.length; i++){
                    AlloyUtils.removeClass(doms[i],'pressdown');
                }
            }
        },
        'replace',
    );

    demoInstance.start();

    //以下是自主添加的控制逻辑
    toggleTrue.addEventListener('click',function(){
        AlloyUtils.addClass(toggleBtn,'toggle-off');
        demoInstance.setVector('xiaoxiao');
    });
    toggleFlase.addEventListener('click',function(){
        AlloyUtils.removeClass(toggleBtn,'toggle-off');
        demoInstance.removeVector('xiaoxiao');
    });

};