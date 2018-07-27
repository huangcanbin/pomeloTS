Object.defineProperty(exports, "__esModule", { value: true });
class ConfigCache {
    constructor() {
    }
    static getVarConst(id, num = 0) {
        console.log(id);
        console.log(num);
        return 0;
    }
    static getCharacter(id, lv = null) {
        console.log(id);
        console.log(lv);
        return 0;
    }
    static getHero(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    static getSkill(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    static getIllustrated(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    static getIllAch(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
}
exports.default = ConfigCache;
