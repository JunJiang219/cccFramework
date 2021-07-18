/**
 * 通用工具类
 */

export class ComUtil {

    // 检测有效url
    public static checkURL(url: string) {
        if (-1 != url.indexOf('http://')) return true;
        if (-1 != url.indexOf('https://')) return true;
        return false;
    }

    /**
     * 获取链接中的参数
     * @param url 链接，不填则使用浏览器访问地址
     * @param key 参数key，不填则返回全部参数 key-value
     * @returns 指定参数值 | 全部参数  key-value
     */
    public static getUrlParam(url?: string | null, key?: string) {
        //先去除全部空格
        if (!url) url = window.location.href;
        url = url.replace(/\s*/g, "");
        let params: {[key: string]: string} = {};
        let idx = url.indexOf("?");
        if (idx != -1) {
            let sub_str = url.substr(idx + 1);
            let strArr = sub_str.split("&");
            for (var i = 0; i < strArr.length; i++) {
                params[strArr[i].split("=")[0]] = unescape(strArr[i].split("=")[1]);
            }
        }
        if (key) {
            return params[key];
        }
        else {
            return params;
        }
    }

    // 去除所有空格
    public static removeAllSpace(str: string): string {
        return str.replace(/\s+/g, "");
    }

    // 深度拷贝 dstObj 需要是{} 或者 [],如果是null ,那么是返回值。
    public static deepClone(srcObj: any, dstObj: any) {
        if (!srcObj) {
            return srcObj;
        }
        var obj = dstObj || ((srcObj.constructor === Array) ? [] : {});
        for (var i in srcObj) {
            var prop = srcObj[i];        // 避免相互引用对象导致死循环，如 srcObj.a = srcObj 的情况
            if (!prop && prop === obj) {
                continue;
            }
            //这里 prop 为 null 判定也是为true
            if (typeof prop === 'object') {
                if (prop) {
                    obj[i] = (prop.constructor === Array) ? [] : {};
                } else {
                    obj[i] = prop;
                }
                this.deepClone(prop, obj[i]);
            } else {
                obj[i] = prop;
            }
        }
        return obj;
    }

    public static randomString(len: number) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    }

    // 获取区间随机数 [start, end)
    public static getFloatRandom(start: number, end: number): number {
        return start + Math.random() * (end - start);
    }

    // 获取区间随机数 [start, end)
    public static getIntRandom(start: number, end: number): number {
        return start + Math.round(Math.random() * (end - start));
    }

    // 数组去重
    public static array_unique(arr: any[]): any[] | null {
        if (!(arr instanceof Array)) return null;

        var obj: any = {}, newArr = [], val;
        for (var i = 0; i < arr.length; ++i) {
            val = arr[i];
            if (!obj[val]) {
                obj[val] = true;
                newArr.push(val);
            }
        }

        return newArr;
    }

    // 数组交集
    public static array_intersection(a: any[], b: any[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return a.filter(function (v) { return b.indexOf(v) !== -1 })
    }

    // 数组差集
    public static array_difference(a: any[], b: any[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return a.filter(function (v) {
            return (a.indexOf(v) !== -1 && b.indexOf(v) === -1);
        });
    }

    // 数组并集
    public static array_union(a: any[], b: any[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return this.array_unique(a.concat(b));
    }

    /**
     *  服务器传过来的金币，转换为千分号
     *  @param v 要转换的数字，默认是分制
     *  @param n 保留几位小数点，默认为2
     *  @param c 除数
     */
    public static formatNum(v: number, n: number = 2, c: number = 100): string {
        let symbol: string = v < 0 ? "-" : "";
        v = Math.abs(v);
        n = n >= 0 && n <= 20 ? n : 2;
        v = v / c;
        let s: string = v.toFixed(n);
        let arr_s = s.split(".");
        let l = arr_s[0];
        let r = arr_s[1];
        let arr_tmp: string[] = [];
        let cnt = 0;
        for (let len = l.length, i = len - 1; i >= 0; i--) {
            arr_tmp.push(l[i]);
            ++cnt;
            if (0 == cnt % 3 && cnt < len) arr_tmp.push(",");
        }

        let retStr = symbol + arr_tmp.reverse().join("");
        if (r) retStr += ("." + r);
        return retStr;
    }

    // 数字位数不够，高位用0填充
    public static formatNum0(v: number, saveNum: number): string {
        let str = "0000000" + v;
        let retStr = str.substr(str.length - saveNum);
        return retStr;
    }

    /**
     *  服务器传过来的金币，转换为千分号
     *  @param v 要转换的数字，默认是分制
     *  @param n 保留几位小数点，默认为2
     *  @param c 除数
     */
    public static formatNum2KMB(v: number, n: number = 2, c: number = 100): string {
        let kmb: string = "";
        let numKMB: number = v / c;
        let absV: number = Math.abs(numKMB);
        if (absV < 1e3) {
            // do nothing
            return ComUtil.formatNum(numKMB, n, 1);
        } else if (absV < 1e6) {
            numKMB /= 1e3;
            kmb = "K";
        } else if (absV < 1e9) {
            numKMB /= 1e6;
            kmb = "M";
        } else {
            numKMB /= 1e9;
            kmb = "B";
        }

        let retStr = ComUtil.formatNum(numKMB, n, 1) + kmb;
        return retStr;
    }
}
