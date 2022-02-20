
/**
 * ResPool，可提高资源缓存的效率，
 * 当超过警戒水位时，每次加载新的资源都会自动检查可释放的资源进行释放
 * 
 * 暂不可用
 */

import { Asset } from "cc";
import { resLoader } from "./ResLoader";
import { AssetType, CompleteCallback, ProgressCallback, ResUtils } from "./ResUtils";

export class ResPool {
    // 资源池名字
    private _name: string | null = null;
    // 缓存资源记录
    private _resCache: Set<Asset> = new Set<Asset>();
    // 资源水位
    private _waterMark: number = 32;
    public constructor(name?: string) {
        if (name && '' != name) this._name = name;
    }

    /**
     * 设置监控水位
     * @param waterMark 水位
     */
    public setWaterMark(waterMark: number) {
        this._waterMark = waterMark;
    }

    /**
     * 开始加载资源
     * @param bundle        assetbundle的路径
     * @param url           资源url或url数组
     * @param type          资源类型，默认为null
     * @param onProgress    加载进度回调
     * @param onCompleted   加载完成回调
     */
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(): void {
        let args = ResUtils.makeLoadResArgs.apply(this, arguments as any);
        args!.pool = this;
        resLoader.load(args as any);
    }

    /**
     * 缓存资源
     * @param asset 
     */
    public cacheAsset(asset: Asset) {
        if (!this._resCache.has(asset)) {
            asset.addRef();
            this._resCache.add(asset);
        }
    }

    // 释放全部缓存资源
    public releaseAssets() {
        this._resCache.forEach(element => {
            element.decRef();
        });
        this._resCache.clear();
    }

    /**
     * 自动检测是否需要释放资源，需要则自动释放资源
     */
    public autoCheck() {
        if (this._resCache.size <= this._waterMark) return;
        // 缓存资源数量超过水位线
        this._resCache.forEach(element => {
            if (element.refCount <= 1) element.decRef();
        });
        // to-do: 删除缓存记录
    }

    /**
     * 清空该ResPool
     */
    public destroy() {
        this.releaseAssets();
    }
}
