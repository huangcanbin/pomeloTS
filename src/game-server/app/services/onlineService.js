const pushDataToSdService = require("./pushDataToSdService");

var user_map = new Map();

module.exports = {
    start: function (areaId, areaName) {
        //每5分钟向sd平台推送一次在线人数
        setInterval(() => {
            let params = { ServerName: areaName, ServerID: areaId, AccountCnt: user_map.size };
            pushDataToSdService.pushOnline(params);
        }, 300000);
    },
    online: function (userid) {
        user_map.set(userid, 1);
    },    
    leave: function (userid) {
        user_map.delete(userid);
    }
};