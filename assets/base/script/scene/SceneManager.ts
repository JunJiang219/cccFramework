import { assetManager, Director, Scene } from "cc";
import { director } from "cc";
import { EDITOR } from "cc/env";
import { BaseMsg } from "../common/BaseDefine";
import { evtMgr } from "../common/EventManager";
import { TipsManager } from "../ui/TipsManager";
import { UIManager } from "../ui/UIManager";

// scene信息结构体
export interface ISceneInfo {
    uiMgr: UIManager,
    tipsMgr: TipsManager,
}

export class SceneManager {
    private static _instance: SceneManager | null = null;
    public static getInstance(): SceneManager {
        if (!SceneManager._instance) SceneManager._instance = new SceneManager();
        return SceneManager._instance;
    }

    private constructor() {
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, (scene) => {
            this._onSceneChange(scene);
            evtMgr.raiseEvent(BaseMsg.MSG_BEFORE_SCENE_LAUNCH);
        });
    }

    // 场景数据
    private _sceneInfo: Map<string, ISceneInfo> = new Map<string, ISceneInfo>();     // <场景uuid, 场景数据>
    // 上一场景
    private _lastScene: Scene | null = null;

    // 场景切换处理
    private _onSceneChange(scene: Scene) {
        if (EDITOR || this._lastScene == scene) return;
        // 释放上一场景动态加载资源
        let sceneInfo = this.getSceneInfo(this._lastScene?.uuid);
        if (sceneInfo) {
            let uiMgr = sceneInfo.uiMgr;
            uiMgr.closeAll();
            uiMgr.clearCache();
            let skipBundle = ['main'];  // 这些bundle不能使用 releaseUnusedAssets()
            assetManager.bundles.forEach((bundle, name) => {
                if (skipBundle.indexOf(name) == -1) {
                    bundle.releaseUnusedAssets();   // 释放未引用资源
                }
            });
        }

        this._lastScene = scene;
    }

    // 获取场景信息
    public getSceneInfo(sceneUUID?: string) {
        if (!sceneUUID) sceneUUID = director.getScene()?.uuid;
        if (!sceneUUID) return undefined;
        if (!this._sceneInfo.has(sceneUUID!)) {
            let info: ISceneInfo = {
                uiMgr: new UIManager(sceneUUID),
                tipsMgr: new TipsManager(sceneUUID),
            };
            this._sceneInfo.set(sceneUUID!, info);
        }

        return this._sceneInfo.get(sceneUUID!);
    }

    // 获取场景管理对象 ui
    public getUIManager(sceneUUID?: string) {
        return this.getSceneInfo(sceneUUID)?.uiMgr;
    }

    // 获取场景管理对象 tips
    public getTipsManager(sceneUUID?: string) {
        return this.getSceneInfo(sceneUUID)?.tipsMgr;
    }
}

export let sceneMgr = SceneManager.getInstance();