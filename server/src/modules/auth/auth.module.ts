import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { JwtStrategy } from 'src/common/guards/auth/jwt.strategy'; //导入jwt策略作为提供者

@Global()
@Module({
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
