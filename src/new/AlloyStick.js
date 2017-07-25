/**
 * Created by iconie on 22/07/2017.
 * 项目入口文件
 */
import Scene from './Scene';
import Armature from './Stick';
import Utils from './Utils';

// 通过workFlow的方式,致力于清晰的逻辑并且避免冗余
// todo 暴露更多的API

export default class AlloyStick{

    constructor(config){
        this.scene = new Scene(config.context);
        this.roleNumber = 0;
        this.roles = {};
        this.animationStacks = {};
        this.ruleLists = {};
        this.replaceOrWait = '';
    }

    addRole(roleConfig,initialAction,initialPosition,easeConfig = {ifEase:false}){
        if(this.roles.hasOwnProperty(roleConfig.roleName)){
            console.warn("duplicate names for one scene is not allowed");
            return -1;
        }

        let tempRole = new Armature(roleConfig);

        tempRole.setEaseType(easeConfig.ifEase,easeConfig.easeFunction);

        // tempRole.playTo(initialAction.animationName, initialAction.totalFrames, initialAction.transitionFrames, initialAction.isLoop);
        tempRole.playTo(initialAction[0], initialAction[1], initialAction[2], initialAction[3]);

        tempRole.setPos(initialPosition.x,initialPosition.y);

        this.scene.addObj(tempRole);
        this.roles[roleConfig.roleName] = tempRole;
        this.roleNumber += 1;
    }

    roleNumbers(){
        return this.roleNumber;
    }

    setVector(roleName){
        if(!roleName) {
            for(let role of this.roles){
                role.setVector(true);
            }
        } else{
            this.roles[roleName].setVector(true);
        }
    }

    removeVector(roleName){
        if(!roleName) {
            for(let role of this.roles){
                role.setVector(false);
            }
        } else{
            this.roles[roleName].setVector(false);
        }
    }

    // 参数可以省略
    showFPS(dom){
        this.scene.showFPS(dom);
    }

    hideFPS(){
        this.scene.hideFPS();
    }

    /*
    * obj:{value:...,roleName:...}
    * 这个pause实现的功能比较复杂,可以传参数可以不传参数
    */
    pause(obj){
        if(!obj){
            this.scene.pause();
            return;
        }

        if(obj.hasOwnProperty('roleName')){
            if(obj.hasOwnProperty('value')){
                this.roles[obj['roleName']].pause(obj['value']);
            } else{
                this.roles[obj['roleName']].pause();
            }
        } else{
            this.scene.pause(obj.value);
        }
    }

    clear(){
        this.scene.clear();
    }

