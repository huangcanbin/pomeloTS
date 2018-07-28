Object.defineProperty(exports, "__esModule", { value: true });
class ConfigCache {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ConfigCache();
        }
        return this.instance;
    }
    constructor() {
    }
    getVarConst(id, num = 0) {
        console.log(id);
        console.log(num);
        return 0;
    }
    getCharacter(id, lv = null) {
        console.log(id);
        console.log(lv);
        return 0;
    }
    getHero(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    getSkill(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    getIllustrated(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    getIllAch(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
    getMonster(id, lv = null) {
        console.log(id);
        console.log(lv);
        return null;
    }
}
exports.ConfigCache = ConfigCache;
