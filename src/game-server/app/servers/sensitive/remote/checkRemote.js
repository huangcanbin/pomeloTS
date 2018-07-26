const utils = require('../../../util/utils');
const sensitiveWords = require('../../../../config/data/sensitiveWords');

module.exports = function (app) {
    return new CheckRemote();
};

var CheckRemote = function () {

};

/**
 * 检验名字
 */
CheckRemote.prototype.checkName = (name, cb) => {
    let result = true;
    name = name.toUpperCase();

    for (let i = 0; i < sensitiveWords.length; i++) {
        let charArr = sensitiveWords[i].word.split('_');
        let count = 0;
        for (let j = 0; j < charArr.length; j++) {
            if (name.indexOf(charArr[j]) > -1) {
                count++;
            }
            else {
                //没有匹配的字符串,就退出本组匹配
                break;
            }
        }

        if (count === charArr.length) {
            result = false;
            break;
        }
    }

    utils.invokeCallback(cb, null, result);
};
