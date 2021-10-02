import { Color, director, find, Layers, Sprite, SpriteFrame } from "cc";
import { log } from "cc";
import { isValid } from "cc";
import { view } from "cc";
import { UITransform } from "cc";
import { instantiate } from "cc";
import { Node } from "cc";
import { DefaultResID, resDft } from "../res/ResDefault";
import { resLoader } from "../res/ResLoader";
import { ProgressCallback } from "../res/ResUtil";
import { UIShowTypes, UIView } from "./UIView";

/**
 * UIManager界面管理类(请勿直接使用，建议通过 SceneManager 获取)
 * 
 * 1.打开界面，根据配置自动加载界面、调用初始化、播放打开动画、隐藏其他界面、屏蔽下方界面点击
 * 2.关闭界面，根据配置自动关闭界面、播放关闭动画、恢复其他界面
 * 3.切换界面，与打开界面类似，但是是将当前栈顶的界面切换成新的界面（先关闭再打开）
 * 4.提供界面缓存功能
 * 
 * 2018-8-28 by 宝爷
 */

/** UI栈结构体 */
export interface IUIInfo {
    uiId: number;                               // uiId
    uiView: UIView | null;                      // ui对象
    progressCb: ProgressCallback | null;        // 进度回调
    uiArgs: any[];                              // ui初始化参数
    preventNode?: Node | null;                  // ui触摸拦截节点
    zOrder?: number;                            // ui的层级
    isClose?: boolean;                          // ui当前是否关闭
}

/** UI配置结构体 */
export interface IUIConf {
    prefab: string;                 // 预制体路径
    bundleName?: string;            // bundle名，不配则取默认值 'resources'
    preventTouch?: boolean;         // 是否开启触摸拦截，默认关闭
    preventColor?: Color | null;    // 触摸拦截层颜色，不填则默认(0, 0, 0, 150)，最后一位表示透明度。null表示不设颜色
    zOrder?: number;                // 指定层级
}

export type UIOpenBeforeCallback = (uiId: number, preUIId: number) => void;
export type UIOpenCallback = (uiId: number, preUIId: number) => void;
export type UICloseCallback = (uiId: number) => void;

/** --------------- ui配置示例 ----------------- */
// export enum UIID {
//     Bag = 1,
//     Head,
// }

// const UIConf: { [uiId: number]: IUIConf } = {
//     [UIID.Bag]: { prefab: 'example/ui/prefab/UIBag', preventTouch: true },
//     [UIID.Head]: { prefab: 'example/ui/prefab/UIHead', preventTouch: true },
// }

// let uiMgr = sceneMgr.getUIManager();
// if (uiMgr) {
//     uiMgr.initUIConf(UIConf);
//     uiMgr.open(UIID.Bag);
// }
/** --------------- ui配置示例 ----------------- */

export class UIManager {
    // 场景uuid
    private _sceneUUID: string = '';
    public get sceneUUID() { return this._sceneUUID; }
    /** 背景UI（有若干层UI是作为背景UI，而不受切换等影响）*/
    private _backGroundUI = 0;
    /** 是否正在关闭UI */
    private _isClosing = false;
    /** 是否正在打开UI */
    private _isOpening = false;

    /** UI界面缓存（key为uiId，value为UIView节点）*/
    private _uiCache: { [uiId: number]: UIView } = {};
    /** UI界面栈 */
    private _uiStack: IUIInfo[] = [];
    /** UI待打开列表 */
    private _uiOpenQueue: IUIInfo[] = [];
    /** UI待关闭列表 */
    private _uiCloseQueue: UIView[] = [];
    /** UI配置 */
    private _uiConf: { [key: number]: IUIConf } = {};

    public constructor(sceneUUID: string) {
        this._sceneUUID = sceneUUID;
    }

    // 设置背景UI层数
    public setBackGroundUICnt(cnt: number) {
        this._backGroundUI = cnt;
    }

    /** UI打开前回调 */
    public uiOpenBeforeDelegate: UIOpenBeforeCallback | null = null;
    /** UI打开回调 */
    public uiOpenDelegate: UIOpenCallback | null = null;
    /** UI关闭回调 */
    public uiCloseDelegate: UICloseCallback | null = null;

    /**
     * 初始化所有UI的配置对象
     * @param conf 配置对象
     */
    public initUIConf(conf: { [key: number]: IUIConf }): void {
        this._uiConf = conf;
    }

