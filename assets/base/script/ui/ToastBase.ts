/**
 * 非模态提示基类
 */
import { _decorator } from 'cc';
import { ResKeeper } from '../res/ResKeeper';
const { ccclass, property } = _decorator;

// 非模态提示参数
export interface IToastArgs {
    content: string,
}

@ccclass('ToastBase')
export class ToastBase extends ResKeeper {

}
