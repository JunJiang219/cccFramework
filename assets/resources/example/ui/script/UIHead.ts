
import { log } from 'cc';
import { _decorator } from 'cc';
import { sceneMgr } from '../../../../base/script/scene/SceneManager';
import { UIView } from '../../../../base/script/ui/UIView';
const { ccclass, property } = _decorator;

@ccclass('UIHead')
export class UIHead extends UIView {

    onBtnClose() {
        sceneMgr.getUIManager()?.close(this);
    }

    public onOpen(fromUI: UIView, ...args: any[]): void {
        log('UIHead.onOpen -----');
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
