import dbDriver = require('../drive/DbDriver');
import utils = require('../util/Utils');

export class BaseDao
{
    protected dbDriver: dbDriver.DbDriver;
    protected utils: utils.Utils;

    public constructor()
    {
        this.dbDriver = dbDriver.DbDriver.getInstance();
        this.utils = utils.Utils.getInstance();
    }
}