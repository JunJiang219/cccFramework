/**
 * ResLoader2，封装资源的加载和卸载接口，隐藏新老资源底层差异
 * 1. 加载资源接口
 * 2. 卸载资源接口
 * 
 * 2021-1-24 by 宝爷
 */

import { Asset, resources, assetManager, AssetManager } from "cc";
import { AssetType, CompleteCallback, ILoadResArgs, IRemoteOptions, ProgressCallback, ResUtil } from "./ResUtil";

export class ResLoader {
    private static _instance: ResLoader | null = null;
    private constructor() {}
    public static getInstance(): ResLoader {
        if (!this._instance) this._instance = new ResLoader();
        return this._instance;
    }

    private _loadByBundleAndArgs<T extends Asset>(bundle: AssetManager.Bundle, args: ILoadResArgs<T>): void {
        if (args.dir) {
            bundle.loadDir(args.dir, args.type!, args.onProgress!, args.onComplete!);
        } else {
            if (typeof args.paths == 'string') {
                bundle.load(args.paths, args.type!, args.onProgress!, args.onComplete!);
            } else {
                bundle.load(args.paths as string[], args.type!, args.onProgress!, args.onComplete!);
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

    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null, bundleName?: string): void;
    public load(...args: any[]): void {
        let resArgs = ResUtil.makeLoadResArgs.apply(this, args);
        if (resArgs) this._loadByArgs(resArgs);
    }

    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null, bundleName?: string): void;
    public loadDir(...args: any[]): void {
        let resArgs = ResUtil.makeLoadResArgs.apply(this, args);
        if (resArgs) {
            resArgs.dir = resArgs.paths as string;
            this._loadByArgs(resArgs);
        }
    }

    public loadRemote<T extends Asset>(url: string, options: IRemoteOptions | null, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote<T extends Asset>(url: string, onComplete?: CompleteCallback<T> | null): void;
    public loadRemote(...args: any[]): void {
        let resArgs = ResUtil.makeLoadResArgs.apply(this, args);
        if (resArgs) assetManager.loadRemote(resArgs.paths as string, resArgs.options!, resArgs.onComplete);
    }
}

export let resLoader = ResLoader.getInstance();