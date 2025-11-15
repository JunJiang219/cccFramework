
import { AssetType, CCMLoadResArgs, CCMResUtil, CompleteCallback, IRemoteOptions, ProgressCallback } from "./CCMResUtil";
import Asset = cc.Asset;
import Component = cc.Component;
import _decorator = cc._decorator;
import CCMResLoader from "./CCMResLoader";
import { CCMResCacheArgs, CCMResManager } from "./CCMResManager";

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
export class CCMResKeeper extends Component {

    private resCache = new Set<Asset>();

    /**
     * 加载指定资源
     * @param bundleName    bundle的名字
     * @param paths         单个资源路径 | 一组资源路径
     * @param type          资源类型，默认为null
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     */
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public load<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResUtil.makeLoadResArgs.apply(this, arguments);
        args!.keeper = this;

        const resLoader = CCMResLoader.getInstance();
        resLoader.loadDir(args as any);
    }

    /**
     * 加载目录资源
     * @param bundleName    bundle的名字
     * @param dir           资源目录
     * @param type          资源类型，默认为null
     * @param onProgress    加载进度回调
     * @param onComplete    加载完成回调
     */
    public loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    public loadDir<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResUtil.makeLoadDirArgs.apply(this, arguments);
        args!.keeper = this;

        const resLoader = CCMResLoader.getInstance();
        resLoader.loadDir(args as any);
    }

    /**
     * 加载远程资源
     * @param url           远程资源url
     * @param options       加载可选参数
     * @param onComplete    加载完成回调
     */
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | CompleteCallback<T> | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>() {
        let args: CCMLoadResArgs<T> | null = CCMResUtil.makeLoadRemoteArgs.apply(this, arguments);
        args!.keeper = this;

        const resLoader = CCMResLoader.getInstance();
        resLoader.loadRemote(args as any);
    }

    /**
     * 缓存资源
     * @param asset 
     * @param args 
     */
    public cacheAsset(asset: Asset, args?: CCMResCacheArgs) {
        CCMResManager.getInstance().cacheAsset(this, asset, args);
    }

    /**
     * 手动释放资源
     * @param immediately 是否立即释放资源
     */
    public releaseAssets(immediately: boolean = false) {
        CCMResManager.getInstance().releaseKeeperAssets(this, immediately);
    }

    /**
     * 组件销毁时自动释放所有keep的资源
     */
    protected onDestroy() {
        CCMResManager.getInstance().invalidateKeeper(this);
        this.releaseAssets(false);
    }
}