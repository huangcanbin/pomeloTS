Object.defineProperty(exports, "__esModule", { value: true });
const area = require("./Area");
class Scene {
    static getInstance() {
        if (!this.instance) {
            this.instance = new Scene();
        }
        return this.instance;
    }
    constructor() {
        this._area = null;
    }
    init(opts) {
        if (!this._area) {
            opts.weightMap = true;
            this._area = new area.Area(opts);
        }
    }
    get area() {
        return this._area;
    }
}
exports.Scene = Scene;
