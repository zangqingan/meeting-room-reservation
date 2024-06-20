import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   *
   * @param payload 加密的数据
   * @param options sign其它可选配置项
   * @returns token
   */
  async createToken(payload, options?): Promise<string> {
    return this.jwtService.sign(payload, options);
  }

  /**
   * 从令牌中获取数据声明，在使用jwt策略时会自动解密token并验证
   * @param token 令牌
   * @return 数据声明
   */
  async parseToken(token: string) {
    try {
      return await this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException(`token 失效，请重新登录${error}`);
    }
  }
}
