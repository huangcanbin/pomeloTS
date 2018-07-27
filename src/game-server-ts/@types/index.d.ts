

declare module "*.json" {
}
declare module 'crypto';
declare module "pomelo";
declare module "pomelo-logger" {
    export interface ILogger
    {
        setLevel(level: string): void;
        trace(msg: string, ...args: any[]): void;
        debug(msg: string, ...args: any[]): void;
        info(msg: string, ...args: any[]): void;
        warn(msg: string, ...args: any[]): void;
        error(msg: string, ...args: any[]): void;
        fatal(msg: string, ...args: any[]): void;
    }

    export function getLogger(categoryName: string): ILogger;
    export function getLogger(categoryName: string, filename: string): ILogger;
}
declare module "fs";

declare module "system" {
    let process: any;
    let __filename: string;
    let __dirname: string;
}
