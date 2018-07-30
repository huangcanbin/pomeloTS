Object.defineProperty(exports, "__esModule", { value: true });
let config = require('../../../config/dbstroage');
const DEV_ENV = "development";
let env = process.env.NODE_ENV || DEV_ENV;
let dbconfig = {
    config: config[env] || [],
    cache: config[env] || []
};
exports.default = dbconfig;
