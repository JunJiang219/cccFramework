
import { find, UITransform, _decorator } from 'cc';
import { sceneMgr } from '../../../../base/script/scene/SceneManager';
import { UIView } from '../../../../base/script/ui/UIView';
import { UIID } from './ExUI';
const { ccclass, property } = _decorator;

@ccclass('UIBag')
export class UIBag extends UIView {

    onBtnClose() {
        sceneMgr.getUIManager()?.close(this);
    }

    public onOpen(fromUI: number, ...args: any[]): void {
        console.log('onOpen -----');
        console.log(fromUI);
        console.log(args);
    }
}
