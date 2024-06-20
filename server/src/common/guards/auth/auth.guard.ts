import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // 获取自定义的元数据
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config'; //获取配置
import { pathToRegexp } from 'path-to-regexp';

import { IS_PUBLIC_KEY } from 'src/common/decorators/public/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 定义全局白名单
  private globalWhiteList = [];
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    super();
    // 初始化默认全局白名单
    this.globalWhiteList = [].concat(
      this.configService.get('permission.router.whitelist') || [],
    );
  }

  /**
   * 守卫方法
   * @param context 和 CanActivate 接口一致
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<any> {
    // 判断是否在白名单列表
    const isInWhiteList = this.checkWhiteList(context);
    if (isInWhiteList) {
      return true;
    }

    // 判断是否是公开的接口是直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 获取指定环境请求对象
    const request = context.switchToHttp().getRequest();
    // 从请求头中获取token
    const accessToken = this.extractTokenFromHeader(request);
    // 没有token直接抛出异常
    if (!accessToken) {
      throw new ForbiddenException('没有token、请重新登录');
    }
    // 扩展守卫，通过策略 jwt.strategy.ts Passport在验证阶段会自动对token进行校验
    return await super.canActivate(context);
  }

  /**
   *
   * @param request 请求对象
   * @returns
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * 检查接口是否在白名单内
   * @param context
   * @returns true/false
   */
  private checkWhiteList(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const i = this.globalWhiteList.findIndex((route) => {
      // 请求方法类型相同
      if (request.method.toUpperCase() === route.method.toUpperCase()) {
        // 对比 url
        return !!pathToRegexp(route.path).exec(request.url);
      }
      return false;
    });
    // 在白名单内 则 进行下一步， i === -1 ，则不在白名单，需要比对是否有当前接口权限
    return i > -1;
  }
}
