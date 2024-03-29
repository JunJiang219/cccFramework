/**
 * 有限状态机
 */

import { error, warn } from "cc";

// 状态逻辑执行结果类型
export enum StateExecuteType {
    Continue,   // 继续，保持该状态
    Break,      // 终止，切换另一状态
    Delete,     // 删除，注销该状态，并进入初始无效状态null
}

// 状态基类
export class StateBase {

    // 构造函数
    public constructor(...params: any[]) { }

    // 获取状态类型
    public getType(): string | number {
        return -1;
    }

    /**
     * 是否可以离开该状态
     * @param obj 状态持有者
     * @param curState 当前状态
     * @returns 
     */
    public canLeave(obj: any, curState: StateBase | null): boolean { return true; }

    /**
     * 是否可以进入该状态
     * @param obj 状态持有者
     * @param preState 上一状态
     * @returns 
     */
    public canEnter(obj: any, preState: StateBase | null): boolean { return true; }

    /**
     * 进入该状态
     * @param obj 状态持有者
     * @param preState 上一状态
     */
    public enter(obj: any, preState: StateBase | null) { }

    /**
     * 离开该状态
     * @param obj 状态持有者
     * @param nextState 下一状态
     */
    public leave(obj: any, nextState: StateBase | null) { }

    /**
     * 执行状态逻辑
     * @param obj 状态持有者
     * @param params 可选参数
     * @returns 
     */
    public execute(obj: any, ...params: any[]) { return StateExecuteType.Continue; }
}

// 状态机
export class StateMachine {
    private _obj: any = null;                                           // 状态机持有者
    private _preState: StateBase | null = null;                         // 上一状态
    private _curState: StateBase | null = null;                         // 当前状态
    private _mapStates: Map<string | number, StateBase> = new Map();    // 状态合集
    private _name: string | null = null;                                // 状态机名字（可不设置）

    public constructor(obj: any, name?: string) {
        this._obj = obj;
        if (name) this._name = name;
    }

    /**
     * 注册状态
     * @param key 状态键值
     * @param state 状态实例
     * @returns 
     */
    public regState(key: string | number, state: StateBase) {
        if ('' == key) {
            error('@StateMachine.regState - the key of state is empty');
            return;
        }

        if (!state) {
            error('@StateMachine.regState - target state invalid');
            return;
        }

        if (!this._mapStates.has(key)) {
            this._mapStates.set(key, state);
        }
    }

    /**
     * 注销状态
     * @param key 状态键值
     * @returns 
     */
    public unRegState(key: string | number) {
        if ('' == key) return;
        this._mapStates.delete(key);
    }

    /**
     * 切换状态
     * @param keyOrState 状态键值或者新状态对象
     */
    public enterState(keyOrState: string | number | StateBase | null) {
        let typeVal = typeof keyOrState;
        let key: string | number = '';
        let nextState: StateBase | null = null;
        let curState = this._curState;
        let isObj: boolean = false;     // 参数为状态对象
        if ('string' == typeVal || 'number' == typeVal) {
            key = keyOrState as string | number;
            nextState = this._mapStates.get(key) || null;
            if ('' == key || !nextState) {
                error(`@StateMachine.switchState - the key of state is empty, key = ${key}`);
                return;
            }
        } else {
            isObj = true;
            nextState = keyOrState as StateBase | null;
            if (nextState) key = nextState.getType();
        }

        if (curState && !curState.canLeave(this._obj, curState)) return;
        if (nextState && !nextState.canEnter(this._obj, curState)) return;
        if (isObj && nextState) {
            this.unRegState(key);
            this.regState(key, nextState);
        }
        this._preState = this._curState;
        curState?.leave(this._obj, nextState);
        this._curState = nextState;
        nextState?.enter(this._obj, curState);
    }

    // 获取持有者
    public getObj() {
        return this._obj;
    }

    // 获取注册状态合集
    public getStates() {
        return this._mapStates;
    }

    /**
     * 获取指定键值注册状态
     * @param key 键值
     * @returns 
     */
    public getKeyState(key: string | number) {
        return this._mapStates.get(key) || null;
    }

    // 获取上一状态
    public getPreState() {
        return this._preState;
    }

    // 获取当前状态
    public getCurState() {
        return this._curState;
    }

    /**
     * 执行状态逻辑
     * @param params 可选参数
     */
    public execute(...params: any[]) {
        let execType: StateExecuteType = StateExecuteType.Continue;
        if (this._curState) {
            let stateType = this._curState.getType();
            execType = this._curState.execute(this._obj, ...params);
            if (StateExecuteType.Delete == execType) {
                this.unRegState(stateType);
                this.enterState(null);
            }
        }

        return execType;
    }

    // 清理数据
    public clearData() {
        this._preState = null;
        this._curState = null;
        this._mapStates.clear();
    }
}