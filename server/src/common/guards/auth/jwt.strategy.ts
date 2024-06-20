import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Injectable } from '@nestjs/common';
import { RedisService } from 'src/modules/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

/**
 * jwt 解码策略，验证是否携带token，
 * 注册为提供者之后，Passport 首先验证 JWT 的签名并解码 JSON。
 * 然后它调用我们的 validate() 方法，将解码的 JSON 作为其单个参数传递。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 这里的构造函数向父类传递了授权时必要的参数，在实例化时，父类会得知授权时，客户端的请求必须使用 Authorization 作为请求头，
   * 而这个请求头的内容前缀也必须为 Bearer，在解码授权令牌时，使用秘钥 secretOrKey: 'secretKey' 来将授权令牌解码为创建令牌时的 payload。
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.SECRET'), // 要和我们注册jwt服务时一样，这时自动对token解密了。
    } as StrategyOptions);
  }

  /**
   * validate 方法实现了父类的抽象方法，在解密授权令牌成功后，即本次请求的授权令牌是没有过期的，
   * 此时会将解密后的 payload 作为参数传递给 validate 方法，这个方法需要做具体的授权逻辑，比如这里我使用了通过用户名查找用户是否存在。
   * 当用户不存在时，说明令牌有误，可能是被伪造了，此时需抛出 UnauthorizedException 未授权异常。
   * 当用户存在时，会将 user 对象添加到 req 中，在之后的 req 对象中，可以使用 req.user 获取当前登录用户。
   */
  async validate(payload: { uuid: string; userId: number; iat: Date }) {
    // 从redis中获取缓存的用户信息
    const user = await this.redisService.get(
      `${CacheEnum.LOGIN_TOKEN_KEY}${payload.uuid}`,
    );
    // 如果用用户信息，代表 token 没有过期，没有则 token 已失效
    if (!user) throw new UnauthorizedException('登录已过期，请重新登录');
    //  可以使用 req.user 获取当前登录用户信息
    return JSON.parse(user);
  }
}
