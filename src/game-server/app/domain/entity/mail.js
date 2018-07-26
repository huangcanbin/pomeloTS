var util = require('util');
var MySelf = require('./myself');
var consts = require('../../util/consts');
var ConfigCache = require('../../cache/configCache');
/**
 * Role entity object
 * 
 * @param {object} opts init opts.
 */
var Mail = function (opts) {
    MySelf.call(this, opts);
    let mailtime = ConfigCache.getVar.const(consts.Keys.MAIL_TIME) * 1000;
    this.isread = opts.isread || 0; //0：未读，1：已读
    this.items = opts.items || [];  //邮件奖励
    this.title = opts.title || "你好"; //邮件标题
    this.content = opts.content || "欢迎来到百鬼游戏"; //邮件内容;
    this.deltime = opts.deltime || Date.now() + mailtime; //邮件删除时间
};

util.inherits(Mail, MySelf);

module.exports = Mail;