    // 给动画增加键盘事件 实际上可以直接读取属性key
    /*
     * 这里其实要考虑比较多的因素：
     * 对于每一个事件,我应该考虑:
     *   如果多个scene对onkeydown和onkeyup进行响应会不会冲突
     *   每一个scene有多个role,我们在指定一个按键的时候是该考虑对某一个role进行某一个动作以及对多个role进行多个动作两种
     *   我们应该指定是在onkeydown的时候响应事件还是在onkeyup的时候响应事件
     *   还要考虑回调函数
     *
     *   只要一个动作进行了,就不会中断,所谓的wait or replace 只是影响下一个动作
     *
     *   lists:
     *   {
     *       's':{ rules:[{role:'xiaoxiao',action:[...]]}
     *       'a':{ rules:[{role:'xiaoxiao',action:[...]]}
     *   }
     *
     *   目前为了方便控制,把callback抽离出来
     *   callBacks{
     *      beforeKeyDown:
     *      afterKeyDown:
     *      beforeKeyUp:
     *      afterKeyUp:
     *   }
     *
     *  为了考虑便于增加，我应该把这个lists存储在整个对象中
     * */
    mapKeyToAni(lists,keyDownOrUp,callBacks,replaceOrWait = 'wait'){
        for(let key in lists){
            if(!lists.hasOwnProperty(key))continue;
            if(!this.ruleLists.hasOwnProperty(key)){
                this.ruleLists[key] = lists[key];
            } else{
                for(let i = 0 ; i < lists[key].rules;i += 1){
                    this.ruleLists[key].push(lists[key].rules[i]);
                    /*
                     let that = this;
                     if(!this.ruleLists[key].keydown)this.ruleLists[key].keydown = lists[key].keydown;//不管lists[key]指定没指定keydown都可以这样去写,顶多是undefined
                     if(this.ruleLists[key].keydown && lists[key].keydown)this.ruleLists[key].keydown = function(){that.ruleLists[key].keydown();lists[key].keydown()};//如果都指定了,不会replace掉,相当于依次调用

                     if(!this.ruleLists[key].keyup)this.ruleLists[key].keyup = lists[key].keyup;
                     if(this.ruleLists[key].keyup && lists[key].keyup)this.ruleLists[key].keyup = function(){that.ruleLists[key].keyup();lists[key].keyup()};
                     */
                }
            }
        }

        this.replaceOrWait = replaceOrWait;

        let evt = keyDownOrUp , otherEvt = keyDownOrUp === 'keydown' ? "keyup" : "keydown";

        let that = this;

        function handler(e){

            if(evt === 'keydown'){
                if(callBacks.beforeKeyDown)callBacks.beforeKeyDown(e);
            } else{
                if(callBacks.beforeKeyUp)callBacks.beforeKeyUp(e);
            }
            let keys = Object.keys(that.ruleLists);

            if(keys.indexOf(e.key) !== -1){

                let certainRule = that.ruleLists[e.key].rules;

                for(let j = 0 ; j < certainRule.length ; j += 1){

                    if(that.replaceOrWait === 'wait'){

                        if(that.animationStacks.hasOwnProperty(certainRule[j].role)){
                            that.animationStacks[certainRule[j].role].push([...certainRule[j].action]);
                        } else{
                            that.animationStacks[certainRule[j].role] = [[...certainRule[j].action]];
                        }

                    } else{
                        that.animationStacks[certainRule[j].role] = [[...certainRule[j].action]];
                    }
                }
            }

            if(evt === 'keydown'){
                if(callBacks.afterKeyDown)callBacks.afterKeyDown(e);
            } else{
                if(callBacks.afterKeyUp)callBacks.afterKeyUp(e);
            }
        }

        function otherHandler(e){
            if(otherEvt === 'keydown'){
                if(callBacks.beforeKeyDown)callBacks.beforeKeyDown(e);
            } else{
                if(callBacks.beforeKeyUp)callBacks.beforeKeyUp(e);
            }
            if(otherEvt === 'keydown'){
                if(callBacks.afterKeyDown)callBacks.afterKeyDown(e);
            } else{
                if(callBacks.afterKeyUp)callBacks.afterKeyUp(e);
            }
        }

        Utils.addEvent(window,evt,handler);
        Utils.addEvent(window,otherEvt,otherHandler);
    }

    addRules(lists){
        for(let key in lists){
            if(!lists.hasOwnProperty(key))continue;
            if(!this.ruleLists.hasOwnProperty(key)){
                this.ruleLists[key] = lists[key];
            } else{
                for(let i = 0 ; i < lists[key].rules;i += 1){
                    this.ruleLists[key].push(lists[key].rules[i]);

                    //let that = this;
                }
            }
        }
    }

    changeReplaceOrWait(replaceOrWait){
        this.replaceOrWait = replaceOrWait;
    }

    removeRules(key,role){
        if(!this.ruleLists.hasOwnProperty(key))return;
        if(!role)delete this.ruleLists[key];
        else {
            for(let j = 0 ; j < this.ruleLists[key].length ; j += 1){
                if(this.ruleLists[key][j].role === role){
                    this.ruleLists[key].splice(j,1);
                }
            }
        }
    }

    changeBoneImage(roleName,boneName,image,positionData){
        this.roles[roleName].changeBoneImage(boneName,image,positionData);
    }

    rolePlayTo(roleName,actionConfig){
        if(!this.roles.hasOwnProperty(roleName)){
            console.warn("No such role in this scene");
            return -1;
        }
        if(this.replaceOrWait === 'wait'){
            if(this.animationStacks.hasOwnProperty(roleName)){
                this.animationStacks[roleName].push(actionConfig);
            } else{
                this.animationStacks[roleName] = [actionConfig];
            }
        } else{
            this.animationStacks[roleName] = [actionConfig];
        }
    }

    start(){
        let that = this;
        this.scene.start(function(){
            for(let roleName in that.roles){
                if(!that.roles.hasOwnProperty(roleName))continue;// 因为babel没有办法转义新的API,所以这里采用ES5的写法
                if(that.animationStacks.hasOwnProperty(roleName) && that.animationStacks[roleName].length && that.roles[roleName].isComplete()){
                    let certainAni = that.animationStacks[roleName].shift();
                    that.roles[roleName].playTo(...certainAni);
                }

            }
        })
    }
}

window.AlloyStick = AlloyStick;
window.AlloyUtils = Utils;