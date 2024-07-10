import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 引入内置配置模块实现配置动态读取
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core'; // 全局注册守卫

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/system/user/user.module';
import { RedisModule } from './modules/redis/redis.module';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/auth/auth.guard';
import { PermissionGuard } from './common/guards/permission/permission.guard';
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
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          keepConnectionAlive: true,
          synchronize: true,
          entities: [`${__dirname}/**/*.entity{.ts,.js}`], // 加载所有的实体文件
          autoLoadEntities: true,
          connectorPackage: 'mysql2',
          ...configService.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    UserModule,
    RedisModule,
    EmailModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
