// 全局通用枚举类型

// 环境变量枚举

/**
 * 环境变量枚举
 * @description test = 'test' 测试配置
 * @description production = 'prod' 生产配置
 * @description development = 'dev' 开发配置
 */
export enum EnvEnum {
  test = 'test',
  production = 'prod',
  development = 'dev',
}

/**
 * redis缓存的 key
 * @description CAPTCHA_KEY = 'captcha_:' 发送邮箱验证码 redis key
 * @description LOGIN_TOKEN_KEY = 'login_tokens:' 登录用户 redis key
 */
export enum CacheEnum {
  CAPTCHA_KEY = 'captcha_:',
  LOGIN_TOKEN_KEY = 'login_tokens:',
}
