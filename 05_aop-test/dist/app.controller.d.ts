import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    aaa(): string;
    bbb(): string;
    ccc(num: number): number;
}
