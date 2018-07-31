import nodeFetch = require('node-fetch');
import md5 = require('md5');
import system = require('system');
import logger = require('pomelo-logger');
import sdCfg = require('../../../shared/config/sdCfg.json');

/**
 * 推送数据到SD平台
 * @author Andrew_Huang
 * @export
 * @class PushDataToSdService
 */
export class PushDataToSdService
{
    public static instance: PushDataToSdService;
    public static getInstance(): PushDataToSdService
    {
        if (!this.instance)
        {
            this.instance = new PushDataToSdService();
        }
        return this.instance;
    }
    private _logger: logger.ILogger;
    private _sdCfg: any;

    public constructor()
    {
        this._logger = logger.getLogger(system.__filename);
        this._sdCfg = <any>sdCfg;
    }

    /**
     * 推送在线数据
     * @author Andrew_Huang
     * @param {*} paramsObj
     * @memberof PushDataToSdService
     */
    public pushOnline(paramsObj: any)
    {
        paramsObj.StatTime = this.getTimestamp();
        this.pushData(this._sdCfg.online.name, paramsObj);
    }

    /**
     * 推送登录数据
     * @author Andrew_Huang
     * @param {*} paramsObj
     * @memberof PushDataToSdService
     */
    public pushLogin(paramsObj: any)
    {
        paramsObj.ChannelCode = paramsObj.ChannelCode || 1000;
        paramsObj.AppVer = paramsObj.AppVer || "v1.0.0.0";
        paramsObj.CreateTime = this.getTimestamp();
        this.pushData(this._sdCfg.login.name, paramsObj);
    }

    /**
     * 推送充值数据
     * @author Andrew_Huang
     * @param {*} paramsObj
     * @memberof PushDataToSdService
     */
    public pushCharge(paramsObj: any)
    {
        paramsObj.StatTime = this.getTimestamp();
        this.pushData(this._sdCfg.charge.name, paramsObj);
    }

    /**
     * 推送消费数据
     * @author Andrew_Huang
     * @param {*} pushConsumeModel
     * @memberof PushDataToSdService
     */
    public pushConsume(pushConsumeModel: any)
    {
        pushConsumeModel.StatTime = this.getTimestamp();
        this.pushData(this._sdCfg.consume.name, pushConsumeModel);
    }

    /**
     * 推送自定义事件
     * @author Andrew_Huang
     * @param {*} paramsObj
     * @memberof PushDataToSdService
     */
    public pushEvent(paramsObj: any)
    {
        paramsObj.CreateTime = this.getTimestamp();
        this.pushData(this._sdCfg.event.name, paramsObj);
    }

    private pushData(actionName: string, paramsObj: any)
    {
        let token = this.getToken(this._sdCfg.appId, this._sdCfg[actionName].key);
        paramsObj.AppID = this._sdCfg.appId;
        this.requestSd(actionName, token, paramsObj);
    }

    private requestSd(actionName: string, token: string, paramsObj: any)
    {
        let url = `http://api.sd.99.com/h5/${actionName}`;
        let options = {
            method: 'POST',
            headers: { _SD_TOKEN_: token },
            body: JSON.stringify(paramsObj)
        };
        nodeFetch.default(url, options).then((res: any) =>
        {
            if (!res.ok)
            {
                throw new Error(res.statusText);
            }
            return res.text();
        }).then((res: any) =>
        {
            if (res != `{"Code":"1"}`)
            {
                this._logger.error(`pushDataToSd:${JSON.stringify(options)}, body:[${res}]`);
            }
        }).catch((error: any) =>
        {
            this._logger.error(`pushDataToSd:${JSON.stringify(options)}, error:[${error}]`);
        });
    }

    private getToken(appId: string, actionKey: string)
    {
        let timestamp = this.getTimestamp();
        let sign = this.getSign(appId, actionKey, timestamp);
        let token = `{"appid":"${appId}","timestamp":"${timestamp}","sign":"${sign}"}`;
        return token;
    }

    private getSign(appId: string, actionKey: string, timestamp: number)
    {
        let p = `${appId}${timestamp}${actionKey}`;
        let sign = md5(p).substring(7, 13).toUpperCase();
        return sign;
    }

    private getTimestamp(): number
    {
        return new Date().getTime() / 1000;
    }
}