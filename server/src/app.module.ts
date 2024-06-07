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
