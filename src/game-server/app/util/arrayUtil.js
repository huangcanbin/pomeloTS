var exp = module.exports;
var logger = require('pomelo-logger').getLogger(__filename);


Array.prototype.where = function (predicate) {
    let result = [];
    if (!isFunction(predicate)) {
        return result;
    }

    for (let i = 0; i < this.length; i++) {
        var item = this[i];
        if (predicate(item)) {
            result.push(item);
        }
    }

    return result;
};

Array.prototype.firstOrDefault = function (predicate) {
    let result = null;
    if (!isFunction(predicate)) {
        return result;
    }

    for (let i = 0; i < this.length; i++) {
        var item = this[i];
        if (predicate(item)) {
            return item;
        }
    }

    return result;
};

Array.prototype.select = function (selector) {
    let result = [];
    if (!isFunction(selector)) {
        return result;
    }

    for (let i = 0; i < this.length; i++) {
        var item = this[i];
        result.push(selector(item));
    }

    return result;
};

Array.prototype.joinArray = function (arr, selector) {
    let result = [];

    if (arr.length != this.length || !isFunction(selector)) {
        return result;
    }

    for (let i = 0; i < this.length; i++) {
        let item = this[i];
        let arrItem = arr[i];
        let newObj = Object.assign(item, selector(arrItem));
        result.push(newObj);
    }

    return result;
};

Array.prototype.sum = function (selector) {
    let result = 0;
    if (!isFunction(selector)) {
        return result;
    }

    for (let i = 0; i < this.length; i++) {
        var item = this[i];
        result += selector(item);
    }

    return result;
};

Array.prototype.pushArray = function (arr, predicate) {
    if (!arr || arr.length <= 0) {
        return;
    }

    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!!predicate && predicate(item)) {
            this.push(item);
        }
        else {
            this.push(item);
        }
    }
};

exp.dictionaryFirstOrDefault = function (dic, predicate) {
    let result = null;
    if (!isFunction(predicate)) {
        return result;
    }

    for (var i in dic) {
        var item = dic[i];
        if (predicate(item)) {
            return item;
        }
    }

    return result;
};

exp.dictionaryWhere = function (dic, predicate) {
    let result = [];
    if (!isFunction(predicate)) {
        return result;
    }

    for (var i in dic) {
        var item = dic[i];
        if (predicate(item)) {
            result.push(item);
        }
    }

    return result;
};

exp.dictionaryToArray = function (dic, predicate) {
    let result = [];
    if (!!predicate) {
        if (!isFunction(predicate)) {
            return result;
        }

        for (var i in dic) {
            var item = dic[i];
            if (predicate(item)) {
                result.push(item);
            }
        }
    }
    else {
        for (var i in dic) {
            var item = dic[i];
            result.push(item);
        }
    }

    return result;
};

function isFunction(filter) {
    if (!!filter || 'function' === typeof filter) {
        return true;
    }
    else {
        return false;
    }
}