/**
 * 基础定义
 */

// 基础层级定义
export enum BaseLayer {
    UI = 0,             // 普通ui界面(0-199)
    Transition = 200,   // 过渡场景ui(200-299)
    Loading = 300,      // 加载、等待(300-399)
    Dialog = 400,       // 模态提示框(400-499)
    Toast = 500,        // 非模态提示(500-599)
}

// 基础事件定义
export enum BaseEvent {
    EVENT_BEFORE_SCENE_LAUNCH = 'EVENT_BEFORE_SCENE_LAUNCH',
}
