/**
 * 框架默认资源
 */

import { Asset, SpriteFrame } from 'cc';
import { _decorator } from 'cc';
import { resLoader } from './ResLoader';
const { ccclass, property } = _decorator;

// 默认资源id
export enum DefaultResID {
    PureWhiteSF = 0,    // 纯白spriteFrame
}

// 默认资源配置结构体
interface IResDefConf {
    res: string,
    type?: typeof Asset | null,
    bundle: string,
}

// 默认资源配置
const ResDefaultConf: { [resId: number]: IResDefConf } = {
    [DefaultResID.PureWhiteSF]: { res: 'texture/pureWhite/spriteFrame', type: SpriteFrame, bundle: 'base' },
}

@ccclass('ResDefault')
export class ResDefault {
    private static _instance: ResDefault | null = null;
    private constructor() { }
    public static getInstance(): ResDefault {
        if (!ResDefault._instance) ResDefault._instance = new ResDefault();
        return ResDefault._instance;
    }

    // 缓存资源记录
    private _resCache = new Map<number, Asset>();

    /**
     * 缓存资源
     * @param asset 
     */
    private _cacheAsset(resId: number, asset: Asset) {
        if (!this._resCache.has(resId)) {
            asset.addRef();
            this._resCache.set(resId, asset);
        }
    }

    /**
     * 释放资源
     */
    public releaseAssets() {
        this._resCache.forEach((asset, resId) => {
            asset.decRef();
        });
        this._resCache.clear();
    }

    // 获取默认资源
    public getRes(resId: number, cb: (asset: Asset | null | undefined) => void): void {
        if (!this._resCache.has(resId)) {
            let cf = ResDefaultConf[resId];
            if (cf) {
                resLoader.load(cf.res, cf.type!, (err, asset) => {
                    if (err) {
                        cb(null);
                        return;
                    }
                    this._cacheAsset(resId, asset);
                    cb(asset);
                }, cf.bundle);
            } else {
                console.error(`ResDefault.getRes(): not configured, resId = ${resId}`);
                cb(null);
            }
        } else {
            cb(this._resCache.get(resId));
        }
    }
}

export let resDft = ResDefault.getInstance();