import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

import { Public } from 'src/common/decorators/public/public.decorator';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
