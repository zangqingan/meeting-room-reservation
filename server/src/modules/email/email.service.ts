import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  // 注入 email 模块
  @Inject('EMAIL_SERVICE') private transporter: Transporter;
  // 获取配置
  constructor(private readonly configService: ConfigService) {}

  /**
   * 发送邮件
   * @param to 收件人邮箱地址
   * @param subject 邮件主题(标题)
   * @param html 邮件内容
   */
  async sendMail({ to, subject, html }) {
    const address = this.configService.get('email.user');
    console.log('address', address);
    await this.transporter.sendMail({
      from: {
        name: '会议室预定系统', // 发件人名称
        address, // 注意发件人邮箱地址是自己配置了SMTP的那个邮箱地址
      },
      to,
      subject,
      html,
    });
  }
}
