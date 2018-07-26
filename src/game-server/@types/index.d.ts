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

// declare let process: any;
// declare let __filename: string;
// declare let __dirname: string;

interface ArrayConstructor
{
    where(predicate: any): any;
    firstOrDefault(predicate: any): any;
    // captureStackTrace: any;
}

// declare module "*.json" {
// }
// declare module 'crypto';
// declare module "pomelo";
// declare module "pomelo-logger" {
//     export interface ILogger {
//         setLevel(level: string): void;
//         trace(msg: string, ...args: any[]): void;
//         debug(msg: string, ...args: any[]): void;
//         info(msg: string, ...args: any[]): void;
//         warn(msg: string, ...args: any[]): void;
//         error(msg: string, ...args: any[]): void;
//         fatal(msg: string, ...args: any[]): void;
//     }

//     export function getLogger(categoryName: string): ILogger;
//     export function getLogger(categoryName: string, filename: string): ILogger;
// }
// declare module "fs";

// declare let process: any;
// declare let __filename: string;
// declare let __dirname:string;