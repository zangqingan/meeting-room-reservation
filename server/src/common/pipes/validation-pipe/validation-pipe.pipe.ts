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
