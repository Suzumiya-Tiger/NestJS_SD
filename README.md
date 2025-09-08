# NestJS 学习之旅 - 从入门到精通

这是一个全面的 NestJS 学习项目集合，涵盖了从基础到高级的各种特性和概念。每个子项目都专注于特定的 NestJS 功能，帮助你循序渐进地掌握这个强大的Node.js框架。

## 学习路径与项目结构

### 基础入门
1. **01_http_transport_method**: HTTP 请求方法和参数传递
   - 学习 GET、POST、PUT、DELETE 等 HTTP 方法的实现
   - 掌握路由参数、查询参数和请求体的使用
   - 了解控制器（Controller）的基本概念

2. **02_nest_ioc**: 依赖注入和 IoC 容器
   - 理解依赖注入（DI）和控制反转（IoC）的概念
   - 学习 NestJS 的模块化架构
   - 掌握 Providers 和依赖关系处理

3. **03_debug_test**: 调试技巧与测试
   - 设置开发环境调试配置
   - 了解断点调试方法
   - 学习基本的单元测试编写

### 中级进阶
4. **04_custom-provider**: 自定义 Provider 实现
   - 学习 Value Provider、Factory Provider 和 Class Provider
   - 掌握动态创建 Provider 的方法
   - 了解如何使用异步 Provider

5. **05_aop-test**: 面向切面编程 (AOP)
   - 了解中间件、拦截器、过滤器和管道的概念
   - 掌握在请求/响应周期中使用 AOP 的方法
   - 学习如何实现请求日志、响应转换等功能

6. **06_all-decorator**: 装饰器全解析
   - 学习 NestJS 内置装饰器的使用
   - 了解 TypeScript 装饰器的原理
   - 掌握类装饰器、方法装饰器和参数装饰器

7. **07_custom-decorator**: 自定义装饰器实现
   - 学习创建自定义装饰器的方法
   - 掌握元数据反射（Metadata Reflection）
   - 了解如何结合装饰器与守卫实现权限控制

8. **08_argument-host**: 执行上下文与请求处理
   - 学习 ExecutionContext 的使用
   - 了解如何在不同上下文（HTTP、WebSocket、RPC）中获取请求信息
   - 掌握 ArgumentsHost 的应用场景

9. **09_dynamic-module**: 动态模块配置
   - 学习动态模块的创建和使用
   - 掌握 `forRoot()`、`forFeature()` 和 `register()` 模式
   - 了解模块配置传递和全局模块共享

### 高级特性
10. **10_middleware-test**: 中间件深度应用
    - 学习函数式中间件和类中间件的区别
    - 掌握中间件在模块中的配置方法
    - 了解全局中间件的使用场景

11. **11_interceptor-test**: 拦截器高级应用
    - 学习如何处理响应映射（RxJS 操作符）
    - 掌握异常处理和超时控制
    - 了解拦截器链的工作原理

12. **12_pipe-test**: 管道验证与转换
    - 学习内置验证管道的使用
    - 掌握自定义管道的开发流程
    - 了解与 DTO 结合的数据验证

13. **13_exception-filter-test**: 异常过滤器
    - 学习 NestJS 异常层次结构
    - 掌握全局和特定路由的异常处理
    - 了解自定义业务异常的创建和处理

14. **14_version-test**: API 版本控制
    - 学习 URI 版本控制和 Header 版本控制
    - 掌握多版本 API 的组织方式
    - 了解如何优雅处理 API 迭代升级

### 实用功能
15. **15_nest-multer-upload**: 文件上传处理
    - 学习如何使用 Multer 集成进行文件上传
    - 掌握单文件和多文件上传方法
    - 了解文件验证和存储策略

16. **16_express-mutler-test**: Express 集成示例
    - 学习 NestJS 如何与 Express 结合使用
    - 掌握底层平台特性的访问方法
    - 了解混合应用程序的开发模式

## 每个项目的运行方法

```bash
# 进入特定项目目录
cd 01_http_transport_method

# 安装依赖
npm install
# 或
pnpm install

# 开发模式运行
npm run start:dev
# 或
pnpm run start:dev
```

## 学习建议

1. **循序渐进**: 按照上述项目顺序逐个学习，每个项目都建立在前一个项目的知识基础上
2. **动手实践**: 不要仅仅阅读代码，尝试修改和扩展功能来加深理解
3. **参考文档**: 结合 [NestJS 官方文档](https://docs.nestjs.com/) 一起学习
4. **应用实战**: 在学习过程中思考如何将这些概念应用到实际项目中

## 扩展资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS GitHub 仓库](https://github.com/nestjs/nest)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [RxJS 文档](https://rxjs.dev/guide/overview)

## 学习进度跟踪

可以使用以下表格跟踪你的学习进度：

| 项目 | 状态 | 笔记 | 完成日期 |
|-----|------|-----|---------|
| 01_http_transport_method | □ | | |
| 02_nest_ioc | □ | | |
| 03_debug_test | □ | | |
| 04_custom-provider | □ | | |
| 05_aop-test | □ | | |
| 06_all-decorator | □ | | |
| 07_custom-decorator | □ | | |
| 08_argument-host | □ | | |
| 09_dynamic-module | □ | | |
| 10_middleware-test | □ | | |
| 11_interceptor-test | □ | | |
| 12_pipe-test | □ | | |
| 13_exception-filter-test | □ | | |
| 14_version-test | □ | | |
| 15_nest-multer-upload | □ | | |
| 16_express-mutler-test | □ | | |

希望你喜欢我的学习笔记，祝你在 NestJS 的学习之旅中收获满满！ 