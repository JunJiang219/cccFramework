
import { _decorator, Component, assetManager, Prefab, instantiate, find } from 'cc';
import { resLoader } from '../../../../base/script/res/ResLoader';
import { sceneMgr } from '../../../../base/script/scene/SceneManager';
import { IUIConf } from '../../../../base/script/ui/UIManager';
const { ccclass, property } = _decorator;

export enum UIID {
    Bag,
    Head,
}

const UIConf: { [uiId: number]: IUIConf } = {
    [UIID.Bag]: { prefab: 'example/ui/prefab/UIBag', preventTouch: true },
    [UIID.Head]: { prefab: 'example/ui/prefab/UIHead', preventTouch: true },
}

@ccclass('ExUI')
export class ExUI extends Component {

    start() {
        assetManager.loadBundle('base', (err, bundle) => {
            if (err) return;

            let uiMgr = sceneMgr.getUIManager();
            uiMgr?.initUIConf(UIConf);
            uiMgr?.open(UIID.Bag);

            uiMgr?.open(UIID.Head, () => { }, 1, 2, 3);
        });
    }
}