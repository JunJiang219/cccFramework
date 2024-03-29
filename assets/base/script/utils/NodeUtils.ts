/**
 * 节点工具类
 */
import { Node, UITransform, v2, Vec2 } from "cc";
import { Layers } from "cc";
import { Sprite } from "cc";
import { director } from "cc";
import { log } from "cc";
import { SpriteFrame } from "cc";
import { Color } from "cc";
import { view } from "cc";
import { sys } from "cc";
import { DefaultResID, resDft } from "../res/ResDefault";

interface IRect {
    left?: number,
    top?: number,
    width?: number,
    height?: number
}

export class NodeUtils {
    /**
     * 获取htmlElement位置信息
     * @param element 
     */
    public static getHTMLElementPosition(element: any): IRect {
        let docElem = document.documentElement;
        let leftOffset = window.pageXOffset - docElem.clientLeft;
        let topOffset = window.pageYOffset - docElem.clientTop;
        let rect: IRect = {};
        if (typeof element.getBoundingClientRect === 'function') {
            let box = element.getBoundingClientRect();
            rect.left = box.left + leftOffset;
            rect.top = box.top + topOffset;
            rect.width = box.width;
            rect.height = box.height;
        } else {
            if (element instanceof HTMLCanvasElement) {
                rect.left = leftOffset;
                rect.top = topOffset;
                rect.width = element.width;
                rect.height = element.height;
            } else {
                rect.left = leftOffset;
                rect.top = topOffset;
                rect.width = parseInt(element.style.width);
                rect.height = parseInt(element.style.height);
            }
        }

        return rect;
    }

    /**
     * 转换世界坐标为html坐标
     * @param x 世界坐标系x
     * @param y 世界坐标系y
     */
    public static convertToHtmlSpaceAR(x: number, y: number) {
        let rect: IRect = {};
        if (sys.isBrowser) {
            let canvas = document.getElementById("GameCanvas");
            rect = NodeUtils.getHTMLElementPosition(canvas);
        } else {
            rect = view.getFrameSize();
            rect.left = 0;
            rect.top = 0;
        }

        let vp = view.getViewportRect();
        let sx = view.getScaleX();
        let sy = view.getScaleY();
        let ratio = view.getDevicePixelRatio();
        let htmlX = (x * sx + vp.x) / ratio + rect.left!;
        let htmlY = rect.top! + rect.height! - (y * sy + vp.y) / ratio;
        let pt = v2(htmlX, htmlY);

        return { pt: pt, rect: rect };
    }

    /**
     * 模拟点击
     * @param x 世界坐标系x
     * @param y 世界坐标系y
     * @param duration 按下至抬起的间隔时间（ms）
     */
    public static simulation_click(x: number, y: number, duration?: number) {
        //@ts-ignore
        let inputManager = window._cc ? window._cc.inputManager : cc.internal.inputManager;
        let result = NodeUtils.convertToHtmlSpaceAR(x, y);
        let pt = result.pt;
        let rect = result.rect;

        log(`模拟点击坐标：${pt.x}, ${pt.y}`);
        let touch = inputManager.getTouchByXY(pt.x, pt.y, rect);
        inputManager.handleTouchesBegin([touch]);
        duration = duration || 200;
        setTimeout(() => {
            inputManager.handleTouchesEnd([touch]);
        }, duration);
    }

    /**
     * 模拟触摸移动
     * @param startPos 开始世界坐标
     * @param endPos 结束世界坐标
     * @param duration 历时（ms）
     */
    public static simulation_touchMove(startPos: Vec2, endPos: Vec2, duration?: number) {
        //@ts-ignore
        let inputManager = window._cc ? window._cc.inputManager : internal.inputManager;
        let resultStart = NodeUtils.convertToHtmlSpaceAR(startPos.x, startPos.y);
        let resultEnd = NodeUtils.convertToHtmlSpaceAR(endPos.x, endPos.y);
        let startPt = resultStart.pt;
        let startRect = resultStart.rect;
        let endPt = resultEnd.pt;
        let endRect = resultEnd.rect;

        log(`模拟按下坐标：${startPt.x}, ${startPt.y}`);
        let touchStart = inputManager.getTouchByXY(startPt.x, startPt.y, startRect);
        let touchEnd = inputManager.getTouchByXY(endPt.x, endPt.y, endRect);
        inputManager.handleTouchesBegin([touchStart]);
        duration = duration || 400;
        setTimeout(() => {
            log(`模拟抬起坐标：${startPt.x}, ${startPt.y}`);
            inputManager.handleTouchesEnd([touchEnd]);
        }, duration);
    }

    /**
     * 模拟点击节点
     * @param node 节点
     * @param duration 按下至抬起的间隔时间（ms）
     */
    public static simulation_clickNode(node: Node, duration?: number) {
        log('自动执行，模拟点击');
        log('自动节点 :', JSON.stringify(node.position));
        let wp = node.parent?.getComponent(UITransform)?.convertToWorldSpaceAR(node.position);
        log('世界节点 :', JSON.stringify(wp));
        NodeUtils.simulation_click(wp!.x, wp!.y, duration);
    }

    /**
     * 添加防触摸层
     * @param parent 父节点
     * @param zOrder 屏蔽层的层级，默认为0
     * @param color 屏蔽层颜色
     */
    public static preventTouch(parent: Node, zOrder?: number, color?: Color) {
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

        parent.addChild(node);
        uiCom.priority = zOrder || 0;
        // node.setSiblingIndex(zOrder - 0.01);
        return node;
    }
}