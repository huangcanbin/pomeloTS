Object.defineProperty(exports, "__esModule", { value: true });
class Entity {
    constructor(opts) {
        this.createTime = opts.createTime || Date.now();
    }
}
exports.Entity = Entity;
