# meeting-room-reservation
一个使用 NestJs 开发的全栈项目-会议室预订系统。

# 一、概述
这是一个 使用 NestJs 开发的全栈项目
技术栈：前端是 antd + react + cra，后端是 nest + typeorm，数据库是 mysql + redis，API 文档用 swagger 生成，部署用 docker compose + pm2，网关使用 nginx。

数据库表有 8 个：用户表 users、会议室表 meeting_rooms、预订表 bookings、预订-参会者表 booking_attendees、角色表 roles、权限表 permissions、用户-角色表 user_roles、角色-权限表 role_permissions。

模块有 4 个：用户管理模块、会议室管理模块、预订管理模块、统计管理模块。

角色有两个：普通用户、管理员，各自拥有的权限按照用例图来。使用 RBAC 来控制接口访问权限。

# 二、项目结构

```
meeting-room-reservation
+-- 数据库表设计说明[目录]               // 数据库设计xlsx文件
+-- admin-vue[目录]                    // 前端vue项目
+-- admin-react[目录]                  // 前端react项目
+-- server[目录]                       // NestJS后端项目
    +-- dist[目录]                      // 编译后的目录，用于预览项目
    +-- node_modules[目录]              // 项目使用的包目录，开发使用和上线使用的都在里边
    +-- src[目录]                       // 源文件/代码，程序员主要编写的目录
    |  +-- app.controller.spec.ts      // 对于基本控制器的单元测试样例
    |  +-- app.controller.ts           // 控制器文件，可以简单理解为路由文件
    |  +-- app.module.ts               // 模块文件，在NestJS世界里主要操作的就是模块
    |  +-- app.service.ts              // 服务文件，提供的服务文件，业务逻辑编写在这里
    |  +-- app.main.ts                 // 项目的入口文件，里边包括项目的主模块和监听端口号
    +-- test[目录]                      // 测试文件目录，对项目测试时使用的目录，比如单元测试...
    |  +-- app.e2e-spec.ts             // e2e测试，端对端测试文件，测试流程和功能使用
    |  +-- jest-e2e.json               // jest测试文件，jset是一款简介的JavaScript测试框架
    +-- .eslintrc.js                   // ESlint的配置文件
    +-- .gitignore                     // git的配置文件，用于控制哪些文件不受Git管理
    +-- .prettierrc                    // prettier配置文件，用于美化/格式化代码的
    +-- nest-cli.json                  // 整个项目的配置文件，这个需要根据项目进行不同的配置
    +-- package-lock.json              // 防止由于包不同，导致项目无法启动的配置文件，固定包版本
    +-- package.json                   // 项目依赖包管理文件和Script文件，比如如何启动项目的命令
    +-- README.md                      // 对项目的描述文件，markdown语法
    +-- tsconfig.build.json            // TypeScript语法构建时的配置文件
    +-- tsconfig.json                  // TypeScript的配置文件，控制TypeScript编译器的一些行为
+-- 项目说明文档.docx                   // 项目说明文档
+-- README.md                      // 整个会议室项目的 描述文件，markdown语法
```

# 三、server项目

## 3.1 创建项目

```bash
$ nest new server
# 使用pnpm

```
## 3.2 配置全局配置读取 yaml 配置文件
为实现参数的读取，需要安装如下依赖包：
```bash
# NestJs配置需要 @nestjs/config 
$ pnpm install --save @nestjs/config
# 读取和解析 YAML 文件，我们可以利用 js-yaml 包和ts类型提示包
$ pnpm install --save js-yaml 
$ pnpm install -D @types/js-yaml
# 安装了该包后，我们使用 yaml#load 函数来加载上面创建的 YAML 文件。

```
在 src目录下创建 config/index.ts 文件，然后创建开发环境的配置文件 dev.yaml，内容如下：
```yaml
# 开发环境配置
app:
  prefix: ''
  host: 'localhost'
  port: 3000
  name: 'dev'

# 数据库配置
db:
  mysql:
    host: 'localhost'
    port: 3306
    username: 'root'
    password: 'wanggeng123456'
    database: 'nest-vue-ruoyi'
    charset: 'utf8mb4'
    logger: 'file'
    logging: true
    multipleStatements: true
    dropSchema: false
    supportBigNumbers: true
    bigNumberStrings: true

# redis 配置
redis:
  host: '127.0.0.1'
  port: 6379
  db: 0
  keyPrefix: 'nest:'

# jwt 配置
jwt:
  SECRET: 'test'
  SECRET1: 'test11'
  EXPIRES_IN: '1h'
  refreshExpiresIn: '2h'


# 权限-路由白名单配置
permission:
  router:
    whitelist:
      [
        { path: '/captchaImage', method: 'GET' },
        { path: '/test', method: 'GET' },
        { path: '/register', method: 'POST' },
        { path: '/login', method: 'POST' },
        { path: '/logout', method: 'POST' },
        { path: '/permission/{id}', method: 'GET' },
        { path: '/upload', method: 'POST' },
      ]
```

<!-- 配置全局配置读取 yaml 配置文件 -->
```js
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'dev.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};

// 注意要在nest-cli.json中配置全局配置编译选项，不然打包后无法读取配置文件
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.yml"],// 新增
    "watchAssets": true // 新增
  }
}


```
上面配置就写死了,所以我们通过安装 cross-env 实现通过环境变量来动态读取配置文件`$ pnpm install -D cross-env` 、在包管理文件的scripts中配置环境变量。
```js
 "scripts": {
    "start": "cross-env NODE_ENV=development nest start",
    "start:dev": "cross-env NODE_ENV=development nest start --watch",
    "start:prod": "cross-env NODE_ENV=production node dist/main",
  },

```

同时在 src/common目录下新建 enum/index.ts 枚举文件、新建环境配置枚举类型 
```js 
/**
 * 环境变量枚举
 * @description test = 'test' 测试配置
 * @description production = 'prod' 生产配置
 * @description development = 'dev' 开发配置
 */
export enum EnvEnum {
  test = 'test',
  production = 'prod',
  development = 'dev',
}

```
在根模块中配置即可。
```js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 引入内置配置模块实现配置动态读取
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';

@Module({
  imports: [
    // 动态注册
    ConfigModule.forRoot({
      cache: true, // 提高 ConfigService#get 方法在处理存储在 process.env 中的变量时的性能。
      isGlobal: true, // 配置模块在整个应用程序中全局可用。
      load: [configuration], // 加载自定义文件
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// 在特性模块中使用
// feature.module.ts 
@Module({
  imports: [ConfigModule], // 导入
  // ...
})
// 如果 ConfigModule.forRoot() 方法的选项对象的 isGlobal 属性设置为 true,则不需要导入

// // feature.service.ts  注入
import  { ConfigService } from '@nestjs/config';
constructor(private configService: ConfigService) {}

```

## 3.3 配置mysql数据库连接
为了读取数据库配置，需要安装如下依赖包：同时我们使用异步的方式加载数据库配置。
```bash
$ pnpm install --save @nestjs/typeorm typeorm mysql2


```
在根模块中注册TypeOrmModule 提供者实现数据库的连接
```js


```
