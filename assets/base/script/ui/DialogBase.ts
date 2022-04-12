/**
 * 模态提示框基类
 */

import { _decorator } from 'cc';
import { uiMgr } from './UIManager';
import { UIView } from './UIView';
const { ccclass, property } = _decorator;

// 模态提示框回调
export type DialogCallback = { callback: Function, target?: any };

// 模态提示框参数
export interface IDialogArgs {
    content: string,                // 提示内容
    okCallback?: DialogCallback,    // 确认回调
    noCallback?: DialogCallback,    // 取消回调
    extParams?: any,                // 附加参数
}

@ccclass('DialogBase')
export class DialogBase extends UIView {

    // 对话框参数
    protected _uiArgs: IDialogArgs | null = null;

    /********************** UI的回调 ***********************/
    /**
     * 当界面被创建时回调，生命周期内只调用一次
     * @override
     * @param uiId 界面id
     * @param args 模态提示框参数
     */
    public init(uiId: number, args: IDialogArgs): void {
        super.init(uiId, args);
        this._uiArgs = args;
    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @override
     * @param fromUI 从哪个UI打开的
     * @param args 模态提示框参数
     */
    public onOpen(fromUI: UIView, args: IDialogArgs) {
        super.onOpen(fromUI, args);
        this._uiArgs = args;
    }
    /********************** UI的回调 ***********************/

    // 确认处理
    public okHandler() {
        let okCallback = this._uiArgs?.okCallback;
        if (okCallback) {
            let callback = okCallback.callback;
            let target = okCallback.target;
            if (target) {
                callback.call(target, this._uiArgs?.extParams);
            } else {
                callback(this._uiArgs?.extParams);
            }
        }

        uiMgr.close(this);
    }

    // 取消处理
    public noHandler() {
        let noCallback = this._uiArgs?.noCallback;
        if (noCallback) {
            let callback = noCallback.callback;
            let target = noCallback.target;
            if (target) {
                callback.call(target, this._uiArgs?.extParams);
            } else {
                callback(this._uiArgs?.extParams);
            }
        }

        uiMgr.close(this);
    }
}