import { SetMetadata } from '@nestjs/common';

/**
 * @Public() 装饰器，用来声明哪些路由是公开的
 * 我们可以将其用于装饰任何方法。
 */
export const IS_PUBLIC_KEY = 'isPublic'; // 元数据键
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
