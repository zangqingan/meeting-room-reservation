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
import {
  CreateUserDto,
  UpdateUserDto,
  RegisterUserDto,
  LoginUserDto,
} from './dto';

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

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @ApiOperation({ summary: '普通刷新token' })
  @ApiQuery({ name: 'refreshToken', required: true })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    return await this.userService.refreshToken(refreshToken, false);
  }

  @ApiOperation({ summary: '管理员用户刷新token' })
  @ApiQuery({ name: 'refreshToken', required: true })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    return await this.userService.refreshToken(refreshToken, true);
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
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto);
  }

  @ApiOperation({ summary: '普通用户登录' })
  @ApiBody({ required: true, type: LoginUserDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    return await this.userService.login(loginUser, false);
  }

  @ApiOperation({ summary: '管理员用户登录' })
  @ApiBody({ required: true, type: LoginUserDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    return await this.userService.login(loginUser, true);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
