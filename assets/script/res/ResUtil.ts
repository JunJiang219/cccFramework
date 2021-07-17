/**
 * 资源使用相关工具类
 * 2020-1-18 by 宝爷
 */

import { instantiate, Node, Asset, Prefab, __private, Constructor, js } from "cc";
import { ResKeeper } from "./ResKeeper";

 export type ProgressCallback = __private.cocos_core_asset_manager_shared_ProgressCallback;
 export type CompleteCallback<T = any> = __private.cocos_core_asset_manager_shared_CompleteCallbackWithData;
 export type IRemoteOptions = __private.cocos_core_asset_manager_shared_IRemoteOptions;
 export type AssetType<T = Asset> = Constructor<T>;

 export interface ILoadResArgs<T extends Asset> {
    paths?: string | string[];                                          // 资源路径
    dir?: string;                                                       // 目录
    type?: AssetType<T> | null;                                         // 资源类型
    options?: IRemoteOptions | null;                                    // 远程资源可选参数
    onProgress?: ProgressCallback | null;                               // 加载进度回调
    onComplete?: CompleteCallback<T> | CompleteCallback<T[]> | null;    // 加载完成回调
    bundleName?: string;                                                // bundle名
    keeper?: ResKeeper;                                                 // 资源引用类实例
}

export class ResUtil {
    /**
     * 构建bundle内资源加载参数结构体
     */
    public static makeLoadResArgs<T extends Asset>(): ILoadResArgs<T> | null {
        if (arguments.length < 1) {
            console.error(`makeLoadResArgs error ${arguments}`);
            return null;
        }

        let resArgs: ILoadResArgs<T> = { bundleName: "resources" };
        if (typeof arguments[0] == "string") {
            resArgs.paths = arguments[0];
        } else if (arguments[0] instanceof Array) {
            resArgs.paths = arguments[0];
        }else if (arguments[0] instanceof Object) {
            return arguments[0];    // 已经是 ILoadResArgs
        } else {
            console.error(`makeLoadResArgs error ${arguments}`);
            return null;
        }

        for (let i = 1; i < arguments.length; ++i) {
            if (i == 1 && js.isChildClassOf(arguments[i], Asset)) {
                // 判断是不是第一个参数type
                resArgs.type = arguments[i];
            } else if (typeof arguments[i] == "string") {
                resArgs.bundleName = arguments[i];
            } else if (typeof arguments[i] == "function") {
                // 其他情况为函数
                if (arguments.length > i + 1 && typeof arguments[i + 1] == "function") {
                    resArgs.onProgress = arguments[i];
                } else {
                    resArgs.onComplete = arguments[i];
                }
            }
        }

        return resArgs;
    }

    /**
     * 构建远程资源加载参数结构体
     */
     public static makeLoadRemoteArgs<T extends Asset>(): ILoadResArgs<T> | null {
        if (arguments.length < 1) {
            console.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        let resArgs: ILoadResArgs<T> = {};
        if (typeof arguments[0] == "string") {
            resArgs.dir = arguments[0];
        } else if (arguments[0] instanceof Object) {
            return arguments[0];    // 已经是 ILoadResArgs
        } else {
            console.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        for (let i = 1; i < arguments.length; ++i) {
            if (typeof arguments[i] == "function") {
                resArgs.onComplete = arguments[i];
            } else if (arguments[i] instanceof Object) {
                resArgs.options = arguments[i];
            }
        }

        return resArgs;
    }

    /**
     * 从目标节点或其父节点递归查找一个资源挂载组件
     * @param attachNode 目标节点
     * @param autoCreate 当目标节点找不到ResKeeper时是否自动创建一个
     */
    public static getResKeeper(attachNode: Node, autoCreate?: boolean): ResKeeper | null {
        if (attachNode) {
            let ret = attachNode.getComponent(ResKeeper);
            if (!ret) {
                if (autoCreate) {
                    return attachNode.addComponent(ResKeeper);
                } else {
                    return ResUtil.getResKeeper(attachNode.parent!, autoCreate);
                }
            }
            return ret;
        }
        // 返回一个默认的ResKeeper
        return null;
    }

    /**
    * 赋值srcAsset，并使其跟随targetNode自动释放，用法如下
    * mySprite.spriteFrame = AssignWith(otherSpriteFrame, mySpriteNode);
    * @param srcAsset 用于赋值的资源，如cc.SpriteFrame、cc.Texture等等
    * @param targetNode 
    * @param autoCreate 
    */
    public static assignWith(srcAsset: Asset, targetNode: Node, autoCreate?: boolean): any {
        let keeper = ResUtil.getResKeeper(targetNode, autoCreate);
        if (keeper && srcAsset instanceof Asset) {
            keeper.cacheAsset(srcAsset);
            return srcAsset;
        } else {
            console.error(`assignWith ${srcAsset} to ${targetNode} faile`);
            return null;
        }
    }

    /**
     * 实例化一个prefab，并带自动释放功能
     * @param prefab 要实例化的预制
     */
    public static instantiate(prefab: Prefab): Node {
        let node = instantiate(prefab);
        let keeper = ResUtil.getResKeeper(node, true);
        if (keeper) {
            keeper.cacheAsset(prefab);
        }
        return node;
    }

    /**
     * 从字符串中查找第N个字符
     * @param str 目标字符串
     * @param cha 要查找的字符
     * @param num 第N个
     */
    public static findCharPos(str: string, cha: string, num: number): number {
        let x = str.indexOf(cha);
        let ret = x;
        for (var i = 0; i < num; i++) {
            x = str.indexOf(cha, x + 1);
            if (x != -1) {
                ret = x;
            } else {
                return ret;
            }
        }
        return ret;
    }

    /**
     * 获取当前调用堆栈
     * @param popCount 要弹出的堆栈数量
     */
    public static getCallStack(popCount: number): string {
        // 严格模式无法访问 arguments.callee.caller 获取堆栈，只能先用Error的stack
        let ret = (new Error()).stack;
        let pos = ResUtil.findCharPos(ret!, '\n', popCount);
        if (pos > 0) {
            ret = ret!.slice(pos);
        }
        return ret!;
    }
}
