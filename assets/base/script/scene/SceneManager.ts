import { assetManager, Director, resources, Scene } from "cc";
import { director } from "cc";
import { EDITOR } from "cc/env";
import { UIManager } from "../ui/UIManager";

export interface ISceneData {
    uiMgr: UIManager
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
        });
    }

    // 场景数据
    private _data: Map<string, ISceneData> = new Map<string, ISceneData>();     // <场景uuid, 场景数据>
    // 上一场景
    private _lastScene: Scene | null = null;

    // 场景切换处理
    private _onSceneChange(scene: Scene) {
        if (EDITOR || this._lastScene == scene) return;
        // 释放上一场景动态加载资源
        let uiMgr = this.getUIManager(this._lastScene?.uuid);
        if (uiMgr) {
            uiMgr.closeAll();
            uiMgr.clearCache();
        }

        this._lastScene = scene;
    }

    public getSceneData(sceneId?: string) {
        if (!sceneId) sceneId = director.getScene()?.uuid;
        if (!sceneId) return undefined;     // 没有获取到场景uuid
        if (!this._data.has(sceneId!)) {
            let data: ISceneData = {
                uiMgr: new UIManager(sceneId)
            };
            this._data.set(sceneId!, data);
        }

        return this._data.get(sceneId!);
    }

    public getUIManager(sceneId?: string) {
        return this.getSceneData(sceneId)?.uiMgr;
    }
}

export let sceneMgr = SceneManager.getInstance();