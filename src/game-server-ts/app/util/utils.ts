import dateFormat = require('dateformat');

/**
 * 工具
 * @author Andrew_Huang
 * @export
 * @class Utils
 */
export class Utils
{
    public static isPrintFlag: boolean = false;
    public static aCity: any = {
        11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江", 31: "上海",
        32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西", 37: "山东", 41: "河南", 42: "湖北", 43: "湖南",
        44: "广东", 45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏", 61: "陕西",
        62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门"
    };

    public static instance: Utils;
    public static getInstance(): Utils
    {
        if (!this.instance)
        {
            this.instance = new Utils();
        }
        return this.instance;
    }

    public constructor()
    {

    }

    /**
     * ID身份确认
     * @author Andrew_Huang
     * @param {string} num
     * @returns {boolean}
     * @memberof Utils
     */
    public isIDNumber(num: string): boolean
    {
        let iSum = 0;
        // 身份证长度或格式错误
        if (!/^\d{17}(\d|x)$/i.test(num))
        {
            return false;
        }
        let sId = num.replace(/x$/i, "a");
        // 身份证地区非法
        if (Utils.aCity[parseInt(sId.substr(0, 2))] == null)
        {
            return false;
        }
        // 身份证上的出生日期非法
        let sBirthday = sId.substr(6, 4) + "-" + Number(sId.substr(10, 2)) + "-" + Number(sId.substr(12, 2));
        let d = new Date(sBirthday.replace(/-/g, "/"));
        if (sBirthday != (d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()))
        {
            return false;
        }
        for (var i = 17; i >= 0; i--)
        {
            iSum += (Math.pow(2, i) % 11) * parseInt(sId.charAt(17 - i), 11);
        }
        //"身份证号非法"
        if (iSum % 11 != 1)
        {
            return false;
        }
        return true;
    }

    /**
     * 根据日期获取年龄
     * @author Andrew_Huang
     * @param {number} date
     * @returns {number}
     * @memberof Utils
     */
    public getAge(date: string): number
    {
        let curDate = new Date();
        let curYear = curDate.getFullYear();
        let curMonth = curDate.getMonth();
        let curDay = curDate.getDate();
        let year = parseInt(date.substr(0, 4), 10);
        let month = parseInt(date.substr(4, 2), 10);
        let day = parseInt(date.substr(6, 2), 10);
        let monthFloor = (curMonth < month || (curMonth === month && curDay < day)) ? 1 : 0;
        let age = curYear - year - monthFloor;
        return age;
    }

    /**
     * 返回日期（格式：yyyy-mm-dd）
     * @author Andrew_Huang
     * @param {*} date
     * @returns {string}
     * @memberof Utils
     */
    public toDateFormat(date: any): string
    {
        return dateFormat(date, 'yyyy-mm-dd');
    }

    /**
     * 获取当前的时间戳
     * @author Andrew_Huang
     * @param {number} h 时
     * @param {number} m 分
     * @param {number} s 秒
     * @returns {number}
     * @memberof Utils
     */
    public getDateOfHour(h: number, m: number, s: number): number
    {
        let date = new Date(Date.now());
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();
        let d = new Date(year, month, day, h, m || 0, s || 0, 0);
        return d.getTime();
    }

    /**
     * 返回日期（格式：yyyy-mm-dd HH:MM:ss）
     * @author Andrew_Huang
     * @param {*} date
     * @returns {string}
     * @memberof Utils
     */
    public toLongDateFormat(date: any): string
    {
        return dateFormat(date, 'yyyy-mm-dd HH:MM:ss');
    }

    /**
     * 得到日期
     * @author Andrew_Huang
     * @param {number} numberDate
     * @returns {number}
     * @memberof utils
     */
    public getZeroHour(numberDate: number): number
    {
        let date = new Date(numberDate);
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();
        let d = new Date(year, month, day, 0, 0, 0);
        return d.getTime();
    }

    /**
     * 判断两个时间是否一致
     * @author Andrew_Huang
     * @param {number} time1
     * @param {number} time2
     * @returns {boolean}
     * @memberof Utils
     */
    public isSameDate(time1: number, time2: number): boolean
    {
        return this.getZeroHour(time1) === this.getZeroHour(time2);
    }

    /**
     * 克隆数据对象
     * @author Andrew_Huang
     * @param {*} origin
     * @returns {*}
     * @memberof Utils
     */
    public clone(origin: any): any
    {
        if (!origin)
        {
            return;
        }
        let obj: any = {};
        for (var f in origin)
        {
            if (origin.hasOwnProperty(f))
            {
                obj[f] = origin[f];
            }
        }
        return obj;
    }

    /**
     * 数据对象个数
     * @author Andrew_Huang
     * @param {*} obj
     * @returns {number}
     * @memberof Utils
     */
    public size(obj: any): number
    {
        if (!obj)
        {
            return 0;
        }

        let size = 0;
        for (let key in obj)
        {
            if (obj.hasOwnProperty(key))
            {
                size++;
            }
        }
        return size;
    }

    /**
     * 根据道具Id获取道具类型
     * @author Andrew_Huang
     * @param {number} itemId
     * @returns {number}
     * @memberof Utils
     */
    public getItemType(itemId: number): number
    {
        let itemType: number = (itemId / 100000) || 0;
        return itemType;
    }

    /**
     * 二进制数值判断
     * @author Andrew_Huang
     * @param {number} nConNum
     * @param {number} nTotalNum
     * @returns {boolean}
     * @memberof Utils
     */
    public ParseNumbersContain(nConNum: number, nTotalNum: number): boolean
    {
        let nPow = 0
        let nTemp = 0
        let bBool = false
        while (nTotalNum != 0 && nTotalNum != null)
        {
            nTemp = nTotalNum % 2

            if (nTemp != 0)
            {
                if (nConNum == Math.pow(2, nPow))
                {
                    bBool = true
                    break
                }
            }
            nPow = nPow + 1
            nTotalNum = (nTotalNum - nTemp) / 2
        }
        return bBool
    }

    public getStack(): any
    {
        // let orig = Error.prepareStackTrace;
        // Error.prepareStackTrace = function (_: any, stack: any)
        // {
        //     return stack;
        // };
        // let err = new Error();
        // Error.captureStackTrace(err, arguments.callee);
        // var stack = err.stack;
        // Error.prepareStackTrace = orig;
        // return stack;
        return null;
    }

    public getFileName(stack: any): any
    {
        return stack[1].getFileName();
    }

    public getLineNumber(stack: any): any
    {
        return stack[1].getLineNumber();
    }

    public myPrint(...args: any[]): void
    {
        if (Utils.isPrintFlag)
        {
            let len = args.length;
            if (len <= 0)
            {
                return;
            }
            let stack = this.getStack();
            let aimStr = '\'' + this.getFileName(stack) + '\' @' + this.getLineNumber(stack) + ' :\n';
            for (var i = 0; i < len; ++i)
            {
                aimStr += args[i] + ' ';
            }
            console.log('\n' + aimStr);
        }
    }
}