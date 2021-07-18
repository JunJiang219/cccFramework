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
    public static array_unique<T>(arr: T[]): T[] | null {
        if (!(arr instanceof Array)) return null;

        var obj = new Set<T>(), newArr = [], val = null;
        for (var i = 0; i < arr.length; ++i) {
            val = arr[i];
            if (!obj.has(val)) {
                obj.add(val);
                newArr.push(val);
            }
        }

        return newArr;
    }

    // 数组交集
    public static array_intersection<T>(a: T[], b: T[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return a.filter(function (v) { return b.indexOf(v) !== -1 })
    }

    // 数组差集
    public static array_difference<T>(a: T[], b: T[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return a.filter(function (v) {
            return (a.indexOf(v) !== -1 && b.indexOf(v) === -1);
        });
    }

    // 数组并集
    public static array_union<T>(a: T[], b: T[]) {
        if (!(a instanceof Array)) return;
        if (!(b instanceof Array)) return;
        return this.array_unique(a.concat(b));
    }
}
