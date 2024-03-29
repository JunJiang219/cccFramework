
import { log } from 'cc';
import { _decorator, Component, assetManager, director } from 'cc';
import { IUIConf, uiMgr } from '../../../../base/script/ui/UIManager';
const { ccclass, property } = _decorator;

export enum UIID {
    Bag = 1,
    Head,
}

const UIConf: { [uiId: number]: IUIConf } = {
    [UIID.Bag]: { prefab: 'example/ui/prefab/UIBag', preventTouch: true, multiInstance: true },
    [UIID.Head]: { prefab: 'example/ui/prefab/UIHead', preventTouch: false },
}

@ccclass('ExUI')
export class ExUI extends Component {

    start() {
        assetManager.loadBundle('base', (err, bundle) => {
            if (err) return;

            uiMgr.initUIConf(UIConf);
            uiMgr.open(UIID.Bag, null, 5);
            uiMgr.open(UIID.Head, null, 8);
        });
    }

    public onBtnChangeScene() {
        director.loadScene('ex_cut');
        // uiMgr.closeByID(UIID.Head);
    }

    onDestroy() {
        log('ExUI.onDestroy()');
    }
}