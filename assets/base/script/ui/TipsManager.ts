
import { log, _decorator } from 'cc';
import { IDialogArgs } from './DialogBase';
import { IToastArgs } from './ToastBase';
import { uiMgr } from './UIManager';
const { ccclass, property } = _decorator;

export interface ITipsConf {
    DialogUIID: number,
    ToastUIID: number,
}

@ccclass('TipsManager')
export class TipsManager {

    private static _instance: TipsManager | null = null;
    private constructor() { }
    public static getInstance(): TipsManager {
        if (!TipsManager._instance) TipsManager._instance = new TipsManager();
        return TipsManager._instance;
    }

    /** UI配置 */
    private _uiConf: ITipsConf | null = null;
    /**
     * 初始化所有UI的配置对象
     * @param conf 配置对象
     */
    public initUIConf(conf: ITipsConf): void {
        this._uiConf = conf;
    }

    // 显示模态提示框
    public showDialog(args: IDialogArgs) {
        let uiId = this._uiConf?.DialogUIID;
        if (undefined == uiId) {
            log('DialogUIID not configured!');
            return;
        }

        uiMgr.open(uiId, null, args);
    }

    // 隐藏模态提示框
    public hideDialog() {
        let uiId = this._uiConf?.DialogUIID;
        if (undefined == uiId) {
            log('DialogUIID not configured!');
            return;
        }

        uiMgr.closeByID(uiId);
    }

    // 显示非模态提示
    public showToast(args: IToastArgs) {
        let uiId = this._uiConf?.ToastUIID;
        if (undefined == uiId) {
            log('ToastUIID not configured!');
            return;
        }

        uiMgr.open(uiId, null, args);
    }

    // 隐藏非模态提示
    public hideToast() {
        let uiId = this._uiConf?.ToastUIID;
        if (undefined == uiId) {
            log('ToastUIID not configured!');
            return;
        }

        uiMgr.closeByID(uiId);
    }
}

export let tipsMgr = TipsManager.getInstance();