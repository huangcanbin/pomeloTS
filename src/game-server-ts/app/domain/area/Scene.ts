import area = require('./Area');

export class Scene
{
    public static instance: Scene;
    public static getInstance(): Scene
    {
        if (!this.instance)
        {
            this.instance = new Scene();
        }
        return this.instance;
    }

    private _area: area.Area;
    public constructor()
    {
        this._area = null;
    }

    public init(opts: any): void
    {
        if (!this._area)
        {
            opts.weightMap = true;
            this._area = new area.Area(opts);
        }
    }

    public get area(): area.Area
    {
        return this._area;
    }
}