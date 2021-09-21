/*
*   事件管理器，事件的监听、触发、移除
*   
*   2018-9-20 by 宝爷
*/
import { log, warn } from "cc";

export type EventManagerCallFunc = (eventName: string, eventData: any) => void;
interface CallBackTarget {
    callBack: EventManagerCallFunc,
    target: any,
    priority: number,   // 数值越大，优先级越高(提供该设置，但个人不建议使用，优先级不同推荐用不同事件进行处理)
}

/**
 * 消息执行顺序 排序
 * @param a 
 * @param b 
 */
function sortListener(a: CallBackTarget, b: CallBackTarget): number {
    if (a.priority > b.priority) {
        return -1;
    } else if (a.priority < b.priority) {
        return 1;
    } else {
        return 0;
    }
}

export class EventManager {
    private static _instance: EventManager | null = null;
    private constructor() { }
    public static getInstance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    private _eventListeners: { [key: string]: CallBackTarget[] } = {};

    private getEventListenersIndex(eventName: string, callBack: EventManagerCallFunc, target?: any): number {
        let index = -1;
        for (let i = 0, len = this._eventListeners[eventName].length; i < len; i++) {
            let iterator = this._eventListeners[eventName][i];
            if (iterator.callBack == callBack && (!target || iterator.target == target)) {
                index = i;
                break;
            }
        }
        return index;
    }

    addEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            warn("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            log('addEventListener callBack is nil');
            return false;
        }
        let callTarget: CallBackTarget = { callBack: callBack, target: target, priority: priority };
        if (null == this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [callTarget];

        } else {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (-1 == index) {
                this._eventListeners[eventName].push(callTarget);
            }
            if (priority != 0) this._eventListeners[eventName].sort(sortListener);
        }

        return true;
    }

    setEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any, priority: number = 0): boolean {
        if (!eventName) {
            warn("eventName is empty" + eventName);
            return false;
        }

        if (null == callBack) {
            log('setEventListener callBack is nil');
            return false;
        }
        let callTarget: CallBackTarget = { callBack: callBack, target: target, priority: priority };
        this._eventListeners[eventName] = [callTarget];
        return true;
    }

    removeEventListener(eventName: string, callBack: EventManagerCallFunc, target?: any) {
        if (null != this._eventListeners[eventName]) {
            let index = this.getEventListenersIndex(eventName, callBack, target);
            if (-1 != index) {
                this._eventListeners[eventName].splice(index, 1);
            }
        }
    }

    raiseEvent(eventName: string, eventData?: any) {
        console.log(`==================== raiseEvent ${eventName} begin | ${JSON.stringify(eventData)}`);
        if (null != this._eventListeners[eventName]) {
            // 将所有回调提取出来，再调用，避免调用回调的时候操作了事件的删除
            let callbackList: CallBackTarget[] = [];
            for (let i = 0, len = this._eventListeners[eventName].length; i < len; i++) {
                let iterator = this._eventListeners[eventName][i];
                callbackList.push({ callBack: iterator.callBack, target: iterator.target, priority: iterator.priority });
            }
            for (let i = 0, len = callbackList.length; i < len; i++) {
                let iterator = callbackList[i];
                iterator.callBack.call(iterator.target, eventName, eventData);
            }
        }
        console.log(`==================== raiseEvent ${eventName} end`);
    }
}

export let evtMgr = EventManager.getInstance();