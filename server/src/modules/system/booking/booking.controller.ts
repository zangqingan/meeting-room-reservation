import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto';

import { Public } from 'src/common/decorators/public/public.decorator';

@ApiTags('预定管理模块')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({ summary: '初始化数据' })
  @Public()
  @Get('init-data')
  async init() {
    return await this.bookingService.init();
  }

  @ApiOperation({ summary: '预定会议室列表' })
  @ApiQuery({
    name: 'pageNo',
    description: '页码',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页数量',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '预定人姓名',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'meetingRoomName',
    description: '预定会议室名称',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'meetingRoomPosition',
    description: '预定会议室位置',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'bookingTimeRangeStart',
    description: '预定开始时间',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'bookingTimeRangeEnd',
    description: '预定结束时间',
    required: false,
    type: Number,
  })
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), ParseIntPipe)
    pageNo: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart') bookingTimeRangeStart: number,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: number,
  ) {
    return this.bookingService.find(
      pageNo,
      pageSize,
      username,
      meetingRoomName,
      meetingRoomPosition,
      bookingTimeRangeStart,
      bookingTimeRangeEnd,
    );
  }

  @ApiOperation({ summary: '新增预约' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiBody({ type: CreateBookingDto })
  @Post('add')
  async add(@Query('userId') userId, @Body() booking: CreateBookingDto) {
    return await this.bookingService.add(userId, booking);
  }

  @ApiOperation({ summary: '审批通过' })
  @ApiParam({ name: 'id', required: true, description: '预约id' })
  @Get('apply/:id')
  async apply(@Param('id') id: number) {
    return this.bookingService.apply(id);
  }

  @ApiOperation({ summary: '审批驳回' })
  @ApiParam({ name: 'id', required: true, description: '预约id' })
  @Get('reject/:id')
  async reject(@Param('id') id: number) {
    return this.bookingService.reject(id);
  }

  @ApiOperation({ summary: '解除' })
  @ApiParam({ name: 'id', required: true, description: '预约id' })
  @Get('unbind/:id')
  async unbind(@Param('id') id: number) {
    return this.bookingService.unbind(id);
  }

  @ApiOperation({ summary: '催办' })
  @ApiParam({ name: 'id', required: true, description: '预约id' })
  @Get('urge/:id')
  async urge(@Param('id') id: number) {
    return this.bookingService.urge(id);
  }
}
