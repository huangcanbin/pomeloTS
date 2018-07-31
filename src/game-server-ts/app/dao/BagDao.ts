
export class BagDao
{
    public static instance: BagDao;
    public static getInstance(): BagDao
    {
        if (!this.instance)
        {
            this.instance = new BagDao();
        }
        return this.instance
    }

    public constructor()
    {

    }

    public a(): void
    {

    }
}