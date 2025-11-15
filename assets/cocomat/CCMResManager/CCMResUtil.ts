import { CCMResKeeper } from "./CCMResKeeper";
// import { CompleteCallback, ProgressCallback } from "./CCMResLoader";

import Asset = cc.Asset;
import Node = cc.Node;
import Prefab = cc.Prefab;
import instantiate = cc.instantiate;
import js = cc.js;

export type ProgressCallback = (completedCount: number, totalCount: number, item: any) => void;
export type CompleteCallback<T = any> = (error: Error, resource: any | any[], urls?: string[]) => void;
export type IRemoteOptions = Record<string, any> | null;
export type AssetType<T = Asset> = typeof Asset;

export interface CCMLoadResArgs<T extends Asset> {
    bundleName?: string;                        // bundle名（不填代表 'resources'）
    keeper?: CCMResKeeper;                      // 资源持有者
    path?: string;                              // 单个资源路径（path、paths、dir、url 四者互斥）
    paths?: string[];                           // 多个资源路径数组
    dir?: string;                               // 资源目录地址
    url?: string;                               // 远程资源地址
    type?: AssetType<T> | null;                 // 资源类型，默认为null
    options?: IRemoteOptions | null;            // 加载远程资源可选参数
    onProgress?: ProgressCallback | null;       // 加载进度回调
    onComplete?: CompleteCallback<T> | null;    // 加载完成回调
}

/**
 * 资源使用相关工具类
 * 2020-1-18 by 宝爷
 */

export class CCMResUtil {
    // 构造 CCMResLoader.load 参数
    public static makeLoadResArgs<T extends Asset>(): CCMLoadResArgs<T> | null {
        const argLen = arguments.length;
        if (argLen <= 0) {
            console.error(`makeLoadResArgs error ${arguments}`);
            return null;
        }

        let resArgs: CCMLoadResArgs<T> = { type: null, onProgress: null, onComplete: null };
        if (argLen == 1) {
            // 只有一个参数
            if (typeof arguments[0] == "string") {
                resArgs.path = arguments[0];
            } else if (arguments[0] instanceof Array) {
                resArgs.paths = arguments[0];
            } else if (arguments[0] instanceof Object) {
                // 已经是 CCMLoadResArgs
                return (arguments[0] as CCMLoadResArgs<T>);
            } else {
                console.error(`makeLoadResArgs error ${arguments}`);
                return null;
            }
        } else {
            // 两个参数及以上
            let beginIndex = 1;     // 开始遍历的index（1代表的参数列表: [path | paths, ...]    2代表的参数列表: [bundleName, path | paths, ...]）
            if (typeof arguments[1] == "string") {
                beginIndex = 2;
                resArgs.bundleName = arguments[0];
                resArgs.path = arguments[1];
            } else if (arguments[1] instanceof Array) {
                beginIndex = 2;
                resArgs.bundleName = arguments[0];
                resArgs.paths = arguments[1];
            } else {
                if (typeof arguments[0] == "string") {
                    resArgs.path = arguments[0];
                } else if (arguments[0] instanceof Array) {
                    resArgs.paths = arguments[0];
                } else {
                    console.error(`makeLoadResArgs error ${arguments}`);
                    return null;
                }
            }

            for (let index = beginIndex; index < argLen; index++) {
                const element = arguments[index];
                if (js.isChildClassOf(element, Asset)) {
                    // 判断是不是参数type
                    resArgs.type = element;
                } else if (typeof element == "function") {
                    // 其他情况为函数
                    if (index = argLen - 1) {
                        resArgs.onComplete = element;
                    } else {
                        resArgs.onProgress = element;
                    }
                }
            }
        }

        return resArgs;
    }

    // 构造 CCMResLoader.loadDir 参数
    public static makeLoadDirArgs<T extends Asset>(): CCMLoadResArgs<T> | null {
        const argLen = arguments.length;
        if (argLen <= 0) {
            console.error(`makeLoadDirArgs error ${arguments}`);
            return null;
        }

        let resArgs: CCMLoadResArgs<T> = { type: null, onProgress: null, onComplete: null };
        if (argLen == 1) {
            // 只有一个参数
            if (typeof arguments[0] == "string") {
                resArgs.dir = arguments[0];
            } else if (arguments[0] instanceof Object) {
                // 已经是 CCMLoadResArgs
                return (arguments[0] as CCMLoadResArgs<T>);
            } else {
                console.error(`makeLoadDirArgs error ${arguments}`);
                return null;
            }
        } else {
            // 两个参数及以上
            let beginIndex = 1;     // 开始遍历的index（1代表的参数列表: [dir, ...]    2代表的参数列表: [bundleName, dir, ...]）
            if (typeof arguments[1] == "string") {
                beginIndex = 2;
                resArgs.bundleName = arguments[0];
                resArgs.dir = arguments[1];
            } else {
                if (typeof arguments[0] == "string") {
                    resArgs.dir = arguments[0];
                } else {
                    console.error(`makeLoadDirArgs error ${arguments}`);
                    return null;
                }
            }

            for (let index = beginIndex; index < argLen; index++) {
                const element = arguments[index];
                if (js.isChildClassOf(element, Asset)) {
                    // 判断是不是参数type
                    resArgs.type = element;
                } else if (typeof element == "function") {
                    // 其他情况为函数
                    if (index = argLen - 1) {
                        resArgs.onComplete = element;
                    } else {
                        resArgs.onProgress = element;
                    }
                }
            }
        }

        return resArgs;
    }

    // 构造 CCMResLoader.loadRemote 参数
    public static makeLoadRemoteArgs<T extends Asset>(): CCMLoadResArgs<T> | null {
        const argLen = arguments.length;
        if (argLen <= 0) {
            console.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        let resArgs: CCMLoadResArgs<T> = { options: null, onComplete: null };
        if (typeof arguments[0] == "string") {
            resArgs.url = arguments[0];
        } else if (arguments[0] instanceof Object) {
            // 已经是 CCMLoadResArgs
            return (arguments[0] as CCMLoadResArgs<T>);
        } else {
            console.error(`makeLoadRemoteArgs error ${arguments}`);
            return null;
        }

        for (let index = 1; index < argLen; index++) {
            const element = arguments[index];
            if (typeof element == "function") {
                resArgs.onComplete = element;
            } else if (element instanceof Object) {
                resArgs.options = element;
            }
        }

        return resArgs;
    }

    /**
     * 从目标节点或其父节点递归查找一个资源挂载组件
     * @param attachNode 目标节点
     * @param autoCreate 当目标节点找不到ResKeeper时是否自动创建一个
     */
    public static getResKeeper(attachNode: Node, autoCreate?: boolean): CCMResKeeper | null {
        if (attachNode) {
            let ret = attachNode.getComponent(CCMResKeeper);
            if (!ret) {
                if (autoCreate) {
                    return attachNode.addComponent(CCMResKeeper);
                } else {
                    return CCMResUtil.getResKeeper(attachNode.parent!, autoCreate);
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
        let keeper = CCMResUtil.getResKeeper(targetNode, autoCreate);
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
        let keeper = CCMResUtil.getResKeeper(node, true);
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
    static findCharPos(str: string, cha: string, num: number): number {
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
    static getCallStack(popCount: number): string {
        // 严格模式无法访问 arguments.callee.caller 获取堆栈，只能先用Error的stack
        let ret = (new Error()).stack;
        let pos = CCMResUtil.findCharPos(ret!, '\n', popCount);
        if (pos > 0) {
            ret = ret!.slice(pos);
        }
        return ret!;
    }
}
