/**
 * 状态基类
 */

export class StateBase {
    protected _owner: any = null;           // 状态拥有者
    protected _name: string | null = null;  // 状态名
    public constructor(owner: any, stateName?: string) {
        this._owner = owner;
        if (stateName) this._name = stateName;
    }

    // 进入该状态
    public onEnter() { }
    // 离开该状态
    public onLeave() { }
    // 当前是否可以离开该状态
    public canLeave(): boolean {
        return true;
    }
    // 当前是否可以进入该状态
    public canEnter(): boolean {
        return true;
    }
    // 键盘输入监听 - 按下按键
    public onKeyDown(evt: any) { }
    // 键盘输入监听 - 抬起按键
    public onKeyUp(evt: any) { }
    // 每帧更新
    public onUpdate(dt: any) { }
}