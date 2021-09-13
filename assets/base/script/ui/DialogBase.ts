/**
 * 模态提示框基类
 */

import { _decorator } from 'cc';
import { ResKeeper } from '../res/ResKeeper';
const { ccclass, property } = _decorator;

// 模态框回调
export type DialogCallback = { callback: Function, target?: any };

@ccclass('DialogBase')
export class DialogBase extends ResKeeper {

    // 确认、取消回调
    private _okCb: DialogCallback | null = null;
    private _noCb: DialogCallback | null = null;
    // 可变参数
    private _uiArgs: any[] = [];

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
        this._uiIndex = ++DialogBase._uiCnt;
    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @param content 提示内容
     * @param okCallback 确认回调
     * @param noCallback 取消回调
     * @param args 可变参数
     */
    public onOpen(content: string, okCallback?: DialogCallback, noCallback?: DialogCallback, ...args: any[]) {
        if (okCallback) this._okCb = okCallback;
        if (noCallback) this._noCb = noCallback;
        this._uiArgs = args;
    }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {
    }

    // 确认按钮响应
    public onOKTouch() {
        if (this._okCb) {
            let callback = this._okCb.callback;
            let target = this._okCb.target;
            if (target) {
                callback.call(target, ...this._uiArgs);
            } else {
                callback(...this._uiArgs);
            }
        }
    }

    // 取消按钮响应
    public onNOTouch() {
        if (this._noCb) {
            let callback = this._noCb.callback;
            let target = this._noCb.target;
            if (target) {
                callback.call(target, ...this._uiArgs);
            } else {
                callback(...this._uiArgs);
            }
        }
    }
    /********************** UI的回调 ***********************/
}