import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  DefaultValuePipe,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from 'src/common/decorators/public/public.decorator';

import { MeetingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto';

@ApiTags('会议室管理模块')
@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @ApiOperation({ summary: '初始化会议室数据' })
  @Public()
  @Get('/init-data')
  async initData() {
    return this.meetingRoomService.initData();
  }

  @ApiOperation({ summary: '新建会议室' })
  @ApiBody({ type: CreateMeetingRoomDto })
  @Post('/create')
  async create(@Body() createMeetingRoomDto: CreateMeetingRoomDto) {
    return await this.meetingRoomService.create(createMeetingRoomDto);
  }

  @ApiOperation({ summary: '获取会议室列表' })
  @ApiQuery({ name: 'pageNo', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @Get('/list')
  async findAll(
    @Query('pageNo', new DefaultValuePipe(1), ParseIntPipe) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(2), ParseIntPipe) pageSize: number,
  ) {
    return await this.meetingRoomService.findAll(pageNo, pageSize);
  }

  @ApiOperation({ summary: '搜索会议室列表' })
  @ApiQuery({ name: 'pageNo', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'name', description: '会议室名称', required: false })
  @ApiQuery({ name: 'location', description: '会议室位置', required: false })
  @ApiQuery({ name: 'capacity', description: '会议室容量', required: false })
  @Get('/search')
  searchRoom(
    @Query('pageNo', new DefaultValuePipe(1), ParseIntPipe) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(2), ParseIntPipe) pageSize: number,
    @Query('name') name: string,
    @Query('capacity') capacity: number,
    @Query('equipment') equipment: string,
  ) {
    return this.meetingRoomService.searchRoom(
      pageNo,
      pageSize,
      name,
      capacity,
      equipment,
    );
  }

  @ApiOperation({ summary: '获取会议室详情' })
  @ApiParam({ name: 'id', description: '会议室id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingRoomService.findOne(+id);
  }

  @ApiOperation({ summary: '更新会议室' })
  @ApiParam({ name: 'id', description: '会议室id' })
  @ApiBody({ type: UpdateMeetingRoomDto })
  @Put('/update/:id')
  update(
    @Param('id') id: string,
    @Body() updateMeetingRoomDto: UpdateMeetingRoomDto,
  ) {
    return this.meetingRoomService.update(+id, updateMeetingRoomDto);
  }

  @ApiOperation({ summary: '删除会议室' })
  @ApiParam({ name: 'id', description: '会议室id' })
  @Delete('/delete/:id')
  remove(@Param('id') id: string) {
    return this.meetingRoomService.remove(+id);
  }
}
