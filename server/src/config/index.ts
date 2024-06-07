// 自定义配置文件
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

// 引入环境变量枚举类型
import { EnvEnum } from 'src/common/enum';

export default () => {
  return yaml.load(
    readFileSync(
      join(__dirname, `./${EnvEnum[process.env.NODE_ENV]}.yml`),
      'utf8',
    ),
  ) as Record<string, any>;
};
