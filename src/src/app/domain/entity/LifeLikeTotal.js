Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class LifeLikeTotal extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._hp = opts.hp || 0;
        this._attack = opts.attack || 0;
        this._hit = opts.hit || 0;
        this._dodge = opts.dodge || 0;
        this._speed = opts.speed || 0;
    }
    get hp() {
        return this._hp;
    }
    get attack() {
        return this._attack;
    }
    get hit() {
        return this._hit;
    }
    get dodge() {
        return this._dodge;
    }
    get speed() {
        return this._speed;
    }
}
exports.LifeLikeTotal = LifeLikeTotal;
