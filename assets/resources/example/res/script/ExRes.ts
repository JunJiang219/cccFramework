
import { log } from 'cc';
import { _decorator, Component, SpriteFrame, Sprite, EventTouch, assetManager, resources } from 'cc';
import { ResLeakChecker } from '../../../../base/script/res/ResLeakChecker';
import { resLoader } from '../../../../base/script/res/ResLoader';
const { ccclass, property } = _decorator;

@ccclass('ExRes')
export class ExRes extends Component {

    @property(Sprite)
    spr: Sprite = null!;

    private _num: number = 10;

    start() {
        this._initProj();
    }

    public async abc(s: string): Promise<string> {
        return new Promise((resole, reject) => {
            setTimeout(() => {
                resole(s);
                return s;
            }, 1000);
        });
    }

    private async _initProj(): Promise<void> {
        await this.loadBundle('base');
        this._afterInitProj();
    }

    private _afterInitProj() {
        ResLeakChecker.getInstance().startCheck();
    }

    public async loadBundle(bundleName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) return reject();
                resolve();
            })
        })
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
        log(assetManager.assets);
    }

    public dumpTrace() {
        ResLeakChecker.getInstance().dump();
    }
}