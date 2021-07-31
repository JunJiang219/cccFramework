
import { _decorator, Component, SpriteFrame, Sprite, EventTouch, assetManager, resources } from 'cc';
import { IFsmInitObj, StateMachine } from '../../../base/script/common/StateMachine';
import { ResLeakChecker } from '../../../base/script/res/ResLeakChecker';
import { resLoader } from '../../../base/script/res/ResLoader';
const { ccclass, property } = _decorator;

class Test extends StateMachine {
    public constructor(param: IFsmInitObj, a: string) {
        super(param);
        console.log(a);
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
                { name: 'melt',     from: 'solid',  to: 'liquid' },
                { name: 'freeze',   from: 'liquid', to: 'solid'  },
                { name: 'vaporize', from: 'liquid', to: 'gas'    },
                { name: 'condense', from: 'gas',    to: 'liquid' },
                { name: 'goto',     from: '*',      to: this.abc.bind(this) }
            ],
            methods: {
                onBeforeTransition: function() { console.log('onBeforeTransition', arguments) },
                onAfterTransition: function() { console.log('onAfterTransition', arguments) },
                onEnterState: function() { console.log('onEnterState', arguments) },
                onLeaveState: function() { console.log('onLeaveState', arguments) },
                onTransition: function() { console.log('onTransition', arguments) },
                onLeaveSolid: function() { 
                    console.log('onXxx');
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve("onLiquid - setTimeout");
                        }, 5000);
                    })
                },
                onPendingTransition: function(transition: string, from: string, to: string) {
                    console.log('onPendingTransition');
                },
            }
        }, "abc");
        console.log(test.allStates());
        test.execTransit('goto', 'xxx');
        test.execTransit('goto', 'liquid');
    }

    public abc(s: string) {
        console.log('abc - num: ' + this._num);
        return s;
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
        console.log(assetManager.assets);
    }

    public dumpTrace() {
        ResLeakChecker.getInstance().dump();
    }
}