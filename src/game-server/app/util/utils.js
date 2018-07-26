var dateFormat = require('dateformat');

var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

var aCity = {
  11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江", 31: "上海",
  32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西", 37: "山东", 41: "河南", 42: "湖北", 43: "湖南",
  44: "广东", 45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏", 61: "陕西",
  62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门"
};

/**
 * number is id number
 */
utils.isIDNumber = function (num) {
  var iSum = 0;
  var info = "";
  if (!/^\d{17}(\d|x)$/i.test(num)) return false; //"身份证长度或格式错误"
  var sId = num.replace(/x$/i, "a");
  if (aCity[parseInt(sId.substr(0, 2))] == null) return false; //"身份证地区非法"
  sBirthday = sId.substr(6, 4) + "-" + Number(sId.substr(10, 2)) + "-" + Number(sId.substr(12, 2));
  var d = new Date(sBirthday.replace(/-/g, "/"));
  if (sBirthday != (d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate())) return false;  //"身份证上的出生日期非法"
  for (var i = 17; i >= 0; i--) iSum += (Math.pow(2, i) % 11) * parseInt(sId.charAt(17 - i), 11);
  if (iSum % 11 != 1) return false; //"身份证号非法"

  return true;
};

/**
 * get age
 */
utils.getAge = function (date) {
  var curDate = new Date();
  var curYear = curDate.getFullYear();
  var curMonth = curDate.getMonth();
  var curDay = curDate.getDate();

  var year = parseInt(date.substr(0, 4), 10);
  var month = parseInt(date.substr(4, 2), 10);
  var day = parseInt(date.substr(6, 2), 10);

  var monthFloor = (curMonth < month || (curMonth === month && curDay < day)) ? 1 : 0;
  var age = curYear - year - monthFloor;

  return age;
};

/**
 * to date part of datetime. ex:yyyy-mm-dd
 */
utils.toDateFormat = function (date) {
  return dateFormat(date, 'yyyy-mm-dd');
};

/**
 * to datetime. ex:yyyy-mm-dd HH:MM:ss
 */
utils.toLongDateFormat = function (date) {
  return dateFormat(date, 'yyyy-mm-dd HH:MM:ss');
};

/**
 * Gets time of current date.
 * @return {number}
 */
utils.getDateOfHour = function (hour, min, second) {
  var date = new Date(Date.now());
  var year = date.getFullYear();
  var month = date.getMonth();
  var day = date.getDate();
  var d = new Date(year, month, day, hour, min || 0, second || 0, 0);
  return d.getTime();
};

/**
 * Gets date of zero hour.
 * @return {number}
 */
utils.getZeroHour = function (numberDate) {
  var date = new Date(numberDate);
  var year = date.getFullYear();
  var month = date.getMonth();
  var day = date.getDate();
  var d = new Date(year, month, day, 0, 0, 0);
  return d.getTime();
};

/**
 * time is same date
 */
utils.isSameDate = function (time1, time2) {
  return utils.getZeroHour(time1) === utils.getZeroHour(time2);
};

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
  if (!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function (origin) {
  if (!origin) {
    return;
  }

  var obj = {};
  for (var f in origin) {
    if (origin.hasOwnProperty(f)) {
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function (obj) {
  if (!obj) {
    return 0;
  }

  var size = 0;
  for (var f in obj) {
    if (obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack() {
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack) {
  return stack[1].getLineNumber();
}

utils.myPrint = function () {
  if (isPrintFlag) {
    var len = arguments.length;
    if (len <= 0) {
      return;
    }
    var stack = getStack();
    var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
    for (var i = 0; i < len; ++i) {
      aimStr += arguments[i] + ' ';
    }
    console.log('\n' + aimStr);
  }
};
// print the file name and the line number ~ end

utils.getItemType = function (itemId) {
  var itemType = parseInt(itemId / 100000) || 0;
  return itemType;
};

/**
 * 二进制数值判断
 * @param {number} nConNum 
 * @param {number} nTotalNum 
 */
utils.ParseNumbersContain = function (nConNum, nTotalNum) {
  var nPow = 0
  var nTemp = 0
  var bBool = false
  while(nTotalNum != 0 && nTotalNum != null){
    nTemp = nTotalNum % 2
  
    if(nTemp != 0) {
      if (nConNum ==  Math.pow(2,nPow)) {
        bBool = true
        break
      }
    }

    nPow = nPow + 1
    nTotalNum = (nTotalNum - nTemp) / 2
    }
  return bBool
};