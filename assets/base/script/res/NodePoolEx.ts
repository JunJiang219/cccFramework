import { isValid } from "cc";
import { error } from "cc";
import { instantiate } from "cc";
import { Prefab, Node } from "cc";
import { resLoader } from "./ResLoader";

/**
 * Prefab的实例对象管理，目标为减少instantiate的次数，复用Node
 * 
 * 2020-1-19 by 宝爷
 */
export type NodePoolExCallback = (error: Error | null, nodePool: NodePoolEx) => void;

export class NodePoolEx {
    private _isReady: boolean = false;
    private _createCount: number = 0;
    private _waterMark: number = 10;
    private _res: Prefab | null = null;
    private _nodes: Node[] = [];
    public isReady() { return this._isReady; }
    /**
     * 初始化NodePool，可以传入使用resLoader加载的prefab，或者传入url异步加载
     * 如果使用url来初始化，需要检查isReady，否则获取node会返回null
     * @param prefab 
     * @param url
     */
    public init(prefab: Prefab) : void
    public init(url: string, finishCallback: NodePoolExCallback) : void
    public init(urlOrPrefab : Prefab | string, finishCallback?: NodePoolExCallback) {
        if (urlOrPrefab instanceof Prefab) {
            this._res = urlOrPrefab;
            this._res.addRef();
            this._isReady = true;
        } else {
            resLoader.load(urlOrPrefab, Prefab, (error, prefab: Prefab) => {
                if (!error) {
                    this._res = prefab;
                    this._res.addRef();
                    this._isReady = true;
                }
                if (finishCallback) {
                    finishCallback(error, this);
                }
            });
        }
    }

    /**
     * 获取或创建一个Prefab实例Node
     */
    public getNode(): Node | null | undefined {
        if (!this.isReady) {
            return null;
        }
        if (this._nodes.length > 0) {
            return this._nodes.pop();
        } else {
            this._createCount++;
            return instantiate(this._res!);
        }
    }
    /**
     * 回收Node实例
     * @param node 要回收的Prefab实例
     */
    public freeNode(node: Node) {
        if (!isValid(node)) {
            error('[ERROR] PrefabPool: freePrefab: isValid node');
            this._createCount--;
            return;
        }
        if (this._waterMark < this._nodes.length) {
            this._createCount--;
            node.destroy();
        } else {
            node.removeFromParent();
            this._nodes.push(node);
        }
    }
    /**
     * 设置回收水位
     * @param waterMark 水位
     */
    public setWaterMark(waterMark: number) {
        this._waterMark = waterMark;
    }
    /**
     * 池子里的prefab是否都没有使用
     */
    public isUnuse() {
        if (this._nodes.length > this._createCount) {
            error('PrefabPool: _nodes.length > _createCount');
        }
        return this._nodes.length == this._createCount;
    }
    /**
     * 清空prefab
     */
    public destroy() {
        // 清空节点、回收资源
        for (let i = 0, len = this._nodes.length; i < len; ++i) {
            this._nodes[i].destroy();
        }
        this._createCount -= this._nodes.length;
        this._nodes.length = 0;
        if (this._res) {
            this._res.decRef();
            this._res = null;
        }
    }
}