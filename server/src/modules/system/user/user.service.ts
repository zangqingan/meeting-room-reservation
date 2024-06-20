import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RedisService } from 'src/modules/redis/redis.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { CacheEnum } from 'src/common/enum';
import { md5, generateUUID } from 'src/common/utils';
import { LoginUserVo } from './vo/index';

import {
  CreateUserDto,
  UpdateUserDto,
  RegisterUserDto,
  LoginUserDto,
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

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  /**
   * 注册
   * @param user
   */
  async register(user: RegisterUserDto) {
    console.log(user);
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

    return vo;
  }
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
  }
}
