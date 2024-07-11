/**
 * 数据返回拦截器-统一的异常处理器-在错误发生时做一个统一的过滤处理后再返回给前端。
 * 使用nest异常类就会进入这里。
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // 获取请求上下文
    const response = ctx.getResponse<Response>(); // 获取请求上下文中的 response对象
    const status = exception.getStatus(); // 获取异常状态码
    // 设置错误信息,没有时根据状态码值返回
    const message = exception.message
      ? exception.message
      : `${status >= 500 ? 'Service Error' : 'Client Error'}`;
    // 定义返回数据对象
    const errorResponse = {
      data: {},
      message: message,
      code: status,
      timestamp: new Date().toISOString(),
    };

    // 设置返回的状态码， 请求头，错误信息
    response
      .status(status)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(errorResponse);
  }
}
