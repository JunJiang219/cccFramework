
import { log } from 'cc';
import { _decorator, Component, SpriteFrame, Sprite, EventTouch, assetManager, resources } from 'cc';
import { IFsmInitObj, StateMachine } from '../../../../base/script/common/StateMachine';
import { ResLeakChecker } from '../../../../base/script/res/ResLeakChecker';
import { resLoader } from '../../../../base/script/res/ResLoader';
const { ccclass, property } = _decorator;

class Test extends StateMachine {
    public constructor(param: IFsmInitObj, a: string) {
        super(param);
        log(a);
    }
}

@ccclass('ExRes')
export class ExRes extends Component {

    @property(Sprite)
    spr: Sprite = null!;

    private _num: number = 10;

    start() {
        this._initProj();
        let test = new Test({
            init: 'solid',
            transitions: [
                { name: 'melt', from: 'solid', to: 'liquid' },
                { name: 'freeze', from: 'liquid', to: 'solid' },
                { name: 'vaporize', from: 'liquid', to: 'gas' },
                { name: 'condense', from: 'gas', to: 'liquid' },
                { name: 'goto', from: '*', to: this.abc.bind(this) }
            ],
            methods: {
                onBeforeTransition: function () { log('onBeforeTransition', arguments, arguments[0].event) },
                onAfterTransition: function () { log('onAfterTransition', arguments, arguments[0].event) },
                onEnterState: function () { log('onEnterState', arguments, arguments[0].event) },
                onLeaveState: function () { log('onLeaveState', arguments, arguments[0].event) },
                onTransition: function () { log('onTransition', arguments, arguments[0].event) },
            }
        }, "abc");
        log(test.allStates());
        // test.delTransitions([
        //     { name: 'melt',     from: 'solid',  to: 'liquid' },
        //     // { name: 'freeze',   from: 'liquid', to: 'solid'  },
        // ]);
        test.execTransit('goto', 'liquid');
        log(test.state);
        // test.execTransit('freeze');
        // log(test.state);
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