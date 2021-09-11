
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TipsManager')
export class TipsManager {
    // 场景uuid
    private _sceneUUID: string = '';
    public get sceneUUID() { return this._sceneUUID; }

    public constructor(sceneUUID: string) {
        this._sceneUUID = sceneUUID;
    }
}