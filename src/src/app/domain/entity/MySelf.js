Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("./Entity");
class MySelf extends Entity_1.Entity {
    constructor(opts) {
        super(opts);
        this._playerId = opts.playerId;
    }
    set playerId(value) {
        this.playerId = value;
    }
}
exports.MySelf = MySelf;
