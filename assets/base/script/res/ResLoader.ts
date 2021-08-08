/**
 * ResLoader2，封装资源的加载和卸载接口，隐藏新老资源底层差异
 * 1. 加载资源接口
 * 2. 卸载资源接口
 * 
 * 2021-1-24 by 宝爷
 */

import { Asset, resources, assetManager, AssetManager, isValid } from "cc";
import { ResLeakChecker } from "./ResLeakChecker";
import { AssetType, CompleteCallback, ILoadResArgs, IRemoteOptions, ProgressCallback, ResUtil } from "./ResUtil";

export class ResLoader {
    private static _instance: ResLoader | null = null;
    private constructor() {}
    public static getInstance(): ResLoader {
        if (!ResLoader._instance) ResLoader._instance = new ResLoader();
        return ResLoader._instance;
    }

    private _loadByBundleAndArgs<T extends Asset>(bundle: AssetManager.Bundle, args: ILoadResArgs<T>): void {
        let finishCb: CompleteCallback<T> | CompleteCallback<T[]> | null = (err, assets) => {
            if (!err) {
                let isValid_keeper = isValid(args.keeper);
                if (assets instanceof Array) {
                    for (let i = 0, len = assets.length; i < len; ++i) {
                        ResLeakChecker.getInstance().traceAsset(assets[i]);
                        isValid_keeper && args.keeper?.cacheAsset(assets[i]);
                    }
                } else {
                    ResLeakChecker.getInstance().traceAsset(assets);
                    isValid_keeper && args.keeper?.cacheAsset(assets);
                }
            }
            if (args.onComplete) args.onComplete(err, assets);
        }

        if (args.dir) {
            bundle.loadDir(args.dir, args.type!, args.onProgress!, finishCb);
        } else {
            if (typeof args.paths == 'string') {
                bundle.load(args.paths, args.type!, args.onProgress!, finishCb);
            } else {
                bundle.load(args.paths as string[], args.type!, args.onProgress!, finishCb);
            }    
        }
    }

    private _loadByArgs<T extends Asset>(args: ILoadResArgs<T>) {
        if (args.bundleName) {
            let bundle = assetManager.bundles.get(args.bundleName);
            if (bundle) {
                this._loadByBundleAndArgs(bundle!, args);
            } else {
                // 自动加载bundle
                assetManager.loadBundle(args.bundleName, (err, bundle) => {
                    if (!err) {
                        this._loadByBundleAndArgs(bundle, args);
                    }
                })
            }
        } else {
            this._loadByBundleAndArgs(resources, args);
        }
    }

    /**
     * 加载单个或一组资源
     * @param paths 资源路径
     * @param type 资源类型
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     * @param bundleName bundle名
     */
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(): void {
        let args = ResUtil.makeLoadResArgs.apply(this, arguments as any);
        if (args) this._loadByArgs(args);
    }

    /**
     * 加载指定目录资源
     * @param dir 目录
     * @param type 资源类型
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     * @param bundleName bundle名
     */
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(): void {
        let args = ResUtil.makeLoadResArgs.apply(this, arguments as any);
        if (args) {
            args.dir = args.paths as string;
            this._loadByArgs(args);
        }
    }

    /**
     * 加载远程资源
     * @param url 远程地址
     * @param options 可选参数
     * @param onComplete 加载完成回调
     */
    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(): void {
        let args = ResUtil.makeLoadRemoteArgs.apply(this, arguments as any);
        if (args) {
            let finishCb: CompleteCallback<T> | CompleteCallback<T[]> | null = (err, assets) => {
                if (!err) {
                    ResLeakChecker.getInstance().traceAsset(assets);
                    isValid(args!.keeper) && args!.keeper!.cacheAsset(assets);
                }
                if (args!.onComplete) args!.onComplete(err, assets);
            }
            assetManager.loadRemote(args.paths as string, args.options!, finishCb);
        }
    }
}

export let resLoader = ResLoader.getInstance();