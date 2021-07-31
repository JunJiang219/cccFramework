/**
 * 状态机
 */

import { ComUtil } from "../utils/ComUtil";

// 状态机默认值
const fsm_defaults = {
    wildcard: "*",
    init: {
      name: 'init',
      from: 'none'
    },
}
export type FsmEventCallbacks = { [lifecycleEvent: string]: Function };

export interface IFsmTransition {
    name?: string,
    from?: string | string[],
    to?: string | Function
}

export interface IFsmInitObj {
    init?: string,
    transitions?: IFsmTransition[],
    methods?: FsmEventCallbacks
}

export interface IFsmLifecycleEvents {
    onBefore?: { [transition: string]: string },
    onAfter?:  { [transition: string]: string },
    onEnter?:  { [state: string]: string },
    onLeave?:  { [state: string]: string },
    on?:       { [key: string]: string },
}

export interface IFsmTransitArgs {
    transition?: string,
    from?: string,
    to?: string,
    fsm?: StateMachine,
    event?: string
}

export class StateMachine {
    private _state: string = fsm_defaults.init.from;    // 当前状态
    private _pending: boolean = false;                  // 状态转换中，挂起
    private _states: string[] = [];                     // 全部状态名
    private _transitions: string[] = [];                // 全部转换名
    private _lifecycleEvents: IFsmLifecycleEvents = {}; // 生命周期事件名
    private _eventCallbacks: FsmEventCallbacks = {};    // 生命周期事件回调
    private _map: { [state: string]: { [transition: string]: IFsmTransition } } = {};
    public constructor(param?: IFsmInitObj) {
        if (param) this.initFsm(param);
    }

    // 重置状态机
    public resetFsm() {
        this._state = fsm_defaults.init.from;
        this._pending = false;
        this._states = [];
        this._transitions = [];
        this._lifecycleEvents = {};
        this._eventCallbacks = {};
        this._map = {};
    }

    // 初始化状态机
    public initFsm(param: IFsmInitObj) {
        this.resetFsm();
        this._configureLifecycle();
        let initTransition = this._configureInitTransition(param.init);
        this.configureTransitions(param.transitions);
        this.configureMethods(param.methods);
        if (param.init) this._fire(initTransition.name!, []);
    }
    
    public get state() { return this._state; }              // 当前状态
    public allStates() { return this._states; }             // 全部状态
    public allTransitions() { return this._transitions; }   // 全部转换名
    public isPending() { return this._pending; }            // 是否转换中

    // 获取转换配置
    public transitionFor(state: string, transition: string): IFsmTransition | null {
        let wildcard = fsm_defaults.wildcard;
        return this._map[state][transition] || this._map[wildcard][transition];
    }

    // 获取指定状态所有可执行转换名
    public transitionsFor(state: string): string[] {
        let wildcard = fsm_defaults.wildcard;
        return Object.keys(this._map[state]).concat(Object.keys(this._map[wildcard]));
    }

    // 添加状态
    private _addState(name: string) {
        if (!this._map[name]) {
            this._states.push(name);
            this._addStateLifecycleNames(name);
            this._map[name] = {};
        }
    }

    // 添加生命周期名 - 状态相关
    private _addStateLifecycleNames(name: string) {
        this._lifecycleEvents.onEnter![name] = ComUtil.camelize_prefix('onEnter', name);
        this._lifecycleEvents.onLeave![name] = ComUtil.camelize_prefix('onLeave', name);
        this._lifecycleEvents.on![name]      = ComUtil.camelize_prefix('on',      name);
    }

    // 添加转换
    private _addTransition(name: string) {
        if (this._transitions.indexOf(name) < 0) {
            this._transitions.push(name);
            this._addTransitionLifecycleNames(name);
        }
    }