    /**
     * 设置或覆盖某uiId的配置
     * @param uiId 要设置的界面id
     * @param conf 要设置的配置
     */
    public setUIConf(uiId: number, conf: IUIConf): void {
        this._uiConf[uiId] = conf;
    }

    /****************** 私有方法，UIManager内部的功能和基础规则 *******************/

    /**
     * 添加防触摸层
     * @param zOrder 屏蔽层的层级
     */
    private _preventTouch(zOrder: number, color?: Color) {
        let node = new Node()
        node.name = 'preventTouch';
        node.layer = Layers.Enum.UI_2D;

        let uiCom = node.addComponent(UITransform);
        uiCom.setContentSize(view.getVisibleSize());
        if (undefined === color) color = new Color(0, 0, 0, 150);   // 取默认值
        if (color) {
            let sprComp = node.addComponent(Sprite);
            sprComp.type = Sprite.Type.SIMPLE;
            sprComp.sizeMode = Sprite.SizeMode.CUSTOM;
            sprComp.color = color;  // 设置颜色及透明度

            resDft.getRes(DefaultResID.PureWhiteSF, (asset) => {
                if (asset) sprComp.spriteFrame = asset as SpriteFrame;
            });
        }

        node.on(Node.EventType.TOUCH_START, function (event: any) {
            event.propagationStopped = true;
        }, node);

        let parent = director.getScene()!.getChildByName('Canvas');
        parent!.addChild(node);
        uiCom.priority = zOrder - 0.1;
        // node.setSiblingIndex(zOrder - 0.1);
        return node;
    }

    /** 自动执行下一个待关闭或待打开的界面 */
    private _autoExecNextUI() {
        // 逻辑上是先关后开
        if (this._uiCloseQueue.length > 0) {
            let uiQueueInfo = this._uiCloseQueue[0];
            this._uiCloseQueue.splice(0, 1);
            this.close(uiQueueInfo);
        } else if (this._uiOpenQueue.length > 0) {
            let uiQueueInfo = this._uiOpenQueue[0];
            this._uiOpenQueue.splice(0, 1);
            this.open(uiQueueInfo.uiId, uiQueueInfo.progressCb, ...uiQueueInfo.uiArgs);
        }
    }

    /**
     * 自动检测动画组件以及特定动画，如存在则播放动画，无论动画是否播放，都执行回调
     * @param aniName 动画名
     * @param aniOverCallback 动画播放完成回调
     */
    private _autoExecAnimation(uiView: UIView, aniName: string, aniOverCallback: () => void) {
        // 暂时先省略动画播放的逻辑
        aniOverCallback();
    }

    /**
     * 自动检测资源预加载组件，如果存在则加载完成后调用completeCallback，否则直接调用
     * @param completeCallback 资源加载完成回调
     */
    private _autoLoadRes(uiView: UIView, completeCallback: () => void) {
        // 暂时先省略
        completeCallback();
    }

    /** 根据界面显示类型刷新显示 */
    private _updateUI() {
        let hideIndex: number = 0;
        let showIndex: number = this._uiStack.length - 1;
        for (; showIndex >= 0; --showIndex) {
            let mode = this._uiStack[showIndex].uiView!.showType;
            // 无论何种模式，最顶部的UI都是应该显示的
            this._uiStack[showIndex].uiView!.node.active = true;

            if (UIShowTypes.UIFullScreen == mode) {
                break;
            } else if (UIShowTypes.UISingle == mode) {
                for (let i = 0; i < this._backGroundUI; ++i) {
                    if (this._uiStack[i]) {
                        this._uiStack[i].uiView!.node.active = true;
                    }
                }
                hideIndex = this._backGroundUI;
                break;
            }
        }
        // 隐藏不应该显示的部分UI
        for (let hide: number = hideIndex; hide < showIndex; ++hide) {
            this._uiStack[hide].uiView!.node.active = false;
        }
    }

