/**
 * 非模态提示基类
 */
import { _decorator } from 'cc';
import { UIView } from './UIView';
const { ccclass, property } = _decorator;

// 非模态提示参数
export interface IToastArgs {
    content: string,    // 提示内容
}

@ccclass('ToastBase')
export class ToastBase extends UIView {

    // 非模态提示参数
    protected _uiArgs: IToastArgs | null = null;

    /********************** UI的回调 ***********************/
    /**
     * 当界面被创建时回调，生命周期内只调用一次
     * @override
     * @param uiId 界面id
     * @param args 非模态提示参数
     */
    public init(uiId: number, args: IToastArgs): void {
        super.init(uiId, args);
        this._uiArgs = args;
    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @override
     * @param fromUI 从哪个UI打开的
     * @param args 非模态提示参数
     */
    public onOpen(fromUI: UIView, args: IToastArgs) {
        super.onOpen(fromUI, args);
        this._uiArgs = args;
    }
    /********************** UI的回调 ***********************/
}
