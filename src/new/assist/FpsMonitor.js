/**
 * Created by iconie on 20/07/2017.
 */

export default class FpsMonitor {

    constructor(dom){
        if(dom){
            this.dom = typeof dom === "string" ? document.querySelector(dom) : dom;
            this.domExistBefore = true;
        }
        else{
            this.domExistBefore = false;
        }
    }

    monitorFPS(scene){

        let  monitorDom;
        if(this.dom){
            monitorDom = this.dom;
        } else {
            monitorDom = document.createElement('div');
            monitorDom.id = 'alloyge_monitor';
            monitorDom.setAttribute('style','padding: 10px 15px;background-color:rgba(60,60,60,0.5);position:absolute;top: 0;left: 0;color: #ddd;');
            document.body.appendChild(monitorDom);
           this.dom = monitorDom;
        }

        let str = "";

        for(let i = 0 ; i < scene.children.length ; i += 1){
            str += scene.children[i].roleName + " fps : " + scene.children[i].avgFPS;
            if(i!==(scene.children.length - 1))str += "<BR/>";
        }

        monitorDom.innerHTML = str;
    };

    destory(){
        if(!this.domExistBefore){
            this.dom.parentNode.removeChild(this.dom);
        }
    }
}