    /**
     * 异步加载一个UI的prefab，成功加载了一个prefab之后
     * @param uiId 界面id
     * @param progressCallback 加载进度回调
     * @param completeCallback 加载完成回调
     * @param uiArgs 初始化参数
     */
    private _getOrCreateUI(uiId: number, progressCallback: ProgressCallback | null, completeCallback: (uiView: UIView | null) => void, ...uiArgs: any[]): void {
        // 如果找到缓存对象，则直接返回
        let uiView: UIView | null = this._uiCache[uiId];
        if (uiView) {
            completeCallback(uiView);
            return;
        }

        // 找到UI配置
        let uiPath = this._uiConf[uiId].prefab;
        if (null == uiPath) {
            log(`getOrCreateUI ${uiId} failed, prefab conf not found!`);
            completeCallback(null);
            return;
        }

        resLoader.load(uiPath, progressCallback, (err, prefab) => {
            // 检查加载资源错误
            if (err) {
                log(`getOrCreateUI loadRes ${uiId} failed, path: ${uiPath} error: ${err}`);
                completeCallback(null);
                return;
            }
            // 检查实例化错误
            let uiNode: Node = instantiate(prefab);
            if (null == uiNode) {
                log(`getOrCreateUI instantiate ${uiId} failed, path: ${uiPath}`);
                completeCallback(null);
                prefab.addRef();
                prefab.decRef();    // 这里引用需要先加后减，防止意外释放外部模块的引用
                return;
            }
            // 检查组件获取错误
            uiView = uiNode.getComponent(UIView);
            if (null == uiView) {
                log(`getOrCreateUI getComponent ${uiId} failed, path: ${uiPath}`);
                uiNode.destroy();
                completeCallback(null);
                prefab.addRef();
                prefab.decRef();    // 这里引用需要先加后减，防止意外释放外部模块的引用
                return;
            }
            // 异步加载UI预加载的资源
            this._autoLoadRes(uiView, () => {
                uiView!.init(uiId, ...uiArgs);
                uiView!.cacheAsset(prefab);
                completeCallback(uiView);
            });
        }, this._uiConf[uiId].bundleName);
    }

    /**
     * UI被打开时回调，对UI进行初始化设置，刷新其他界面的显示，并根据
     * @param uiId 哪个界面被打开了
     * @param uiView 界面对象
     * @param uiInfo 界面栈对应的信息结构
     * @param uiArgs 界面初始化参数
     */
    private _onUIOpen(uiId: number, uiView: UIView, uiInfo: IUIInfo, ...uiArgs: any[]) {
        if (null == uiView) {
            return;
        }
        // 激活界面
        uiInfo.uiView = uiView;
        uiView.node.active = true;
        let uiCom = uiView.getComponent(UITransform);
        if (!uiCom) {
            uiCom = uiView.addComponent(UITransform);
        }

        // 快速关闭界面的设置，绑定界面中的background，实现快速关闭
        if (uiView.quickClose) {
            let backGround = uiView.node.getChildByName('background');
            if (!backGround) {
                backGround = new Node()
                backGround.name = 'background';
                let uiCom = backGround.addComponent(UITransform);
                uiCom.setContentSize(view.getVisibleSize());
                uiView.node.addChild(backGround);
                uiCom.priority = -1;
                // backGround.setSiblingIndex(-1);
            }
            backGround.layer = Layers.Enum.UI_2D;   // 层级如果不可见，事件也不会响应
            backGround.targetOff(Node.EventType.TOUCH_START);
            backGround.on(Node.EventType.TOUCH_START, (event: any) => {
                event.propagationStopped = true;
                this.close(uiView);
            }, backGround);
        }

        // 添加到场景中
        let parent = find('Canvas');
        parent!.addChild(uiView.node);
        uiCom!.priority = uiInfo.zOrder || this._uiStack.length;
        // uiView.node.setSiblingIndex(uiInfo.zOrder || this._uiStack.length);

        // 刷新其他UI
        this._updateUI();

        // 从哪个界面打开的
        let fromUIID = 0;
        if (this._uiStack.length > 1) {
            fromUIID = this._uiStack[this._uiStack.length - 2].uiId
        }

        // 打开界面之前回调
        if (this.uiOpenBeforeDelegate) {
            this.uiOpenBeforeDelegate(uiId, fromUIID);
        }

        // 执行onOpen回调
        uiView.onOpen(fromUIID, ...uiArgs);
        this._autoExecAnimation(uiView, "uiOpen", () => {
            uiView.onOpenAniOver();
            if (this.uiOpenDelegate) {
                this.uiOpenDelegate(uiId, fromUIID);
            }
        });
    }

