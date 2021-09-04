import { director } from "cc";
import { ResLoader } from "../res/ResLoader";
import { UIManager } from "../ui/UIManager";

export interface ISceneData {
    uiMgr: UIManager
}

export class SceneManager {
    private static _instance: SceneManager | null = null;
    private _data: Map<string, ISceneData> = new Map<string, ISceneData>();
    private constructor() {}
    public static getInstance(): SceneManager {
        if (!SceneManager._instance) SceneManager._instance = new SceneManager();
        return SceneManager._instance;
    }

    public getSceneData(sceneName?: string) {
        if (!sceneName) sceneName = director.getScene()?.name;
        if (!this._data.has(sceneName!)) {
            let data: ISceneData = {
                uiMgr: new UIManager(sceneName)
            };
            this._data.set(sceneName!, data);
        }

        return this._data.get(sceneName!);
    }

    public getUIManager(sceneName?: string) {
        return this.getSceneData(sceneName)?.uiMgr;
    }
}

export let sceneMgr = SceneManager.getInstance();