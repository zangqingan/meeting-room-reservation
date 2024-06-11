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
    jsonDocumentUrl: 'api-docs.json', // json文档地址
  }); // 设置访问接口地址--> http://localhost:PORT/api-docs#/ 查看swagger文档
  await app.listen(3000);
}
bootstrap();
