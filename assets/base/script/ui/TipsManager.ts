
import { Asset, CCLoader, instantiate, Node, Prefab } from 'cc';
import { Color } from 'cc';
import { Layers } from 'cc';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
import { director } from 'cc';
import { log } from 'cc';
import { view } from 'cc';
import { UITransform } from 'cc';
import { _decorator } from 'cc';
import { BaseLayer } from '../common/BaseDefine';
import { DefaultResID, resDft } from '../res/ResDefault';
import { resLoader } from '../res/ResLoader';
import { DialogBase, IDialogArgs } from './DialogBase';
import { IToastArgs, ToastBase } from './ToastBase';
const { ccclass, property } = _decorator;

// 提示类型
export enum TipsType {
    Dialog,     // 模态提示框
    Toast,      // 非模态提示
}

// 提示结构体
export interface ITipsInfo {
    uiId: number;                               // uiId
    tipsType: TipsType;                         // 提示类型
    uiView: DialogBase | ToastBase | null;      // ui对象
    uiArgs: IDialogArgs | IToastArgs;           // ui初始化参数
    preventNode?: Node | null;                  // ui触摸拦截节点
    zOrder?: number;                            // ui的层级
    isClose?: boolean;                          // ui当前是否关闭
}

// 提示配置
export interface ITipsConf {
    prefab: string;                 // 预制体路径
    tipsType: TipsType;             // 提示类型
    bundleName?: string;            // bundle名，不配则取默认值 'resources'
    preventTouch?: boolean;         // 是否开启触摸拦截，默认关闭
    preventColor?: Color | null;    // 触摸拦截层颜色，不填则默认(0, 0, 0, 150)，最后一位表示透明度。null表示不设颜色
}

@ccclass('TipsManager')
export class TipsManager {
    // 场景uuid
    private _sceneUUID: string = '';
    public get sceneUUID() { return this._sceneUUID; }
    public constructor(sceneUUID: string) {
        this._sceneUUID = sceneUUID;
    }

    // 缓存资源记录
    private _resCache: Set<Asset> = new Set<Asset>();
    /** UI配置 */
    private _uiConf: { [uiId: number]: ITipsConf } = {};
    // 模态提示框栈
    private _dialogStack: ITipsInfo[] = [];
    // 非模态提示堆
    private _toastHeap: Set<ITipsInfo> = new Set<ITipsInfo>();

    /**
     * 初始化所有UI的配置对象
     * @param conf 配置对象
     */
    public initUIConf(conf: { [uiId: number]: ITipsConf }): void {
        this._uiConf = conf;
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
     * 释放资源
     */
    public releaseAssets() {
        this._resCache.forEach(element => {
            element.decRef();
        });
        this._resCache.clear();
    }

    /** 清理界面缓存 */
    public clearCache() {
        this.releaseAssets();
    }

    /**
     * 添加防触摸层
     * @param zOrder 屏蔽层的层级
     */
    private _preventTouch(zOrder: number, color?: Color) {
        let node = new Node();
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

    // 显示提示
    public showTips(uiId: number, uiArgs: IDialogArgs | IToastArgs, ...exArgs: any[]) {
        let uiConf = this._uiConf[uiId];
        if (!uiConf) return;

        let uiInfo: ITipsInfo = {
            uiId: uiId,
            tipsType: uiConf.tipsType,
            uiArgs: uiArgs,
            uiView: null,
        };

        // 设置UI的zOrder
        switch (uiInfo.tipsType) {
            case TipsType.Dialog:
                uiInfo.zOrder = BaseLayer.Dialog + this._dialogStack.length;
                this._dialogStack.push(uiInfo);
                break;
            case TipsType.Toast:
                uiInfo.zOrder = BaseLayer.Toast + this._toastHeap.size;
                this._toastHeap.add(uiInfo);
                break;
        }

        // 先屏蔽点击
        if (uiConf.preventTouch) {
            uiInfo.preventNode = this._preventTouch(uiInfo.zOrder, this._uiConf[uiId].preventColor!);
        }

        // 摧毁触摸拦截层
        function destroyPreventTouch() {
            if (uiInfo.preventNode) {
                uiInfo.preventNode.destroy();
                uiInfo.preventNode = null;
            }
        }

        resLoader.load(uiConf.prefab, (err, prefab: Prefab) => {
            if (err) {
                destroyPreventTouch();
                return;
            }

            // 检查实例化错误
            let uiNode: Node = instantiate(prefab);
            if (null == uiNode) {
                log(`showTips instantiate ${uiId} failed, path: ${uiConf.prefab}`);
                prefab.addRef();
                prefab.decRef();    // 这里引用需要先加后减，防止意外释放外部模块的引用
                destroyPreventTouch();
                return;
            }

            // 检查组件获取错误
            let uiView: DialogBase | ToastBase | null = null;
            switch (uiInfo.tipsType) {
                case TipsType.Dialog:
                    uiView = uiNode.getComponent(DialogBase);
                    break;
                case TipsType.Toast:
                    uiView = uiNode.getComponent(ToastBase);
                    break;
            }
            if (!uiInfo.uiView) {
                log(`showTips getComponent ${uiId} failed, path: ${uiConf.prefab}`);
                prefab.addRef();
                prefab.decRef();
                destroyPreventTouch();
                return;
            }
            uiInfo.uiView = uiView;

            this.cacheAsset(prefab);
            switch (uiInfo.tipsType) {
                case TipsType.Dialog:
                    (uiInfo.uiView as DialogBase).init(...exArgs);
                    break;
                case TipsType.Toast:
                    // todo
                    break;
            }
        }, uiConf.bundleName);
    }

    // 隐藏提示
    public hideTips() {

    }
}