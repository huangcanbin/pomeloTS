import dateFormat = require('dateformat');

// control variable of func "myPrint"
let isPrintFlag = false;
// let isPrintFlag = true;

let aCity: any = {
  11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江", 31: "上海",
  32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西", 37: "山东", 41: "河南", 42: "湖北", 43: "湖南",
  44: "广东", 45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏", 61: "陕西",
  62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门"
};

let utils = {
  /**
   * number is id number
   */
  isIDNumber: function (num: string): boolean {
    let iSum = 0;
    if (!/^\d{17}(\d|x)$/i.test(num)) return false; //"身份证长度或格式错误"
    let sId = num.replace(/x$/i, "a");
    let cityCode = parseInt(sId.substr(0, 2));
    if (aCity[cityCode] == undefined) return false; //"身份证地区非法"
    let sBirthday = sId.substr(6, 4) + "-" + Number(sId.substr(10, 2)) + "-" + Number(sId.substr(12, 2));
    let d = new Date(sBirthday.replace(/-/g, "/"));
    if (sBirthday != (d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate())) return false;  //"身份证上的出生日期非法"
    for (let i = 17; i >= 0; i--) iSum += (Math.pow(2, i) % 11) * parseInt(sId.charAt(17 - i), 11);
    if (iSum % 11 != 1) return false; //"身份证号非法"

    return true;
  },

  /**
   * get age
   */
  getAge: function (date: string): number {
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
  },

  /**
   * to date part of datetime. ex:yyyy-mm-dd
   */
  toDateFormat: function (date: string): any {
    return dateFormat(date, 'yyyy-mm-dd');
  },

  /**
   * to datetime. ex:yyyy-mm-dd HH:MM:ss
   */
  toLongDateFormat: function (date: string): any {
    return dateFormat(date, 'yyyy-mm-dd HH:MM:ss');
  },

  /**
   * Gets time of current date.
   * @return {number}
   */
  getDateOfHour: function (hour: number, min: number, second: number): any {
    let date = new Date(Date.now());
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let d = new Date(year, month, day, hour, min || 0, second || 0, 0);
    return d.getTime();
  },

  /**
   * Gets date of zero hour.
   * @return {number}
   */
  getZeroHour: function (numberDate: any): any {
    let date = new Date(numberDate);
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let d = new Date(year, month, day, 0, 0, 0);
    return d.getTime();
  },

  /**
   * time is same date
   */
  isSameDate: function (time1: any, time2: any): boolean {
    return utils.getZeroHour(time1) === utils.getZeroHour(time2);
  },

  /**
   * Check and invoke callback function
   */
  invokeCallback: function (cb: any): void {
    if (!!cb && typeof cb === 'function') {
      cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  },

  /**
   * clone an object
   */
  clone: function (origin: any): any {
    if (!origin) {
      return;
    }

    let obj: any = {};
    for (let f in origin) {
      if (origin.hasOwnProperty(f)) {
        obj[f] = origin[f];
      }
    }
    return obj;
  },

  size: function (obj: any): number {
    if (!obj) {
      return 0;
    }

    let size = 0;
    for (let f in obj) {
      if (obj.hasOwnProperty(f)) {
        size++;
      }
    }

    return size;
  },

  myPrint: function (): void {
    if (isPrintFlag) {
      let len = arguments.length;
      if (len <= 0) {
        return;
      }
      let stack = getStack();
      let aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
      for (let i = 0; i < len; ++i) {
        aimStr += arguments[i] + ' ';
      }
      console.log('\n' + aimStr);
    }
  },
  // print the file name and the line number ~ end

  getItemType: function (itemId: number): number {
    let itemType = (itemId / 100000) || 0;
    return itemType;
  },

  /**
   * 二进制数值判断
   * @param {number} nConNum 
   * @param {number} nTotalNum 
   */
  ParseNumbersContain: function (nConNum: number, nTotalNum: number): boolean {
    let nPow = 0
    let nTemp = 0
    let bBool = false
    while (nTotalNum != 0 && nTotalNum != null) {
      nTemp = nTotalNum % 2

      if (nTemp != 0) {
        if (nConNum == Math.pow(2, nPow)) {
          bBool = true
          break
        }
      }

      nPow = nPow + 1
      nTotalNum = (nTotalNum - nTemp) / 2
    }
    return bBool
  }
}


// print the file name and the line number ~ begin
export function getStack() {
  let orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_: any, stack: any): any {
    return stack;
  };
  let err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  let stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

export function getFileName(stack: any) {
  return stack[1].getFileName();
}

export function getLineNumber(stack: any) {
  return stack[1].getLineNumber();
}

export default utils;