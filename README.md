<p align="center">
<img src="./logo.png" style="width:150px"/>
</p>
<p align="center">
beta 0.5.1
</a>
</p>
<p align="center">
<a href='http://alloyteam.github.io/AlloyStick'>
http://alloyteam.github.io/AlloyStick
</a>
</p>


>本项目近期在进行重构，因此变动会比较大，如果您有什么好的想法，欢迎在[这里](https://github.com/AlloyTeam/AlloyStick/issues)提出
 
### CONTENT

* [demo](https://github.com/AlloyTeam/AlloyStick#demo)  
* [usage](https://github.com/AlloyTeam/AlloyStick#usage)
* [API](https://github.com/AlloyTeam/AlloyStick#api)
* [Licence](https://github.com/AlloyTeam/AlloyStick#licence)



## Demo

We have a demo in this project, you can download the project and run `example/stickman/index.html` by yourself.

## Usage

We only exposed two variables(classes) for the window. So all operations are based on these two classes:

```
window.AlloyStick
window.AlloyUtils 
```
>attention: window.AlloyUtils may be removed soon

Here is a suggested workflow to start your animation:

#### 1.create a scene

the only parameter is the context for the canvas.

```
let demoInstance = new window.AlloyStick({context:canvas.getContext('2d')});
```

#### 2.add an role

A scene can has servel roles(objects), you can add roles one by one manually.

there are four parameters：

* the config for the role
* the initial action([animationName,totalFrames,transitionFrames,isloop] and the order of this array can be changed)
* the position of the Object
* Whether to call the easing function(In fact the easing function can be redefined by yourself)

```
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
```

#### 3.bind events

You can call the actions by using function **rolePlayTo**, but the more convenient way is to bind a key to an event: when the user press down the certain key , an action should be called.

The second parameter means the action is called whether 'keydown' or 'keyup'.

The third parameter are some hook functions. There are four hooks totally:

```
beforeKeyDown
afterKeyDown
beforeKeyUp
afterKeyUp
```

**The forth parameter is important :** there are two modes for the animation: the wait mode and the replace mode. In the wait mode, all the triggerd animations will be in an array and acts one by one, pressing a keyboard button for many times quickly can cause the accumulation of animations.
But in the replaced mode, the animation being executed can not be interrupted, but there is at most one animation waiting, and there is no accumulation of animations. 

the two modes can be used in different scenes.

Finally the example:

```
demoInstance.mapKeyToAni(
        {
            'j':{rules:[{role:'xiaoxiao',action:['simpleHit',12,5,false]},{role:'dada',action:['simpleHit',12,5,false]}]},
            //others are omitted
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
```

#### 4.start

Just start the instance:

```
demoInstance.start();
```

This step is necessary, otherwise all actions can not be performed.

## API

### window.AlloyStick

#### new AlloyStick(config) 

* arguments:
	* {Object} config
* return: the instance of AlloyStick
* example: 

```
let demoInstance = new window.AlloyStick({context:canvas.getContext('2d')});
``` 

#### AlloyStick.addRole(roleConfig,initialAction,initialPosition,easeConfig)

* arguments:
	* {Object} roleConfig
	* {Object} initialAction
	* {Object} initialPosition
	* {Object} easeConfig 
		* default:`{ifEase:false}`
		* Optional
* return: no return
* usage: add role to this instance's scene(an instance of AlloyStick has only one scene)
* example:

```
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
```

#### AlloyStick.roleNumbers()

* arguments: no arguments
* return: {Number}
* usage: return the number of roles of this AlloyStick instance


#### AlloyStick.setVector(roleName)

* arguments:
	* {String} roleName
		* Optional  
* return: no return
* usage: change all the roles(when the roleName is undefined) or certain roles to the vector mode 

#### AlloyStick.removeVector(roleName)

* arguments:
	* {String} roleName
		* Optional
* return: no return
* usage: change all the roles(when the roleName is undefined) or certain roles to the normal mode

#### AlloyStick.showFPS(dom)

* arguments:
	* {String|dom} dom
		* Optional
* returns: no return
* usage: show the fps monitor

#### AlloyStick.hideFPS()  

* arguments: no argument
* return: no return
* usage: hide the fps monitor

#### AlloyStick.pause(obj)

* arguments: 
	* {Object} obj 
		* Optional
* return: no return
* usage: pause or restart the whole scene(if obj is undefined or no roleName is defined in the obj) or the certain role
	* hint: when no 'value' property is specified in the obj, the pause means switch state, pause() twice means restart 
* example:

```
demoInstance.pause({
		value:false /*means restart*/
		roleName:"xiaoxiao"
	})
```
	 
#### AlloyStick.clear()

* arguments: no arguments
* return: no return
* usage: clear the whole scene of this instance

#### AlloyStick.mapKeyToAni(lists,keyDownOrUp,callBacks,replaceOrWait = 'wait')

* arguments: 
	* {Object} lists
	* {'keydown'|'keyup'} keyDownOrUp
	* {Object} callBacks
	* {'wait'|'replace'} replaceOrWait
		* default: 'wait'
		* Optional 
* return: no return
* usage: map the keyboard buttons to actions
* example:

```
demoInstance.mapKeyToAni(
        {
            'j':{rules:[{role:'xiaoxiao',action:['simpleHit',12,5,false]},{role:'dada',action:['simpleHit',12,5,false]}]},
            //others are omitted
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
```


#### AlloyStick.addRules(lists)

* arguments:
	* {Object} lists 
* return: no return
* usage: add the rules for mapping the keyboard buttons to actions

#### AlloyStick.removeRules(key,role)

* arguments:
	* {String} key
	* role
		* optional 
* return: no return
* usage: add the rules for mapping the keyboard buttons to actions(if the parameter role is undefined, remove all the actions for the key, else remove the actions of the certain role for the key)


#### AlloyStick.changeReplaceOrWait(replaceOrWait)
* arguments: 
	* {'wait'|'replace'} replaceOrWait
* return: no return
* usage: change the mode to 'wait' mode or 'replace' mode.

#### AlloyStick.rolePlayTo(roleName,actionConfig)

* arguments:
    * {String}roleName
    * {Array}actionConfig
        * hint: [animationName,totalFrames,transitionFrames,isloop]
* return: no return
* usage: Use js to call the action


#### AlloyStick.start()

* arguments: no argument
* return: no return
* usage: start this Instance


 
## Licence

This content is released under the GPL License.