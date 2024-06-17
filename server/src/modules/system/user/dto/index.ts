import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {}
export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class RegisterUserDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  username: string;

  @ApiProperty({ required: false })
  @IsNotEmpty({
    message: '昵称不能为空',
  })
  nickName: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: '密码不能为空',
  })
  @MinLength(6, {
    message: '密码不能少于 6 位',
  })
  password: string;

  @ApiProperty({ required: false })
  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  email: string;

  @ApiProperty({ required: false })
  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
