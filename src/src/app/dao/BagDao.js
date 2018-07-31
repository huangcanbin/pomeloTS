Object.defineProperty(exports, "__esModule", { value: true });
class BagDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new BagDao();
        }
        return this.instance;
    }
    constructor() {
    }
    a() {
    }
}
exports.BagDao = BagDao;
