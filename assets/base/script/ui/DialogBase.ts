/**
 * 模态提示框基类
 */

import { _decorator } from 'cc';
import { ResKeeper } from '../res/ResKeeper';
const { ccclass, property } = _decorator;

// 模态框回调
export type DialogCallback = { callback: Function, target?: any };

// 对话框参数
export interface IDialogArgs {
    content: string,
    okCallback?: DialogCallback,
    noCallback?: DialogCallback,
}

@ccclass('DialogBase')
export class DialogBase extends ResKeeper {

    // 对话框参数
    private _uiArgs: IDialogArgs | null = null;
    // 额外参数
    protected _exArgs: any[] = null!;

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
        this._exArgs = args;
    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @param uiArgs
     * @param args 可变参数
     */
    public onOpen(uiArgs: IDialogArgs, ...args: any[]) {
        this._uiArgs = uiArgs;
        this._exArgs = args;
    }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {
    }

    // 确认处理
    public okHandler() {
        let okCallback = this._uiArgs?.okCallback;
        if (okCallback) {
            let callback = okCallback.callback;
            let target = okCallback.target;
            if (target) {
                callback.call(target, ...this._exArgs);
            } else {
                callback(...this._exArgs);
            }
        }
    }

    // 取消处理
    public noHandler() {
        let noCallback = this._uiArgs?.noCallback;
        if (noCallback) {
            let callback = noCallback.callback;
            let target = noCallback.target;
            if (target) {
                callback.call(target, ...this._exArgs);
            } else {
                callback(...this._exArgs);
            }
        }
    }
    /********************** UI的回调 ***********************/
}