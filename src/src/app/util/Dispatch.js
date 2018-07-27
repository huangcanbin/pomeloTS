Object.defineProperty(exports, "__esModule", { value: true });
class Dispatch {
    static dispatch(uid, connectors) {
        var index = Number(uid) % connectors.length;
        return connectors[index];
    }
}
exports.default = Dispatch;
