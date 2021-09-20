
import { Asset, Node } from 'cc';
import { Color } from 'cc';
import { Layers } from 'cc';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
import { director } from 'cc';
import { view } from 'cc';
import { UITransform } from 'cc';
import { _decorator } from 'cc';
import { DefaultResID, resDft } from '../res/ResDefault';
import { DialogBase } from './DialogBase';
import { ToastBase } from './ToastBase';
const { ccclass, property } = _decorator;

// 提示结构体
export interface ITipsInfo {
    uiTips: DialogBase | ToastBase | null;      // 提示对象
    preventNode?: Node | null;                  // ui触摸拦截节点
    zOrder?: number;                            // ui的层级
}

// 提示配置
export interface ITipsConf {
    dialogPrefab: string;                       // 模态提示框预制路径
    toastPrefab: string;                        // 非模态提示预制路径
    bundleName?: string;                        // bundle名，不配则取默认值 'resources'
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
    private _uiConf: ITipsConf | null = null;
    // 模态提示框栈
    private _dialogStack: ITipsInfo[] = [];
    // 非模态提示堆
    private _toastHeap: Set<ITipsInfo> = new Set<ITipsInfo>();

    /**
     * 初始化所有UI的配置对象
     * @param conf 配置对象
     */
    public initUIConf(conf: ITipsConf): void {
        this._uiConf = conf;
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
}