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
// configuration
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
//  nest cli 的复制 assets 的功能，默认是只复制 src 目录(即根目录)下的配置文件。
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.yml"],// 新增 - 指定 build 时复制到 dist 目录的文件
    "watchAssets": true // 新增 - 在 assets 变动之后自动重新复制。
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
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 引入内置配置模块实现配置动态读取
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

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
    // 数据库连接-动态注入
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // 引入配置模块
      inject: [ConfigService], // 注入配置服务以便读取配置文件中的内容
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          keepConnectionAlive: true,
          synchronize: false,
          entities: [`${__dirname}/**/*.entity{.ts,.js}`], // 加载所有的实体文件
          autoLoadEntities: true,
          connectorPackage: 'mysql2',
          extra: {
            authPlugin: 'sha256_password',
          },
          ...configService.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


```
 
在可视化软件中创建数据库
```sql
CREATE DATABASE meeting_room_booking_system DEFAULT CHARACTER SET utf8mb4;
```

## 3.4 用户模块创建
在 src/modules/system下创建用户模块、
```js 
// 快速创建用户curd模块且不生成测试文件
$ nest g resource user --no-spec

```
根据设计的数据库表结构、创建对应的实体类。在 src/user/entities 目录，新建 3 个实体 User、Role、Permission。这里表的关系指定了、而不是

**用户表**
```js    
// user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    comment: '用户名',
  })
  username: string;

  @Column({
    length: 50,
    comment: '密码',
  })
  password: string;

  @Column({
    name: 'nick_name',
    length: 50,
    comment: '昵称',
  })
  nickName: string;

  @Column({
    comment: '邮箱',
    length: 50,
  })
  email: string;

  @Column({
    comment: '头像',
    length: 100,
    nullable: true,
  })
  headPic: string;

  @Column({
    comment: '手机号',
    length: 20,
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    comment: '是否冻结',
    default: false,
  })
  isFrozen: boolean;

  @Column({
    comment: '是否是管理员',
    default: false,
  })
  isAdmin: boolean;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
  })
  roles: Role[];
}



```

**角色表**
```js
// role.entity.ts
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity({
  name: 'roles',
})
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
    comment: '角色名',
  })
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
  })
  permissions: Permission[];
}

```


**权限表**
```js     
// permission.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'permissions',
})
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
    comment: '权限代码',
  })
  code: string;

  @Column({
    length: 100,
    comment: '权限描述',
  })
  description: string;
}

```

## 3.5 swagger 接口文档配置
```bash
$ pnpm install --save @nestjs/swagger

```
在 main.ts 中引入 SwaggerModule

```js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('会议室预定系统')
    .setDescription('练手项目')
    .setVersion('1.0')
    .addBearerAuth() // 接口增加token认证
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs.json',// json文档地址
  }); // 设置访问接口地址--> http://localhost:PORT/api-docs#/ 查看swagger文档
  await app.listen(3000);
}
bootstrap();


```

## 3.6 用户模块接口编写
user 模块有以下接口：

| 接口路径 | 	请求方式	| 描述 | 
| :---        |    :----:   |          ---: |
| /user/login                | 	POST	| 普通用户登录 | 
| /user/register             | 	POST	| 普通用户注册 | 
| /user/update               | 	POST	| 普通用户个人信息修改 | 
| /user/update_password      | 	POST	| 普通用户修改密码 | 
| /user/admin/login| 	POST|	管理员登录 | 
| /user/admin/update_password| 	POST| 	管理员修改密码 | 
| /user/admin/update | 	POST| 	管理员个人信息修改 | 
| /user/list| 	GET	| 用户列表 | 
| /user/freeze| 	GET| 	冻结用户 | 

## 3.7 添加 ValidationPipe，来对请求数据做校验。
使用 class-validator class-transformer 包创建全局校验管道。
它作用是验证，要么返回值不变，要么抛出异常。

安装依赖并在 src/common/pipe 目录下创建全局验证管道。
```bash
$ pnpm install --save class-validator class-transformer
$ nest g pi common/pipes/validation-pipe --no-spec

