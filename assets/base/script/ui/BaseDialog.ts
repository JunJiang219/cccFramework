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

    // 回调
    protected _okCb: DialogCallback | null = null;
    protected _noCb: DialogCallback | null = null;

    /**
     * 当界面被创建时回调，生命周期内只调用一次
     * @param args 可变参数
     */
    public init(...args: any[]): void {

    }

    /**
     * 当界面被打开时回调，每次调用Open时回调
     * @param args 可变参数
     */
    public onOpen(...args: any[]): void {

    }

    /**
     * 每次界面Open动画播放完毕时回调
     */
    public onOpenAniOver(): void {
    }

    // 确认按钮被点击
    public onOKTouch(...args: any[]) {

    }

    // 取消按钮被点击
    public onNOTouch(...args: any[]) {

    }
}