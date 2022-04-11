
import { log } from 'cc';
import { _decorator } from 'cc';
import { uiMgr } from '../../../../base/script/ui/UIManager';
import { UIView } from '../../../../base/script/ui/UIView';
const { ccclass, property } = _decorator;

@ccclass('UIBag')
export class UIBag extends UIView {

    onBtnClose() {
        uiMgr.close(this);
    }

    public onOpen(fromUI: UIView, ...args: any[]): void {
        log('UIBag.onOpen -----');
        if (fromUI) {
            log(fromUI.uiId);
        } else {
            log(0);
        }
        log(args);
    }

    onDestroy() {
        super.onDestroy();
    }
}
