Object.defineProperty(exports, "__esModule", { value: true });
const dateFormat = require("dateformat");
class Utils {
    constructor() {
    }
    static isIDNumber(num) {
        let iSum = 0;
        if (!/^\d{17}(\d|x)$/i.test(num)) {
            return false;
        }
        let sId = num.replace(/x$/i, "a");
        if (Utils.aCity[parseInt(sId.substr(0, 2))] == null) {
            return false;
        }
        let sBirthday = sId.substr(6, 4) + "-" + Number(sId.substr(10, 2)) + "-" + Number(sId.substr(12, 2));
        let d = new Date(sBirthday.replace(/-/g, "/"));
        if (sBirthday != (d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate())) {
            return false;
        }
        for (var i = 17; i >= 0; i--) {
            iSum += (Math.pow(2, i) % 11) * parseInt(sId.charAt(17 - i), 11);
        }
        if (iSum % 11 != 1) {
            return false;
        }
        return true;
    }
    static getAge(date) {
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
    static toDateFormat(date) {
        return dateFormat(date, 'yyyy-mm-dd');
    }
    static getDateOfHour(h, m, s) {
        let date = new Date(Date.now());
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();
        let d = new Date(year, month, day, h, m || 0, s || 0, 0);
        return d.getTime();
    }
    static toLongDateFormat(date) {
        return dateFormat(date, 'yyyy-mm-dd HH:MM:ss');
    }
    static getZeroHour(numberDate) {
        let date = new Date(numberDate);
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();
        let d = new Date(year, month, day, 0, 0, 0);
        return d.getTime();
    }
    static isSameDate(time1, time2) {
        return this.getZeroHour(time1) === this.getZeroHour(time2);
    }
    static invokeCallback(callback, ...args) {
        if (!!callback && typeof callback === 'function') {
            callback.apply(null, ...args);
        }
    }
    static clone(origin) {
        if (!origin) {
            return;
        }
        let obj = {};
        for (var f in origin) {
            if (origin.hasOwnProperty(f)) {
                obj[f] = origin[f];
            }
        }
        return obj;
    }
    static size(obj) {
        if (!obj) {
            return 0;
        }
        let size = 0;
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                size++;
            }
        }
        return size;
    }
    static getItemType(itemId) {
        let itemType = (itemId / 100000) || 0;
        return itemType;
    }
    static ParseNumbersContain(nConNum, nTotalNum) {
        let nPow = 0;
        let nTemp = 0;
        let bBool = false;
        while (nTotalNum != 0 && nTotalNum != null) {
            nTemp = nTotalNum % 2;
            if (nTemp != 0) {
                if (nConNum == Math.pow(2, nPow)) {
                    bBool = true;
                    break;
                }
            }
            nPow = nPow + 1;
            nTotalNum = (nTotalNum - nTemp) / 2;
        }
        return bBool;
    }
    static getStack() {
        return null;
    }
    static getFileName(stack) {
        return stack[1].getFileName();
    }
    static getLineNumber(stack) {
        return stack[1].getLineNumber();
    }
    static myPrint(...args) {
        if (Utils.isPrintFlag) {
            let len = args.length;
            if (len <= 0) {
                return;
            }
            var stack = this.getStack();
            var aimStr = '\'' + this.getFileName(stack) + '\' @' + this.getLineNumber(stack) + ' :\n';
            for (var i = 0; i < len; ++i) {
                aimStr += args[i] + ' ';
            }
            console.log('\n' + aimStr);
        }
    }
}
Utils.isPrintFlag = false;
Utils.aCity = {
    11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江", 31: "上海",
    32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西", 37: "山东", 41: "河南", 42: "湖北", 43: "湖南",
    44: "广东", 45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏", 61: "陕西",
    62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门"
};
exports.default = Utils;
