/**
 * 通用工具类库
 */
import { v4 as uuidV4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * md5加密
 * @param str
 * @returns 密文
 */
export function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * 去掉短横线
 * @name:generateUUID
 * @description: 生成uuid
 * @returns:68acca5daafd4c70aad18c2a3f003afc
 */
export function generateUUID(): string {
  return uuidV4().replaceAll('-', '');
}
