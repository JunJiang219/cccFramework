/**
 * 时间工具类
 */
const min2ms = 60000;       // 1min 等于多少 ms
const hour2ms = 3600000;    // 1h 等于多少 ms

export class TimeUtil {
    /**
     * 获取时间戳(ms)
     * @param dt 指定时间，不填则为本地
     * @returns 转化后的
     */
    public static getTimestamp(dt?: Date): number {
        if (!dt) dt = new Date();
        return dt.getTime();
    }

    /**
     * 通过传入一个时间戳转成另外一个时区的时间
     * @param timestamp 时间戳，不填则取本地当前时间
     * @param zone 转化后时区，默认是大西洋时区，西四区
     */
     public static getTimeByZone(timestamp?: number, zone: number = -4): Date {
        let dt: Date = null!;
        if (timestamp) {
            dt = new Date(timestamp);
        } else {
            dt = new Date();
            timestamp = dt.getTime();
        }
        //本地时间与GMT时间的时间偏移差
        let offset = dt.getTimezoneOffset() * min2ms;
        //得到一个现在时间戳下相对于格林威治时间 
        let utcTime = timestamp + offset;
        return new Date(utcTime + hour2ms * zone);
    }

    /**
     * 时间格式化字符串 eg:2017/6/6 19:09:00
     * @param timestamp 时间戳，不填则取本地当前时间
     * @param isNewline 是否换行
     */
     public static timeFormat(timestamp?: number | null, isNewline?: boolean): string {
        let getNumStr = (num: number): string => {
            let numStr: string = num >= 10 ? num.toString() : "0" + num;
            return numStr;
        }

        let dt: Date = timestamp ? new Date(timestamp) : new Date();
        let curYear = dt.getFullYear();
        let curMonth = dt.getMonth() + 1;
        let curDay = dt.getDate();
        let curHour = dt.getHours();
        let curMinutes = dt.getMinutes();
        let curSecond = dt.getSeconds();

        let monthStr = getNumStr(curMonth);
        let dayStr = getNumStr(curDay);
        let hourStr = getNumStr(curHour);
        let minStr = getNumStr(curMinutes);
        let secondStr = getNumStr(curSecond);
        let timeSymbol = isNewline ? "\n" : "  ";

        return curYear + "/" + monthStr + "/" + dayStr + timeSymbol + hourStr + ":" + minStr + ":" + secondStr;
    }
}