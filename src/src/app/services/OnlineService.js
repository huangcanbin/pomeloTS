Object.defineProperty(exports, "__esModule", { value: true });
const pushDataService = require("./PushDataToSdService");
class OnlineService {
    static getInstance() {
        if (!this.instance) {
            this.instance = new OnlineService();
        }
        return this.instance;
    }
    constructor() {
        this._pushDataToSdService = pushDataService.PushDataToSdService.getInstance();
        this._userMap = new Map();
    }
    start(areaId, areaName) {
        setInterval(() => {
            let params = { ServerName: areaName, ServerID: areaId, AccountCnt: this._userMap.size };
            this._pushDataToSdService.pushOnline(params);
        }, 300000);
    }
    online(userId) {
        this._userMap.set(userId, 1);
    }
    leave(userId) {
        this._userMap.delete(userId);
    }
}
exports.OnlineService = OnlineService;
