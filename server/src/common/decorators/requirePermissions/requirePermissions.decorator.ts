import { SetMetadata } from '@nestjs/common';

/**
 * @Permission() 装饰器，用来声明某个方法需要哪些权限才能访问
 * 我们可以将其用于装饰任何方法。
 */
export const IS_PERMISSION_KEY = 'permission'; // 元数据键
export const RequirePermissions = (...args: string[]) =>
  SetMetadata(IS_PERMISSION_KEY, args);
