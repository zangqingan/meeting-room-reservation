import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ValidationPipePipe } from 'src/common/pipes/validation-pipe/validation-pipe.pipe';
import { TransformInterceptor } from 'src/common/interceptors/transform/transform.interceptor';
import { InvokeRecordInterceptor } from 'src/common/interceptors/invoke-record/invoke-record.interceptor';
import { HttpExceptionFilter } from 'src/common/filter/http-exception/http-exception.filter';
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
    jsonDocumentUrl: 'api-docs.json', // json文档地址--> http://localhost:3000/api-docs.json
  }); // 设置访问接口地址--> http://localhost:PORT/api-docs#/ 查看swagger文档

  app.useGlobalPipes(new ValidationPipePipe()); // 全局注册参数验证管道
  app.useGlobalInterceptors(new InvokeRecordInterceptor()); // 注册接口访问记录拦截器
  app.useGlobalInterceptors(new TransformInterceptor()); // 注册全局返回响应拦截器
  app.useGlobalFilters(new HttpExceptionFilter()); // 注册全局异常过滤器

  await app.listen(3000);
}
bootstrap();
