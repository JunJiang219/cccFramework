/**
 * 模态提示框基类
 */

import { _decorator } from 'cc';
import { ResKeeper } from '../res/ResKeeper';
const { ccclass, property } = _decorator;

// 模态框回调
export type DialogCallback = { callback: Function, target?: any };

@ccclass('BaseDialog')
export class BaseDialog extends ResKeeper {

    // 确认、取消回调
    private _okCb: DialogCallback | null = null;
    private _noCb: DialogCallback | null = null;

    // 界面索引
    private _uiIndex: number = 0;
    public get uiIndex() { return this._uiIndex; }
    /**  静态变量，用于区分相同界面的不同实例 */
    private static _uiCnt: number = 0;

    /********************** UI的回调 ***********************/
    /**
     * 当界面被创建时回调，生命周期内只调用一次
     * @param args 可变参数
     */
    public init(...args: any[]): void {
        this._uiIndex = ++BaseDialog._uiCnt;
    }

    public onOpen(content: string, okCallback?: DialogCallback, noCallback?: DialogCallback, ...args: any[]) {
        if (okCallback) this._okCb = okCallback;
        if (noCallback) this._noCb = noCallback;
    }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {
    }

    /**
     * 当界面被关闭时回调，每次调用Close时回调
     * 返回值会传递给下一个界面
     */
    public onClose(): any {

    }

    /********************** UI的回调 ***********************/
}