import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [
    EmailService,
    {
      provide: 'EMAIL_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const emailService = createTransport({
          host: configService.get('email.host'),
          port: configService.get('email.port'),
          service: configService.get('email.service'),
          secure: configService.get('email.secure'),
          auth: {
            user: configService.get('email.user'),
            pass: configService.get('email.pass'), //授权码
          },
        });
        console.log(emailService);
        return emailService;
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
