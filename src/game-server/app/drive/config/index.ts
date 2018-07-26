let config: any = require('../../../config/dbstroage');


const DEV_ENV = "development"
let env = process.env.NODE_ENV || DEV_ENV;

export interface DbConfig {
    config: any[];
    cache: any[];
}

let dbconfig: DbConfig = {
    config: config[env] || [],
    cache: config[env] || []
}

export default dbconfig;