    /** 打开界面并添加到界面栈中 */
    public open(uiId: number, progressCallback: ProgressCallback | null = null, ...uiArgs: any[]): void {
        let uiInfo: IUIInfo = {
            uiId: uiId,
            uiArgs: uiArgs,
            uiView: null,
            progressCb: progressCallback
        };

        if (this._isOpening || this._isClosing) {
            // 插入待打开队列
            this._uiOpenQueue.push(uiInfo);
            return;
        }

        let uiIndex = this.getUIIndex(uiId);
        if (-1 != uiIndex) {
            // 重复打开了同一个界面，直接回到该界面
            this.closeToUI(uiId, true, ...uiArgs);
            return;
        }

        // 设置UI的zOrder
        if (undefined === this._uiConf[uiId].zOrder) {
            // 自动生成zOrder
            let autoZCnt = 0, tmpId = 0;
            for (let i = 0; i < this._uiStack.length; ++i) {
                tmpId = this._uiStack[i].uiId;
                if (undefined === this._uiConf[tmpId].zOrder) ++autoZCnt;
            }
            uiInfo.zOrder = autoZCnt + 1;
        } else {
            // 主动指定zOrder
            uiInfo.zOrder = this._uiConf[uiId].zOrder as number;
        }
        this._uiStack.push(uiInfo);
        this._uiStack.sort(this._sortUIStack.bind(this));

        // 先屏蔽点击
        if (this._uiConf[uiId].preventTouch) {
            uiInfo.preventNode = this._preventTouch(uiInfo.zOrder, this._uiConf[uiId].preventColor!);
        }

        this._isOpening = true;
        // 预加载资源，并在资源加载完成后自动打开界面
        this._getOrCreateUI(uiId, progressCallback, (uiView: UIView | null): void => {
            // 如果界面已经被关闭或创建失败
            if (uiInfo.isClose || null == uiView) {
                log(`getOrCreateUI ${uiId} failed!
                        close state : ${uiInfo.isClose} , uiView : ${uiView}`);
                this._isOpening = false;
                if (uiInfo.preventNode) {
                    uiInfo.preventNode.destroy();
                    uiInfo.preventNode = null;
                }
                return;
            }

            // 打开UI，执行配置
            this._onUIOpen(uiId, uiView, uiInfo, ...uiArgs);
            this._isOpening = false;
            this._autoExecNextUI();
        }, ...uiArgs);
    }

    // ui栈排序（zOrder升序）
    private _sortUIStack(uiA: IUIInfo, uiB: IUIInfo) {
        return (uiA.zOrder! - uiB.zOrder!);
    }

    /** 替换栈顶界面 */
    public replace(uiId: number, ...uiArgs: any[]) {
        this.close(this._uiStack[this._uiStack.length - 1].uiView!);
        this.open(uiId, null, ...uiArgs);
    }

    /**
     * 关闭当前界面
     * @param closeUI 要关闭的界面
     */
    public close(closeUI?: UIView) {
        let uiCount = this._uiStack.length;
        if (uiCount < 1 || this._isClosing || this._isOpening) {
            if (closeUI) {
                // 插入待关闭队列
                this._uiCloseQueue.push(closeUI);
            }
            return;
        }

        let uiInfo: IUIInfo | undefined;
        if (closeUI) {
            for (let index = this._uiStack.length - 1; index >= 0; index--) {
                let ui = this._uiStack[index];
                if (ui.uiView === closeUI) {
                    uiInfo = ui;
                    this._uiStack.splice(index, 1);
                    break;
                }
            }

        } else {
            uiInfo = this._uiStack.pop();
        }
        // 找不到这个UI
        if (uiInfo === undefined) {
            return;
        }

        // 关闭当前界面
        let uiId = uiInfo.uiId;
        let uiView = uiInfo.uiView;
        uiInfo.isClose = true;

        // 回收遮罩层
        if (uiInfo.preventNode) {
            uiInfo.preventNode.destroy();
            uiInfo.preventNode = null;
        }

        if (!uiView) {
            return;
        }

        let preUIInfo = this._uiStack[uiCount - 2];
        // 处理显示模式
        this._updateUI();
        let close = () => {
            this._isClosing = false;
            // 显示之前的界面
            if (preUIInfo && preUIInfo.uiView && this.isTopUI(preUIInfo.uiId)) {
                // 如果之前的界面弹到了最上方（中间有可能打开了其他界面）
                preUIInfo.uiView.node.active = true
                // 回调onTop
                preUIInfo.uiView.onTop(uiId, uiView!.onClose());
            } else {
                uiView!.onClose();
            }

            if (this.uiCloseDelegate) {
                this.uiCloseDelegate(uiId);
            }
            if (uiView!.cache) {
                this._uiCache[uiId] = uiView!;
                uiView!.node.removeFromParent();
                log(`uiView removeFromParent ${uiInfo!.uiId}`);
            } else {
                uiView!.releaseAssets();
                uiView!.node.destroy();
                log(`uiView destroy ${uiInfo!.uiId}`);
            }
            this._autoExecNextUI();
        }
        // 执行关闭动画
        this._autoExecAnimation(uiView, "uiClose", close);
    }

