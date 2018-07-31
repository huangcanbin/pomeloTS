Object.defineProperty(exports, "__esModule", { value: true });
const nodeFetch = require("node-fetch");
const md5 = require("md5");
const system = require("system");
const logger = require("pomelo-logger");
let sdCfg = require("../../../shared/config/sdCfg");
class PushDataToSdService {
    static getInstance() {
        if (!this.instance) {
            this.instance = new PushDataToSdService();
        }
        return this.instance;
    }
    constructor() {
        this._logger = logger.getLogger(system.__filename);
    }
    pushOnline(paramsObj) {
        paramsObj.StatTime = this.getTimestamp();
        this.pushData(sdCfg.online.name, paramsObj);
    }
    pushLogin(paramsObj) {
        paramsObj.ChannelCode = paramsObj.ChannelCode || 1000;
        paramsObj.AppVer = paramsObj.AppVer || "v1.0.0.0";
        paramsObj.CreateTime = this.getTimestamp();
        this.pushData(sdCfg.login.name, paramsObj);
    }
    pushCharge(paramsObj) {
        paramsObj.StatTime = this.getTimestamp();
        this.pushData(sdCfg.charge.name, paramsObj);
    }
    pushConsume(pushConsumeModel) {
        pushConsumeModel.StatTime = this.getTimestamp();
        this.pushData(sdCfg.consume.name, pushConsumeModel);
    }
    pushEvent(paramsObj) {
        paramsObj.CreateTime = this.getTimestamp();
        this.pushData(sdCfg.event.name, paramsObj);
    }
    pushData(actionName, paramsObj) {
        let token = this.getToken(sdCfg.appId, sdCfg[actionName].key);
        paramsObj.AppID = sdCfg.appId;
        this.requestSd(actionName, token, paramsObj);
    }
    requestSd(actionName, token, paramsObj) {
        let url = `http://api.sd.99.com/h5/${actionName}`;
        let options = {
            method: 'POST',
            headers: { _SD_TOKEN_: token },
            body: JSON.stringify(paramsObj)
        };
        nodeFetch.default(url, options).then((res) => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
            return res.text();
        }).then((res) => {
            if (res != `{"Code":"1"}`) {
                this._logger.error(`pushDataToSd:${JSON.stringify(options)}, body:[${res}]`);
            }
        }).catch((error) => {
            this._logger.error(`pushDataToSd:${JSON.stringify(options)}, error:[${error}]`);
        });
    }
    getToken(appId, actionKey) {
        let timestamp = this.getTimestamp();
        let sign = this.getSign(appId, actionKey, timestamp);
        let token = `{"appid":"${appId}","timestamp":"${timestamp}","sign":"${sign}"}`;
        return token;
    }
    getSign(appId, actionKey, timestamp) {
        let p = `${appId}${timestamp}${actionKey}`;
        let sign = md5(p).substring(7, 13).toUpperCase();
        return sign;
    }
    getTimestamp() {
        return new Date().getTime() / 1000;
    }
}
exports.PushDataToSdService = PushDataToSdService;
