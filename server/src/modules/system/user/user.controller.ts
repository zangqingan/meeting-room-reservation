import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EmailService } from 'src/modules/email/email.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { CacheEnum } from 'src/common/enum';

import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, RegisterUserDto } from './dto';

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 给邮箱发送验证码
   */
  @Get('/register-captcha')
  @ApiOperation({ summary: '发送注册验证码' })
  @ApiQuery({ name: 'address', required: true, description: '邮箱地址' })
  async captcha(@Query('address') address: string) {
    console.log(address);
    const code = Math.random().toString().slice(2, 8);

    // 根据邮箱地址缓存对应的验证码
    await this.redisService.set(
      `${CacheEnum.CAPTCHA_KEY}${address}`,
      code,
      5 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ required: true, type: RegisterUserDto })
  @ApiResponse({ status: 200, description: '注册成功' })
  @Post('/register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.register(registerUserDto);
  }
}
