"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const time_interceptor_1 = require("./time.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(function (req, res, next) {
        console.log('before', req.url);
        next();
        console.log('after', req.url);
    });
    app.useGlobalInterceptors(new time_interceptor_1.TimeInterceptor());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map