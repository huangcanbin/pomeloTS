Object.defineProperty(exports, "__esModule", { value: true });
const pomelo = require("pomelo");
class MessageService {
    static getInstance() {
        if (!this.instance) {
            this.instance = new MessageService();
        }
        return this.instance;
    }
    constructor() {
    }
    pushMessageByUids(uids, route, msg, callback, context) {
        pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, () => {
            callback.call(context);
        });
    }
    pushMessageToPlayer(uid, route, msg, callback, context) {
        this.pushMessageByUids([uid], route, msg, callback, context);
    }
}
exports.MessageService = MessageService;