    /** 关闭所有界面 */
    public closeAll() {
        // 不播放动画，也不清理缓存
        for (const uiInfo of this._uiStack) {
            uiInfo.isClose = true;
            if (uiInfo.preventNode) {
                uiInfo.preventNode.destroy();
                uiInfo.preventNode = null;
            }
            if (uiInfo.uiView) {
                uiInfo.uiView.onClose();
                uiInfo.uiView.releaseAssets();
                uiInfo.uiView.node.destroy();
            }
        }
        this._uiOpenQueue = [];
        this._uiCloseQueue = [];
        this._uiStack = [];
        this._isOpening = false;
        this._isClosing = false;
    }

    /**
     * 关闭界面，一直关闭到顶部为uiId的界面，为避免循环打开UI导致UI栈溢出
     * @param uiId 要关闭到的uiId（关闭其顶部的ui）
     * @param bOpenSelf 是否重新打开自己
     * @param uiArgs 打开的参数
     * 
     */
    public closeToUI(uiId: number, bOpenSelf = true, ...uiArgs: any[]): void {
        let idx = this.getUIIndex(uiId);
        if (-1 == idx) {
            return;
        }

        idx = bOpenSelf ? idx : idx + 1;
        for (let i = this._uiStack.length - 1; i >= idx; --i) {
            let uiInfo = this._uiStack.pop();
            if (!uiInfo) {
                continue;
            }

            let uiId = uiInfo.uiId;
            let uiView = uiInfo.uiView;
            uiInfo.isClose = true

            // 回收屏蔽层
            if (uiInfo.preventNode) {
                uiInfo.preventNode.destroy();
                uiInfo.preventNode = null;
            }

            if (this.uiCloseDelegate) {
                this.uiCloseDelegate(uiId);
            }

            if (uiView) {
                uiView.onClose()
                if (uiView.cache) {
                    this._uiCache[uiId] = uiView;
                    uiView.node.removeFromParent();
                } else {
                    uiView.releaseAssets();
                    uiView.node.destroy();
                }
            }
        }

        this._updateUI();
        this._uiOpenQueue = [];
        this._uiCloseQueue = [];
        bOpenSelf && this.open(uiId, null, ...uiArgs);
    }

    /** 清理界面缓存 */
    public clearCache(): void {
        for (const key in this._uiCache) {
            let ui = this._uiCache[key];
            if (isValid(ui.node)) {
                if (isValid(ui)) {
                    ui.releaseAssets();
                }
                ui.node.destroy();
            }
        }
        this._uiCache = {};
    }

    /******************** UI的便捷接口 *******************/
    public isTopUI(uiId: number): boolean {
        if (this._uiStack.length == 0) {
            return false;
        }
        return this._uiStack[this._uiStack.length - 1].uiId == uiId;
    }

    public getUI(uiId: number): UIView | null {
        for (let index = 0; index < this._uiStack.length; index++) {
            const element = this._uiStack[index];
            if (uiId == element.uiId) {
                return element.uiView;
            }
        }
        return null;
    }

    public getTopUI(): UIView | null {
        if (this._uiStack.length > 0) {
            return this._uiStack[this._uiStack.length - 1].uiView;
        }
        return null;
    }

    public getUIIndex(uiId: number): number {
        for (let index = 0; index < this._uiStack.length; index++) {
            const element = this._uiStack[index];
            if (uiId == element.uiId) {
                return index;
            }
        }
        return -1;
    }
}
