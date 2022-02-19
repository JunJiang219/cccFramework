/**
 * 有限状态机管理类
 */

import { error } from "cc";
import { StateMachine } from "./StateMachine";

export class FSMManager {
    private static _instance: FSMManager | null = null;
    public static getInstance(): FSMManager {
        if (!FSMManager._instance) FSMManager._instance = new FSMManager();
        return FSMManager._instance;
    }
    private _mapFSM: Map<string, StateMachine> = new Map();

    // 获取状态机
    public getFSM(key: string) {
        let fsm: StateMachine | null = null;
        if ('' == key) {
            error('@FSMManager.getFSM - the key of fsm is empty');
            return fsm;
        }

        if (!this._mapFSM.has(key)) {
            fsm = new StateMachine(key);
            this._mapFSM.set(key, fsm);
        } else {
            fsm = this._mapFSM.get(key)!;
        }

        return fsm;
    }

    // 删除状态机
    public delFSM(key: string) {
        let fsm = this._mapFSM.get(key);
        if (fsm) {
            fsm.clearData();
            this._mapFSM.delete(key);
        }
    }

    // 清空状态机
    public clearFSM() {
        this._mapFSM.forEach((value: StateMachine, key: string) => {
            value.clearData();
        });
        this._mapFSM.clear();
    }

    // 每帧更新
    public onUpdate(dt: any) {
        this._mapFSM.forEach((value: StateMachine, key: string) => {
            value.onUpdate(dt);
        });
    }
}

export let fsmMgr = FSMManager.getInstance();