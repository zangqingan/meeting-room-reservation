import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PERMISSION_KEY } from 'src/common/decorators/requirePermissions/requirePermissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      return true;
    }

    // 获取用户拥有的权限列表
    const permissions = request.user.user.permissions;

    // 查看当前接口需要哪些权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      IS_PERMISSION_KEY,
      [context.getClass(), context.getHandler()],
    );
    // console.log('requiredPermissions', requiredPermissions);
    // 如果没有权限要求，则直接放行
    if (!requiredPermissions) {
      return true;
    }

    // 遍历权限要求，判断用户是否拥有该权限
    for (let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i];
      const found = permissions.find((item) => item.code === curPermission);
      if (!found) {
        throw new UnauthorizedException('您没有访问该接口的权限');
      }
    }

    return true;
  }
}
