/**
 * 有限状态机
 */

import { error, warn } from "cc";
import { StateBase } from "./StateBase";

export class StateMachine {
    private _name: string | null = null;                        // 状态机名字
    private _mapStates: Map<string, StateBase> = new Map();     // 状态合集
    private _state: StateBase | null = null;                    // 当前状态
    public constructor(name: string) {
        this._name = name;
    }

    /**
     * 注册状态
     * @param key 状态键值
     * @param state 状态实例
     * @returns 
     */
    public regState(key: string, state: StateBase) {
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
    public unRegState(key: string) {
        if ('' == key) return;
        this._mapStates.delete(key);
    }

    /**
     * 切换状态
     * @param key 状态键值
     */
    public switchState(key: string) {
        if ('' == key) {
            error('@StateMachine.switchState - the key of state is empty');
            return;
        }

        let curState = this._state;
        let nextState = this._mapStates.get(key);
        if (curState?.canLeave() && nextState?.canEnter()) {
            this._state = nextState;
            curState.onLeave();
            nextState.onEnter();
        }
    }

    // 获取状态合集
    public getStates() {
        return this._mapStates;
    }

    // 获取当前状态
    public getCurState() {
        return this._state;
    }

    // 每帧更新
    public onUpdate(dt: any) {
        if (!this._state) return;
        if (!this._state.onUpdate) {
            warn('@StateMachine.onUpdate - state has no update function');
            return;
        }
        this._state.onUpdate(dt);
    }

    // 清理数据
    public clearData() {
        this._mapStates.clear();
    }
}