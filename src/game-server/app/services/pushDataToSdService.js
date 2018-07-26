/* const request = require("request"); */
const fetch = require('node-fetch');
const md5 = require('md5');
const logger = require('pomelo-logger').getLogger(__filename);
const sdCfg = require("../../../shared/config/sdCfg");

/*
推送数据到SD平台
*/
class pushDataToSd {
    /**
     * 推送在线数据
     * @param {ServerName,ServerID,Platform,AccountCnt} paramsObj 
     */
    static pushOnline(paramsObj) {
        paramsObj.StatTime = pushDataToSd.getTimestamp();
        pushDataToSd.push(sdCfg.online.name, paramsObj);
    }
    /**
     * 推送登录数据
     * @param {ChannelCode,AccountID,ServerID,UserID,DeviceID,AppVer,DeviceModel,ScreenX,ScreenY,Platform,DeviceVer,NetMode,IP,ActType,SessionID} paramsObj 
     */
    static pushLogin(paramsObj) {
        paramsObj.ChannelCode = paramsObj.ChannelCode || 1000;
        paramsObj.AppVer = paramsObj.AppVer || "v1.0.0.0";
        paramsObj.CreateTime = pushDataToSd.getTimestamp();

        pushDataToSd.push(sdCfg.login.name, paramsObj);
    }
    /**
     * 推送充值数据
     * @param {OrderID,ServerID,AccountName,AccountID,UserID,ChargeNum,ItemType,Price,ItemCnt,IP,ChargeType,ChargeCode} paramsObj 
     */
    static pushCharge(paramsObj) {
        paramsObj.StatTime = pushDataToSd.getTimestamp();
        pushDataToSd.push(sdCfg.charge.name, paramsObj);
    }
    /**
     * 推送消费数据
     * @param {pushConsumeModel} pushConsumeModel 
     */
    static pushConsume(pushConsumeModel) {
        pushConsumeModel.StatTime = pushDataToSd.getTimestamp();
        pushDataToSd.push(sdCfg.consume.name, pushConsumeModel);
    }
    /**
     * 推送自定义事件
     * @param {ChannelCode,Platform,DeviceID,DeviceModel,ServerID,AccountID,UserID,EventID,EventValue,} paramsObj 
     */
    static pushEvent(paramsObj) {
        paramsObj.CreateTime = pushDataToSd.getTimestamp();
        pushDataToSd.push(sdCfg.event.name, paramsObj);
    }
    static push(actionName, paramsObj) {
        let token = pushDataToSd.getToken(sdCfg.appId, sdCfg[actionName].key);
        paramsObj.AppID = sdCfg.appId;
        pushDataToSd.requestSd(actionName, token, paramsObj);
    }
    static requestSd(actionName, token, paramsObj) {
        let url = `http://api.sd.99.com/h5/${actionName}`;
        let options = {
            method: 'POST',
            headers: { _SD_TOKEN_: token },
            body: JSON.stringify(paramsObj)
        };

        fetch(url, options).then(res => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
            return res.text();
        }).then(res => {
            if (res != `{"Code":"1"}`) {
                logger.error(`pushDataToSd:${JSON.stringify(options)}, body:[${res}]`);
            }
            /* else {
                logger.error(`pushDataToSd:${JSON.stringify(options)}`);
            } */
        }).catch(error => {
            logger.error(`pushDataToSd:${JSON.stringify(options)}, error:[${error}]`);
        });
    }
    static getToken(appId, actionKey) {
        let timestamp = pushDataToSd.getTimestamp();
        let sign = pushDataToSd.getSign(appId, actionKey, timestamp);
        let token = `{"appid":"${appId}","timestamp":"${timestamp}","sign":"${sign}"}`;
        return token;
    }
    static getSign(appId, actionKey, timestamp) {
        let p = `${appId}${timestamp}${actionKey}`;
        let sign = md5(p).substring(7, 13).toUpperCase();
        return sign;
    }
    static getTimestamp() {
        return parseInt(new Date().getTime() / 1000);
    }
}

module.exports = pushDataToSd;