export default class ConfigCache
{
    public constructor()
    {

    }

    public static getVarConst(id: string, num: number = 0): number
    {
        console.log(id);
        console.log(num);
        return 0;
    }

    public static getCharacter(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return 0;
    }

    public static getHero(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getSkill(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getIllustrated(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getIllAch(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }
}