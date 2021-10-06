
import { _decorator } from 'cc';
import { sceneMgr } from '../../../../base/script/scene/SceneManager';
import { UIView } from '../../../../base/script/ui/UIView';
const { ccclass, property } = _decorator;

@ccclass('UIBag')
export class UIBag extends UIView {

    onBtnClose() {
        sceneMgr.getUIManager()?.close(this);
    }

    public onOpen(fromUI: UIView, ...args: any[]): void {
        console.log('onOpen -----');
        if (fromUI) {
            console.log(fromUI.uiId);
        } else {
            console.log(0);
        }
        console.log(args);
    }

    onDestroy() {
        super.onDestroy();
    }
}