```
校验管道实现逻辑
```js
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator'; // 引入验证模块
import { plainToInstance } from 'class-transformer'; // 引入转换模块

@Injectable()
export class ValidationPipePipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // 如果没有传入验证规则，则不验证，直接返回数据
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    // plainToInstance 方法将普通的 JavaScript 参数对象转换为可验证的 dto class 的实例对象。
    const object = plainToInstance(metatype, value);
    // 调用 class-validator 包的 validate api 对它做验证。如果验证不通过，就抛一个异常。
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException(`Validation failed: ${errors}`);
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// 在main.ts中全局注册
app.useGlobalPipes(new ValidationPipe());
```


## 3.8 封装 redis 缓存模块
用户注册的逻辑是先从 redis 缓存中查询是否有跟发送给的邮箱匹配的验证码，有则进入下一步查询用户名是否在数据库中存在，没有(验证码过期或输入错误)报错。所以这里我们先封装一个 redis 模块方便复用。

```bash  
# 安装依赖
$ pnpm install --save redis
# 在 modules/redis 目录下
$ nest g module modules/redis
$ nest g service modules/redis --no-spec

```
将redis 模块声明为全局模块这样只需要在 AppModule 里引入，别的模块不用引入也可以注入 RedisService 了。并且通过动态模块的方式注入全局配置

```js
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
          socket: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
        });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService], // 记得导出
})
export class RedisModule {}

import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  /**
   * 注入 redisClient
   */
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  /**
   * @param key 键值
   * @returns 键值对应的值
   */
  async get(key: string) {
    return await this.redisClient.get(key);
  }

  /**
   * @param key 键值
   * @param value 键值对应的值
   * @param expire 过期时间
   * @returns
   */
  async set(key: string, value: string | number, expire?: number) {
    await this.redisClient.set(key, value, { EX: expire });
  }
}

```

## 3.9 封装邮箱发送模块
在注册和找回密码时使用、需发送邮件，所以这里我们封装一个发送邮件的模块。
这里以配置腾讯QQ邮箱为例。

```bash
$ pnpm install --save nodemailer
# 官网 https://nodemailer.com
$ nest g  resource modules/email --no-spec

```

```js
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [
    EmailService,
    {
      provide: 'EMAIL_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const emailService = createTransport({
          host: configService.get('email.host'),
          port: configService.get('email.port'),
          service: configService.get('email.service'),
          secure: configService.get('email.secure'),
          auth: {
            user: configService.get('email.user'),
            pass: configService.get('email.pass'), //授权码
          },
        });
        return emailService;
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  // 注入 email 模块
  @Inject('EMAIL_SERVICE') private transporter: Transporter;
  // 获取配置
  constructor(private readonly configService: ConfigService) {}

  /**
   * 发送邮件
   * @param to 收件人邮箱地址
   * @param subject 邮件主题(标题)
   * @param html 邮件内容
   */
  async sendMail({ to, subject, html }) {
    const address = this.configService.get('email.user');
    await this.transporter.sendMail({
      from: {
        name: '会议室预定系统', // 发件人名称
        address, // 注意发件人邮箱地址是自己配置了SMTP的那个邮箱地址
      },
      to,
      subject,
      html,
    });
  }
}

// 需要的地方注入EmailService调用sendMail方法即可。
```


## 3.10 登录功能实现
我们使用jwt和password策略实现、并也是抽离成一个身份认证模块。
```bash
$ pnpm install --save @nestjs/jwt
#  使用Passport集成身份验证库-无论用那种策略都需要这两个包
$ pnpm install --save @nestjs/passport passport 
# 我们使用 passport-jwt 策略
$ pnpm install --save passport-jwt
# ts
$ pnpm install --save-dev @types/passport-jwt

# 创建一个认证模块并声明为全局-
$ nest g module modules/auth --no-spec
$ nest g service modules/auth --no-spec

# 安装 uuid 用来生成一个唯一的id值
$ pnpm install --save uuid

```

异步配置 jwt服务

```js

```

##
##