    // 添加生命周期名 - 转换相关
    private _addTransitionLifecycleNames(name: string) {
        this._lifecycleEvents.onBefore![name] = ComUtil.camelize_prefix('onBefore', name);
        this._lifecycleEvents.onAfter![name]  = ComUtil.camelize_prefix('onAfter',  name);
        this._lifecycleEvents.on![name]       = ComUtil.camelize_prefix('on',       name);
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

    // 配置通用生命周期名
    private _configureLifecycle() {
        this._lifecycleEvents = {
          onBefore: { transition: 'onBeforeTransition' },
          onAfter:  { transition: 'onAfterTransition'  },
          onEnter:  { state:      'onEnterState'       },
          onLeave:  { state:      'onLeaveState'       },
          on:       { transition: 'onTransition'       }
        };
    }

    // 配置初始化转换信息
    private _configureInitTransition(init?: string | IFsmTransition): IFsmTransition {
        let transition: IFsmTransition = {};
        if (typeof init === "string") {
            transition = this.mapTransition({ name: 'init', from: fsm_defaults.init.from, to: init })
        } else if (typeof init === "object") {
            transition = this.mapTransition(init);
        } else {
            this._addState(fsm_defaults.init.from);
            transition = fsm_defaults.init;
        }

        return transition;
    }

    // 配置多条转换信息(新的增加，重复的替换)
    public configureTransitions(transitions?: IFsmTransition[]) {
        if (!transitions) return;
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

    // 配置事件回调监听(新的增加，重复的替换)
    public configureMethods(methods?: FsmEventCallbacks) {
        if (!methods) return;
        for (let event in methods) {
            this._eventCallbacks[event] = methods[event];
        }
    }

    public seek(transition: string, args: any[]) {
        let wildcard = fsm_defaults.wildcard,
            entry    = this.transitionFor(this.state, transition),
            to       = entry && entry.to;
        if (typeof to === 'function')
            return to(...args);
        else if (to === wildcard)
          return this.state
        else
          return to
    }

    // 触发转换
    private _fire(transition: string, args: any[]) {
        return this._transit(transition, this.state, this.seek(transition, args), args);
    }

    /**
     * 执行转换
     * @param transition 
     * @param from 
     * @param to 
     * @param args 
     */
    private _transit(transition: string, from: string, to: string, args: any[]) {
        let lifecycle = this._lifecycleEvents,
            changed   = (from !== to);

        if (!to) return this.onInvalidTransition(transition, from, to);

        if (this.isPending()) return this.onPendingTransition(transition, from, to);

        this._addState(to);  // might need to add this state if it's unknown (e.g. conditional transition or goto)

        this._beginTransit();

        args.unshift({             // this context will be passed to each lifecycle event observer
            transition: transition,
            from:       from,
            to:         to,
            fsm:        this,
        });

        return this._observeEvents([
                    lifecycle.onBefore!.transition,
                    lifecycle.onBefore![transition],
            changed ? lifecycle.onLeave!.state : null,
            changed ? lifecycle.onLeave![from] : null,
                    lifecycle.on!.transition,
            changed ? 'doTransit' : null,
            changed ? lifecycle.onEnter!.state : null,
            changed ? lifecycle.onEnter![to]   : null,
            changed ? lifecycle.on![to]        : null,
                    lifecycle.onAfter!.transition,
                    lifecycle.onAfter![transition],
                    lifecycle.on![transition]
        ], args);
    }

    // 注册生命周期事件监听回调
    public observe(lifecycleEvent: string, callback: Function): void;
    public observe(methods: FsmEventCallbacks): void;
    public observe(...args: any[]) {
        if (args.length === 2) {
            this._eventCallbacks[args[0]] = args[1];
        }
        else {
            for (let event in args[0]) {
                this._eventCallbacks[event] = args[0][event];
            }
        }
    }

    // 观察事件
    private _observeEvents(events: any[], args: any[], previousEvent?: string, previousResult?: boolean): any {
        if (events.length === 0) {
          return this._endTransit(previousResult === undefined ? true : previousResult);
        }

        let event = events.shift(), result: any = null;
        args[0].event = event;
        if ('doTransit' == event) {
            result = this._doTransit(args[0]);
        } else {
            result = this._eventCallbacks[event](args);
        }
        if (result && typeof result.then === 'function') {
            return result.then(this._observeEvents.bind(this, events, args, event))
                        .catch(this._failTransit.bind(this))
        } else if (result === false) {
            return this._endTransit(false);
        } else {
            return this._observeEvents(events, args, event, result);
        }
    }

    private _beginTransit()                         { this._pending = true;                 }
    private _endTransit(result: any)                { this._pending = false; return result; }
    private _failTransit(result: any)               { this._pending = false; throw result;  }
    private _doTransit(lifecycle: IFsmTransitArgs)  { this._state = lifecycle.to!;          }

    // 无效转换
    public onInvalidTransition(transition: string, from: string, to: string) {
        console.error("transition is invalid in current state", transition, from, to, this._state);
    }
    
    // 转换进行中
    public onPendingTransition(transition: string, from: string, to: string) {
        console.warn("transition is invalid while previous transition is still in progress", transition, from, to, this._state);
    }

    /**
     * 执行转换
     * @param transition 转换名
     * @param args 可选参数
     * @returns 
     */
    public execTransit(transition: string, ...args: any[]) {
        return this._fire(transition, args || []);
    }
}