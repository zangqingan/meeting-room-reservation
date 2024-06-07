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
## 3.2 配置mysql数据库连接

```bash
$ pnpm install --save @nestjs/typeorm typeorm mysql2


```

