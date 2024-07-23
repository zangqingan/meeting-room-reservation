import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto';
import { MeetingRoom } from './entities/meeting-room.entity';

@Injectable()
export class MeetingRoomService {
  constructor(
    @InjectRepository(MeetingRoom)
    private readonly meetingRoomRepository: Repository<MeetingRoom>,
  ) {}

  /**
   * @param createMeetingRoomDto 创建会议室
   * @returns
   */
  async create(createMeetingRoomDto: CreateMeetingRoomDto) {
    // 重复性校验
    const isExitRoom = await this.meetingRoomRepository.findOneBy({
      name: createMeetingRoomDto.name,
    });
    console.log('isExitRoom', isExitRoom);
    if (isExitRoom) {
      throw new HttpException('会议室已存在', HttpStatus.BAD_REQUEST);
    }
    await this.meetingRoomRepository.insert(createMeetingRoomDto);
    return '新建会议室成功';
  }

  /**
   * 获取会议室列表
   * @param pageNo 页码
   * @param pageSize 每页数量
   * @returns 会议室列表结果
   */
  async findAll(pageNo, pageSize) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为 1');
    }
    const skipCount = (pageNo - 1) * pageSize;

    const [meetingRooms, totalCount] =
      await this.meetingRoomRepository.findAndCount({
        skip: skipCount,
        take: pageSize,
      });

    return {
      meetingRooms,
      totalCount,
    };
  }

  /**
   * @param id 会议室id
   * @returns
   */
  async findOne(id: number) {
    const result = await this.meetingRoomRepository.findOneBy({ id });
    if (!result) {
      throw new NotFoundException('会议室不存在');
    }
    return result;
  }

  /**
   * 更新会议室
   * @param id 会议室id
   * @param updateMeetingRoomDto 更新dto
   */
  async update(id: number, updateMeetingRoomDto: UpdateMeetingRoomDto) {
    const isExitRoom = await this.meetingRoomRepository.findOne({
      where: {
        id,
      },
    });
    if (isExitRoom) {
      const result = await this.meetingRoomRepository.update(id, {
        ...updateMeetingRoomDto,
      });
      return result;
    } else {
      throw new HttpException('会议室不存在', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * 删除会议室
   * @param id 会议室id
   * @returns
   */
  remove(id: number) {
    return `This action removes a #${id} meetingRoom`;
  }

  /**
   * 查询会议室列表
   * @param pageNo
   * @param pageSize
   * @param name
   * @param capacity
   * @param equipment
   * @returns
   */
  async searchRoom(pageNo, pageSize, name, capacity, equipment) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为 1');
    }
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }
    if (capacity) {
      condition.capacity = capacity;
    }

    const [meetingRooms, totalCount] =
      await this.meetingRoomRepository.findAndCount({
        skip: skipCount,
        take: pageSize,
        where: condition,
      });

    return {
      meetingRooms,
      totalCount,
    };
  }

  /**
   * 初始化数据
   */
  async initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    await this.meetingRoomRepository.save([room1, room2, room3]);
    return '初始化数据成功';
  }
}
