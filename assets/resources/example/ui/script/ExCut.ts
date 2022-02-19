
import { log } from 'cc';
import { _decorator, Component, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ExCut')
export class ExCut extends Component {

    public onBtnChangeScene() {
        director.loadScene('ex_ui');
    }

    onDestroy() {
        log('ExCut.onDestroy()');
    }
}