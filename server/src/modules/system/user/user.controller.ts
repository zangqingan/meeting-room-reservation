import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
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
import { UserService } from './user.service';
import { CacheEnum } from 'src/common/enum';

import {
  CreateUserDto,
  UpdateUserDto,
  RegisterUserDto,
  LoginUserDto,
  UpdateUserPasswordDto,
} from './dto';
import { UserDetailVo } from './vo';
import { Public } from 'src/common/decorators/public/public.decorator';
import { RequirePermissions } from 'src/common/decorators/requirePermissions/requirePermissions.decorator';

@ApiTags('用户模块')
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
  @ApiOperation({ summary: '发送注册验证码' })
  @Public()
  @Get('/register-captcha')
  @ApiQuery({ name: 'address', required: true, description: '邮箱地址' })
  async captcha(@Query('address') address: string) {
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

  @ApiOperation({ summary: '发送修改密码验证码' })
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `${CacheEnum.UPDATE_PASSWORD_CAPTCHA_KEY}${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  @ApiOperation({ summary: '发送修改用户信息验证码' })
  @Get('update/captcha')
  async updateCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `${CacheEnum.UPDATE_USER_CAPTCHA_KEY}${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: '初始化数据' })
  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @ApiOperation({ summary: '普通刷新token' })
  @ApiQuery({ name: 'refreshToken', required: true })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @RequirePermissions('access')
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

  @ApiOperation({ summary: '更改用户信息' })
  @Post(['update', 'admin/update'])
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: '获取用户列表' })
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), ParseIntPipe) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(2), ParseIntPipe) pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUsers(
      username,
      nickName,
      email,
      pageNo,
      pageSize,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ required: true, type: RegisterUserDto })
  @ApiResponse({ status: 200, description: '注册成功' })
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto);
  }

  @ApiOperation({ summary: '普通用户登录' })
  @ApiBody({ required: true, type: LoginUserDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @Public()
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

  @ApiOperation({ summary: '获取用户详情信息' })
  @Get('info')
  async info(@Req() request: any) {
    const user = await this.userService.findUserDetail(request.user?.userId);
    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.headPic;
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  @ApiOperation({ summary: '修改密码' })
  @Post(['update_password', 'admin/update_password'])
  async updatePassword(
    @Param('userId') userId: string,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(+userId, passwordDto);
  }

  @ApiOperation({ summary: '冻结用户' })
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }
}
