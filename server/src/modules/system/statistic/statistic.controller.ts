import { Controller, Get, Query } from '@nestjs/common';

import { StatisticService } from './statistic.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('统计模块')
@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @ApiOperation({ summary: '统计用户预约次数' })
  @ApiQuery({ name: 'startTime', description: '开始时间' })
  @ApiQuery({ name: 'endTime', description: '结束时间' })
  @Get('userBookingCount')
  async userBookingCount(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime,
  ) {
    return this.statisticService.userBookingCount(startTime, endTime);
  }

  @ApiOperation({ summary: '统计会议室被使用次数' })
  @ApiQuery({ name: 'startTime', description: '开始时间' })
  @ApiQuery({ name: 'endTime', description: '结束时间' })
  @Get('meetingRoomUsedCount')
  async meetingRoomUsedCount(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime,
  ) {
    return this.statisticService.meetingRoomUsedCount(startTime, endTime);
  }
}
