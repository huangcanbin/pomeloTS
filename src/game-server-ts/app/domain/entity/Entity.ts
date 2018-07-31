/**
 * 实体基类
 * @author Andrew_Huang
 * @export
 * @class Entity
 */
export class Entity
{
    protected createTime: number;  //创建时间

    public constructor(opts: any)
    {
        this.createTime = opts.createTime || Date.now();
    }
}