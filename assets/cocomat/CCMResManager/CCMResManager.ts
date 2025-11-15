/**
 * 资源管理类
 */

import { CCMResKeeper } from "./CCMResKeeper";
import Asset = cc.Asset;

const ASSET_KEEP_DEFAULT_TIME = 60;     // 资源默认延迟释放时间（单位：秒）
const RES_UPDATE_INTERVAL = 5;          // 资源管理器更新间隔（单位：秒）

// 资源释放时机类型
export enum CCMResReleaseTiming {
    OnDestroy,      // 组件销毁时，立即释放
    AfterDestroy,   // 组件销毁后，延迟一定时间释放
}

// 资源缓存参数
export interface CCMResCacheArgs {
    releaseTiming: CCMResReleaseTiming; // 资源释放时机类型
    keepTime?: number;                  // keeper销毁后或资源不再需要时，asset 还能存活的时间（单位：秒），仅当 releaseTiming 为 AfterDestroy 时有效（默认 ASSET_KEEP_DEFAULT_TIME 秒）
}

// 资源缓存映射
export type CCMResCacheMap = Map<Asset, CCMResCacheArgs>;

// 资源缓存信息
export interface CCMResCacheInfo {
    cacheMap: CCMResCacheMap;           // 资源缓存映射
    keeperInvalidTS?: number;           // keeper 失效时间戳，单位：秒
}

export class CCMResManager {
    private static _instance: CCMResManager = null;
    private constructor() { }
    public static getInstance(): CCMResManager {
        if (CCMResManager._instance === null) {
            CCMResManager._instance = new CCMResManager();
        }
        return CCMResManager._instance;
    }

    private _resMap: Map<CCMResKeeper, CCMResCacheInfo> = new Map<CCMResKeeper, CCMResCacheInfo>();
    private _updateElapsed: number = 0;

    /**
     * 缓存指定资源
     * @param keeper 资源持有者
     * @param asset 资源
     * @param args 缓存参数（不填则默认释放时机为 OnDestroy）
     */
    public cacheAsset(keeper: CCMResKeeper, asset: Asset, args?: CCMResCacheArgs): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) {
            cacheInfo = { cacheMap: new Map<Asset, CCMResCacheArgs>() };
            this._resMap.set(keeper, cacheInfo);
        }

        let cacheMap: CCMResCacheMap = cacheInfo.cacheMap;
        if (!cacheMap.has(asset)) {
            asset.addRef();
            if (args) {
                switch (args.releaseTiming) {
                    case CCMResReleaseTiming.OnDestroy:
                        break;
                    case CCMResReleaseTiming.AfterDestroy:
                        if (undefined == args.keepTime) args.keepTime = ASSET_KEEP_DEFAULT_TIME;
                        break;
                    default:
                        break;
                }

                cacheMap.set(asset, args);
            } else {
                cacheMap.set(asset, { releaseTiming: CCMResReleaseTiming.OnDestroy });
            }
        }
    }

    // 获取指定 keeper 的缓存信息
    public getCacheInfo(keeper: CCMResKeeper): CCMResCacheInfo {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        return cacheInfo;
    }

    // 获取指定 keeper 缓存的资源
    public getCacheArgs(keeper: CCMResKeeper, asset: Asset): CCMResCacheArgs {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) {
            return null;
        }

        let cacheMap: CCMResCacheMap = cacheInfo.cacheMap;
        return cacheMap.get(asset);
    }

    // 使指定 keeper 失效（节点销毁时会调用，用户不要乱调）
    public invalidateKeeper(keeper: CCMResKeeper): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) {
            return;
        }

        if (!cacheInfo.keeperInvalidTS) cacheInfo.keeperInvalidTS = Math.floor(Date.now() / 1000);
    }

    /**
     * 释放指定 keeper 的资源
     * @param keeper 
     * @param immediately 是否立即释放
     * @returns 
     */
    public releaseKeeperAssets(keeper: CCMResKeeper, immediately: boolean = false): void {
        let cacheInfo: CCMResCacheInfo = this._resMap.get(keeper);
        if (undefined == cacheInfo) return;
        let cacheMap: CCMResCacheMap = cacheInfo.cacheMap;
        if (undefined == cacheMap) return;

        if (immediately) {
            for (const asset of cacheMap.keys()) {
                asset.decRef();
            }
            cacheMap.clear();
            this._resMap.delete(keeper);
        } else {
            if (!cacheInfo.keeperInvalidTS) return; // keeper 失效时间戳未设置，不释放资源

            let curTS = Math.floor(Date.now() / 1000);   // 当前时间戳（s）
            for (const [asset, args] of cacheMap) {
                switch (args.releaseTiming) {
                    case CCMResReleaseTiming.OnDestroy:
                        asset.decRef();
                        cacheMap.delete(asset);
                        break;
                    case CCMResReleaseTiming.AfterDestroy:
                        if (curTS - cacheInfo.keeperInvalidTS >= args.keepTime) {
                            asset.decRef();
                            cacheMap.delete(asset);
                        }
                        break;
                    default:
                        break;
                }
            }

            if (cacheMap.size == 0) {
                this._resMap.delete(keeper);
            }
        }
    }

    /**
     * 释放所有 keeper 的资源
     * @param immediately 是否立即释放
     */
    public releaseAssets(immediately: boolean = false): void {
        for (const [keeper, cacheInfo] of this._resMap) {
            if (!cc.isValid(keeper) && !cacheInfo.keeperInvalidTS) {
                cacheInfo.keeperInvalidTS = Math.floor(Date.now() / 1000);
            }
            this.releaseKeeperAssets(keeper, immediately);
        }
    }

    // 更新资源管理器，释放过期资源
    public update(dt: number) {
        this._updateElapsed += dt;
        if (this._updateElapsed >= RES_UPDATE_INTERVAL) {
            // 每5秒更新一次
            this._updateElapsed = 0;

            for (const [keeper, cacheInfo] of this._resMap) {
                if (!cc.isValid(keeper)) {
                    // keeper 已销毁
                    if (!cacheInfo.keeperInvalidTS) cacheInfo.keeperInvalidTS = Math.floor(Date.now() / 1000);
                    this.releaseKeeperAssets(keeper);
                }
            }
        }
    }
}
