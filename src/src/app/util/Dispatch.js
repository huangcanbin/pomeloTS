Object.defineProperty(exports, "__esModule", { value: true });
class Dispatch {
    static getInstance() {
        if (!this.instance) {
            this.instance = new Dispatch();
        }
        return this.instance;
    }
    static dispatch(uid, connectors) {
        var index = Number(uid) % connectors.length;
        return connectors[index];
    }
}
exports.Dispatch = Dispatch;
