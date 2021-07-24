/**
 * 状态机
 */

// 状态机默认值
const fsm_defaults = {
    wildcard: "*",
    init: {
        name: 'init',
        from: 'none'
    }
}

export interface IFsmTransition {
    name?: string,
    from?: string | string[],
    to?: string | Function
}

export interface IFsmInitObj {
    init?: string,
    transitions?: IFsmTransition[],
}

interface IFsmLifecycle {
    onBeforeTransition?: { [transitName: string]: string },
    onLeaveState?: { [stateName: string]: string },
    onTransition?: { [transitName: string]: string },
    onEnterState?: { [stateName: string]: string },
    onAfterTransition?: { [transitName: string]: string },
}

export class StateMachine {
    private _state: string = "";            // 当前状态
    private _pending: boolean = false;      // 状态转换中，挂起
    private _states: string[] = [];         // 全部状态名
    private _transitions: string[] = [];    // 全部转换名
    private _lifecycle = null;
    private _map: { [stateName: string]: { [transitName: string]: IFsmTransition } } = {};
    public constructor(param: IFsmInitObj) {
        this._configureInitTransition(param.init!);
        this.configureTransitions(param.transitions!);
    }
    
    public get state() { return this._state; }
    public allStates() { return this._states; }
    public isPending() { return this._pending; }

    // 添加状态
    private _addState(name: string) {
        if (!this._map[name]) {
            this._states.push(name);
            this._map[name] = {};
        }
    }

    // 添加转换
    private _addTransition(name: string) {
        if (this._transitions.indexOf(name) < 0) {
            this._transitions.push(name);
        }
    }

    // 配置单条转换信息
    public mapTransition(transition: IFsmTransition) {
        var name = transition.name as string,
            from = transition.from as string,
            to   = transition.to;
        this._addState(from);
        if (typeof to !== 'function') this._addState(to!);
        this._addTransition(name);
        this._map[from][name] = transition;
        return transition;
    }

    // 配置初始化转换信息
    private _configureInitTransition(init: string | IFsmTransition): IFsmTransition {
        if (typeof init === "string") {

        } else if (typeof init === "object") {

        } else {
            this._addState(fsm_defaults.init.from);
            return fsm_defaults.init;
        }
    }

    // 配置多条转换信息
    public configureTransitions(transitions: IFsmTransition[]) {
        var i, n, transition, from, to, wildcard = fsm_defaults.wildcard;
        for(n = 0 ; n < transitions.length ; n++) {
          transition = transitions[n];
          from  = Array.isArray(transition.from) ? transition.from : [transition.from || wildcard]
          to    = transition.to || wildcard;
          for(i = 0 ; i < from.length ; i++) {
            this.mapTransition({ name: transition.name, from: from[i], to: to });
          }
        }
    }

    private _onInvalidTransition(transitName: string, from: string, to: string) {
        console.error("transition is invalid in current state", transitName, from, to, this._state);
    }
    
    private _onPendingTransition(transitName: string, from: string, to: string) {
        console.warn("transition is invalid while previous transition is still in progress", transitName, from, to, this._state);
    }
}