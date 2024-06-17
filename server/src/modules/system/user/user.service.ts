import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RedisService } from 'src/modules/redis/redis.service';
import { CacheEnum } from 'src/common/enum';

import { CreateUserDto, UpdateUserDto, RegisterUserDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(User) private userRepository: Repository<User>,
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
    try {
      await this.userRepository.create(user);
      return '注册成功';
    } catch (error) {
      throw new HttpException(`注册失败${error}`, HttpStatus.BAD_REQUEST);
    }
  }
}
