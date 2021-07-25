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

// 状态转换的生命周期
export const fsm_lifecycle = {
    onBeforeTransition: "onBeforeTransition",
    onLeaveState: "onLeaveState",
    onTransition: "onTransition",
    onEnterState: "onEnterState",
    onAfterTransition: "onAfterTransition"
}

export interface IFsmTransition {
    name?: string,
    from?: string | string[],
    to?: string | Function
}

export interface IFsmInitObj {
    init?: string,
    transitions?: IFsmTransition[],
    methods?: { [lifecycle: string]: Function }
}

export interface IFsmLifecycleEvent {
    onBefore?: { [key: string]: string },
    onAfter?:  { [key: string]: string },
    onEnter?:  { [key: string]: string },
    onLeave?:  { [key: string]: string },
    on?:       { [key: string]: string },
}

export interface IFsmTransitArgs {
    transition?: string,
    from?: string,
    to?: string,
    fsm?: StateMachine,
    event?: string
}

function camelize(label: string) {

    if (label.length === 0)
      return label;
  
    var n, result, word, words = label.split(/[_-]/);
  
    // single word with first character already lowercase, return untouched
    if ((words.length === 1) && (words[0][0].toLowerCase() === words[0][0]))
      return label;
  
    result = words[0].toLowerCase();
    for(n = 1 ; n < words.length ; n++) {
      result = result + words[n].charAt(0).toUpperCase() + words[n].substring(1).toLowerCase();
    }
  
    return result;
}

function camelize_prepended(prepend: string, label: string) {
    label = camelize(label);
    return prepend + label[0].toUpperCase() + label.substring(1);
  }

export class StateMachine {
    private _state: string = "";            // 当前状态
    private _pending: boolean = false;      // 状态转换中，挂起
    private _states: string[] = [];         // 全部状态名
    private _transitions: string[] = [];    // 全部转换名
    private _lifecycle: IFsmLifecycleEvent = {};
    private observers: any[] = [];
    private _map: { [state: string]: { [transition: string]: IFsmTransition } } = {};
    public constructor(param: IFsmInitObj) {
        this.observers = [this];
        this._configureLifecycle();
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
            this._addStateLifecycleNames(name);
            this._map[name] = {};
        }
    }

    // 添加生命周期名 - 状态相关
    private _addStateLifecycleNames(name: string) {
        this._lifecycle.onEnter![name] = camelize_prepended('onEnter', name);
        this._lifecycle.onLeave![name] = camelize_prepended('onLeave', name);
        this._lifecycle.on![name]      = camelize_prepended('on',      name);
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
        this._lifecycle.onBefore![name] = camelize_prepended('onBefore', name);
        this._lifecycle.onAfter![name]  = camelize_prepended('onAfter',  name);
        this._lifecycle.on![name]       = camelize_prepended('on',       name);
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

    // 配置默认生命周期名
    private _configureLifecycle() {
        this._lifecycle = {
          onBefore: { transition: 'onBeforeTransition' },
          onAfter:  { transition: 'onAfterTransition'  },
          onEnter:  { state:      'onEnterState'       },
          onLeave:  { state:      'onLeaveState'       },
          on:       { transition: 'onTransition'       }
        };
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

    private _observe(args) {
        if (args.length === 2) {
          var observer = {};
          observer[args[0]] = args[1];
          this.observers.push(observer);
        }
        else {
          this.observers.push(args[0]);
        }
    }

    private _observersForEvent(event: string) { // TODO: this could be cached
        var n = 0, max = this.observers.length, observer, result = [];
        for( ; n < max ; n++) {
          observer = this.observers[n];
          if (observer[event])
            result.push(observer);
        }
        return [ event, result, true ]
    }

    // 观察事件
    private _observeEvents(events: string[], args: IFsmTransitArgs[], previousEvent?: string, previousResult?: boolean) {
        if (events.length === 0) {
          return this._endTransit(previousResult === undefined ? true : previousResult);
        }
    
        var event     = events[0][0],
            observers = events[0][1],
            // pluggable = events[0][2];
    
        args[0].event = event;
        // if (event && pluggable && event !== previousEvent)
        //   plugin.hook(this, 'lifecycle', args);
    
        if (observers.length === 0) {
          events.shift();
          return this._observeEvents(events, args, event, previousResult);
        }
        else {
          var observer = observers.shift(),
              result = observer[event].apply(observer, args);
          if (result && typeof result.then === 'function') {
            return result.then(this._observeEvents.bind(this, events, args, event))
                         .catch(this._failTransit.bind(this))
          }
          else if (result === false) {
            return this._endTransit(false);
          }
          else {
            return this._observeEvents(events, args, event, result);
          }
        }
    }

    private _beginTransit()          { this._pending = true;                 }
    private _endTransit(result: boolean)    { this._pending = false; return result; }
    private _failTransit(result: any)    { this._pending = false; throw result;  }
    private _doTransit(lifecycle) { this._state = lifecycle.to; }

    // 无效转换
    private _onInvalidTransition(transition: string, from: string, to: string) {
        console.error("transition is invalid in current state", transition, from, to, this._state);
    }
    
    // 转换进行中
    private _onPendingTransition(transition: string, from: string, to: string) {
        console.warn("transition is invalid while previous transition is still in progress", transition, from, to, this._state);
    }
}