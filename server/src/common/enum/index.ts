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
 * @description UPDATE_PASSWORD_CAPTCHA_KEY = 'update_password_captcha_:' 发送修改信息邮箱验证码 redis key
 * @description UPDATE_USER_CAPTCHA_KEY = 'update_user_captcha_:' 发送修改信息邮箱验证码 redis key
 * @description LOGIN_TOKEN_KEY = 'login_tokens:' 登录用户 redis key
 */
export enum CacheEnum {
  CAPTCHA_KEY = 'captcha_:',
  UPDATE_PASSWORD_CAPTCHA_KEY = 'update_password_captcha_:',
  UPDATE_USER_CAPTCHA_KEY = 'update_user_captcha_:',
  LOGIN_TOKEN_KEY = 'login_tokens:',
}

/**
 * 权限枚举
 * @description access = 'access' 访问权限
 * @description change = 'change' 修改权限
 */
export enum PermissionEnum {
  access = 'access',
  change = 'change',
}

export enum UrgeEnum {
  URGE = 'urge_',
  ADMIN_EMAIL = 'admin_email',
}
