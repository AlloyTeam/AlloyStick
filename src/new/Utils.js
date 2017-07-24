/**
 * Created by iconie on 20/07/2017.
 */

const Utils = {
    type: {
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
    },
    addEvent(eventTarget, eventType, eventHandler) {
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
    },
    hasClass(inElement, inClassName){
        if(!inElement) return;
        let regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)');
        return regExp.test(inElement.className);
    },
    addClass(inElement, inClassName){
        if(!inElement) return;
        if (!this.hasClass(inElement, inClassName))
            inElement.className = [inElement.className, inClassName].join(' ');
    },
    removeClass(inElement, inClassName){
        if(!inElement) return;
        if (this.hasClass(inElement, inClassName)) {
            let regExp = new RegExp('(?:^|\\s+)' + inClassName + '(?:\\s+|$)', 'g');
            let curClasses = inElement.className;
            inElement.className = curClasses.replace(regExp, ' ');
        }
    },
    toggleClass(inElement, inClassName){
        if (this.hasClass(inElement, inClassName))
            this.removeClass(inElement, inClassName);
        else
            this.addClass(inElement, inClassName);
    },
    replaceClass(inElement,oldClass,newClass){
        if(!inElement) return;
        if (this.hasClass(inElement, oldClass)) {
            let regExp = new RegExp('(?:^|\\s+)' + oldClass + '(?:\\s+|$)', 'g');
            let curClasses = inElement.className;
            inElement.className = curClasses.replace(regExp, ' '+newClass);
        }
    },
};

export default Utils;