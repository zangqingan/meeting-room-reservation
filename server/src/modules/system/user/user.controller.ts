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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermissions } from 'src/common/decorators/requirePermissions/requirePermissions.decorator';
import { Public } from 'src/common/decorators/public/public.decorator';
import { EmailService } from 'src/modules/email/email.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { UserService } from './user.service';
import { CacheEnum } from 'src/common/enum';

import {
  UpdateUserDto,
  RegisterUserDto,
  LoginUserDto,
  UpdateUserPasswordDto,
} from './dto';
import { UserDetailVo } from './vo';

@ApiTags('用户模块')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  @ApiOperation({ summary: '发送注册验证码' })
  @ApiQuery({ name: 'address', required: true, description: '验证码接收邮箱' })
  @Public()
  @Get('/register-captcha')
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
  @ApiQuery({ name: 'address', required: true, description: '验证码接收邮箱' })
  @Public()
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
  @ApiQuery({ name: 'address', required: true, description: '验证码接收邮箱' })
  @Public()
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

  @ApiOperation({ summary: '初始化数据' })
  @Get('init-data')
  async initData() {
    await this.userService.initData();
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
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiQuery({ name: 'id', required: true })
  @Post(['update', 'admin/update'])
  async update(@Query('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'pageNo', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'nickName', required: false })
  @ApiQuery({ name: 'email', required: false })
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

  @ApiOperation({ summary: '用户删除' })
  @ApiParam({ name: 'id', description: '用户id' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
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
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    return await this.userService.login(loginUser, false);
  }

  @ApiOperation({ summary: '管理员用户登录' })
  @ApiBody({ required: true, type: LoginUserDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @Public()
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
  @ApiBody({ type: UpdateUserPasswordDto })
  @ApiQuery({ name: 'userId', description: '用户id' })
  @Post(['update_password', 'admin/update_password'])
  async updatePassword(
    @Query('userId') userId: string,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(+userId, passwordDto);
  }

  @ApiOperation({ summary: '冻结用户' })
  @ApiQuery({ name: 'id', description: '用户id' })
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
  }
}
