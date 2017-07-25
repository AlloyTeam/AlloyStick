/**
 * Created by iconie on 23/07/2017.
 */

window.onload = function() {

    let canvas = document.getElementById('canvas'),
        textureImg = document.getElementById('xiaoxiaoImg'),
        toggleTrue = document.getElementById('toggle_on'),
        toggleFlase = document.getElementById('toggle_off'),
        toggleBtn = document.getElementById("toggleBtn");
    // 创建场景实例
    let demoInstance = new window.AlloyStick({context:canvas.getContext('2d')});
    // 增加模型
    demoInstance.addRole(
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

    demoInstance.addRole(
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
    // 给模型添加动作响应
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
            //钩子函数
            beforeKeyDown:function(e){
                let doms = document.getElementsByClassName('key_'+e.key);
                for(let i = 0; i<doms.length; i++){
                    AlloyUtils.addClass(doms[i],'pressdown');
                }
                // 快速换装的例子,可以给任意部分改变贴图(注意要提前加载好图片)
                if(e.key === 'c'){
                    //快速换装测试
                    let img = new Image();
                    img.onload = function(){
                        demoInstance.changeBoneImage('xiaoxiao','head',img,[0,0,66,66,-33,-33]);
                    };
                    img.src = './data/texture2.png';
                }
                if(e.key === 'v'){
                    let img = new Image();
                    img.onload = function(){
                        demoInstance.changeBoneImage('xiaoxiao','head',img,[0,0,66,66,-33,-33]);
                    };
                    img.src = './data/texture.png';
                }
                //测试js调用动作
                if(e.key === 'b'){
                    demoInstance.rolePlayTo('dada',['simpleHit',12,5,false]);
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
    //启动实例
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