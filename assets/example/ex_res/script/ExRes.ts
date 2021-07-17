
import { _decorator, Component, SpriteFrame, Sprite, EventTouch, assetManager, resources, Texture2D } from 'cc';
import { ResLeakChecker } from '../../../script/res/ResLeakChecker';
import { resLoader } from '../../../script/res/ResLoader';
import { ResUtil } from '../../../script/res/ResUtil';
const { ccclass, property } = _decorator;

@ccclass('ExRes')
export class ExRes extends Component {

    @property(Sprite)
    spr: Sprite = null!;

    start() {
        ResLeakChecker.getInstance().startCheck();
    }

    public loadSprite(path: string) {
        // 官方接口
        // resources.load(path, SpriteFrame, (err, asset: SpriteFrame) => {
        //     if (err) return;
        //     this.spr.spriteFrame = asset;
        //     asset.addRef();
        // })

        // 框架接口
        resLoader.load(path, SpriteFrame, (err, asset: SpriteFrame) => {
            if (err) return;
            this.spr.spriteFrame = asset;
            asset.addRef();
        })
    }

    public clickBtn_loadSprite(event: EventTouch) {
        this.loadSprite('texture/test/spriteFrame');
    }

    public clickBtn_decSprite(event: EventTouch) {
        this.spr.spriteFrame?.decRef()
    }

    public clickBtn_releaseSprite(event: EventTouch) {
        assetManager.releaseAsset(this.spr.spriteFrame!);
    }

    public clickBtn_releaseUnusedAssets(event: EventTouch) {
        resources.releaseUnusedAssets();
    }

    public dumpAsset() {
        console.log(assetManager.assets);
    }

    public dumpTrace() {
        ResLeakChecker.getInstance().dump();
    }
}