Object.defineProperty(exports, "__esModule", { value: true });
const dbDriver = require("../drive/DbDriver");
const utils = require("../util/Utils");
class BaseDao {
    constructor() {
        this.dbDriver = dbDriver.DbDriver.getInstance();
        this.utils = utils.Utils.getInstance();
    }
}
exports.BaseDao = BaseDao;
