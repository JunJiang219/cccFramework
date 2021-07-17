import { Asset, Component, _decorator } from "cc";
import { resLoader } from "./ResLoader";
import { AssetType, CompleteCallback, IRemoteOptions, ProgressCallback, ResUtil } from "./ResUtil";
/**
 * 资源引用类
 * 1. 提供加载功能，并记录加载过的资源
 * 2. 在node释放时自动清理加载过的资源
 * 3. 支持手动添加记录
 * 
 * 2019-12-13 by 宝爷
 */
const { ccclass } = _decorator;

@ccclass
export class ResKeeper extends Component {
    // 缓存资源记录
    private _resCache = new Set<Asset>();

    /**
     * 开始加载资源
     * @param bundle        assetbundle的路径
     * @param url           资源url或url数组
     * @param type          资源类型，默认为null
     * @param onProgess     加载进度回调
     * @param onCompleted   加载完成回调
     */
     public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
     public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
     public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
     public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
     public load<T extends Asset>(): void {
        let args = ResUtil.makeLoadResArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.load(args as any);
    }

    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(): void {
        let args = ResUtil.makeLoadResArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.loadDir(args as any);
    }

    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(): void {
        let args = ResUtil.makeLoadRemoteArgs.apply(this, arguments as any);
        args!.keeper = this;
        resLoader.loadRemote(args as any);
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

    /**
     * 组件销毁时自动释放所有keep的资源
     */
    public onDestroy() {
        this.releaseAssets();
    }

    /**
     * 释放资源，组件销毁时自动调用
     */
    public releaseAssets() {
        this._resCache.forEach(element => {
            element.decRef();
        });
        this._resCache.clear();
    }
}