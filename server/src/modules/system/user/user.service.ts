import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { RedisService } from 'src/modules/redis/redis.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { CacheEnum } from 'src/common/enum';
import { md5, generateUUID } from 'src/common/utils';
import { LoginUserVo } from './vo/index';

import {
  UpdateUserDto,
  RegisterUserDto,
  LoginUserDto,
  UpdateUserPasswordDto,
} from './dto';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly redisService: RedisService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * @param userId 用户id
   *
   */
  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `${CacheEnum.UPDATE_USER_CAPTCHA_KEY}${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }
    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    try {
      await this.userRepository.save(foundUser);
      return '用户信息修改成功';
    } catch (e) {
      throw new HttpException(`${e}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * @param id 删除用户id
   */
  async remove(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    user.isFrozen = true;
    await this.userRepository.save(user);
  }

  /**
   * 冻结用户
   */
  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    user.isFrozen = true;
    await this.userRepository.save(user);
  }

  /**
   * 用户列表
   */
  async findUsers(
    username: string,
    nickName: string,
    email: string,
    pageNo: number,
    pageSize: number,
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`);
    }
    if (email) {
      condition.email = Like(`%${email}%`);
    }

    const [users, totalCount] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nickName',
        'email',
        'phoneNumber',
        'isFrozen',
        'headPic',
        'createTime',
      ],
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      users,
      totalCount,
    };
  }

  /**
   * 注册
   * @param user
   */
  async register(user: RegisterUserDto) {
    // 判断验证码是否存在和是否正确
    const isExitCaptcha = await this.redisService.get(
      `${CacheEnum.CAPTCHA_KEY}${user.email}`,
    );
    if (!isExitCaptcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }
    if (isExitCaptcha !== user.captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }
    // 验证码检验通过、查看用户名是否已被注册
    const foundUser = await this.userRepository.findOne({
      where: { username: user.username },
    });
    if (foundUser) {
      throw new HttpException('用户名已被注册', HttpStatus.BAD_REQUEST);
    }

    user.password = md5(user.password);
    try {
      await this.userRepository.save(user);
      return '注册成功';
    } catch (error) {
      throw new HttpException(`注册失败${error}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 登录
   * @param loginUserDto
   * @param isAdmin
   * @returns
   */
  async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== md5(loginUserDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };

    // 生成 accessToken
    const uuid = generateUUID();
    vo.accessToken = await this.authService.createToken({
      uuid,
      userId: vo.userInfo.id,
    });

    // 生成 refreshToken
    vo.refreshToken = await this.authService.createToken(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn: this.configService.get('jwt.refreshExpiresIn') || '7d',
      },
    );
    // 登录信息存redis
    const cacheData = {
      token: uuid,
      user: vo.userInfo,
      userId: vo.userInfo.id,
      username: vo.userInfo.username,
    };
    await this.redisService.set(
      `${CacheEnum.LOGIN_TOKEN_KEY}${uuid}`,
      JSON.stringify(cacheData),
      60 * 60 * 24,
    );
    return vo;
  }

  /**
   * 刷新 token
   * @param token
   */
  async refreshToken(token: string, isAdmin: boolean = false) {
    try {
      // 解析 token 获取用户id
      const data = await this.authService.parseToken(token);
      const user = await this.findUserById(data.userId, isAdmin);

      // 重新生成两个token
      const access_token = await this.authService.createToken(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn: this.configService.get('jwt.EXPIRES_IN') || '30m',
        },
      );

      const refresh_token = await this.authService.createToken(
        {
          userId: user.id,
        },
        {
          expiresIn: this.configService.get('jwt.refreshExpiresIn') || '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  /**
   * @param userId 用户id
   * @param isAdmin 是否是管理员
   * @returns
   */
  async findUserById(userId: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }

  /**
   * 查找用户详情
   */
  async findUserDetail(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    return user;
  }

  /**
   * 更新密码
   */
  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `${CacheEnum.UPDATE_PASSWORD_CAPTCHA_KEY}${passwordDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });
    foundUser.password = md5(passwordDto.password);

    try {
      await this.userRepository.save(foundUser);
      return '密码修改成功';
    } catch (e) {
      throw new HttpException(`密码修改失败${e}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 初始化数据
   */
  async initData() {
    const user1 = new User();
    user1.username = 'zangqingan';
    user1.password = md5('123456');
    user1.email = '18365989748@163.com';
    user1.isAdmin = true;
    user1.nickName = '藏青安';
    user1.phoneNumber = '18365989748';

    const user2 = new User();
    user2.username = '巧巧';
    user2.password = md5('123456');
    user2.email = '18636959894@yy.com';
    user2.nickName = '巧';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'access';
    permission1.description = 'access 访问接口';

    const permission2 = new Permission();
    permission2.code = 'change';
    permission2.description = 'change 修改接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
    return 'done';
  }
}
