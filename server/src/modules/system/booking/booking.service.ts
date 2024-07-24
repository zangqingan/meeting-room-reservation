import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { CreateBookingDto } from './dto';
import { UrgeEnum } from 'src/common/enum';

import { RedisService } from 'src/modules/redis/redis.service';
import { EmailService } from 'src/modules/email/email.service';

import { MeetingRoom } from '../meeting-room/entities/meeting-room.entity';
import { User } from '../user/entities/user.entity';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(MeetingRoom)
    private readonly meetingRoomRepository: Repository<MeetingRoom>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 初始化数据
   * @returns
   */
  async init() {
    const user1 = await this.userRepository.findOneBy({
      id: 2,
    });
    const user2 = await this.userRepository.findOneBy({
      id: 4,
    });
    const room1 = await this.meetingRoomRepository.findOneBy({
      id: 1,
    });
    const room2 = await this.meetingRoomRepository.findOneBy({
      id: 5,
    });
    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.bookingRepository.save([booking1, booking2, booking3, booking4]);
    return '初始化数据成功';
  }

  /**
   * 预定列表查询
   * @param pageNo
   * @param pageSize
   * @param username
   * @param meetingRoomName
   * @param meetingRoomPosition
   * @param bookingTimeRangeStart
   * @param bookingTimeRangeEnd
   * @returns
   */
  async find(
    pageNo: number,
    pageSize: number,
    username: string,
    meetingRoomName: string,
    meetingRoomPosition: string,
    bookingTimeRangeStart: number,
    bookingTimeRangeEnd: number,
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.user = {
        username: Like(`%${username}%`),
      };
    }

    if (meetingRoomName) {
      condition.room = {
        name: Like(`%${meetingRoomName}%`),
      };
    }

    if (meetingRoomPosition) {
      if (!condition.room) {
        condition.room = {};
      }
      condition.room.location = Like(`%${meetingRoomPosition}%`);
    }

    if (bookingTimeRangeStart) {
      if (!bookingTimeRangeEnd) {
        bookingTimeRangeEnd = bookingTimeRangeStart + 60 * 60 * 1000;
      }
      condition.startTime = Between(
        new Date(bookingTimeRangeStart),
        new Date(bookingTimeRangeEnd),
      );
    }

    const [bookings, totalCount] = await this.bookingRepository.findAndCount({
      where: condition,
      relations: {
        user: true,
        room: true,
      },
      skip: skipCount,
      take: pageSize,
    });

    return {
      bookings: bookings.map((item) => {
        delete item.user.password;
        return item;
      }),
      totalCount,
    };
  }

  /**
   * 新增会议室
   * @param userId 用户id
   * @param bookingDto 新增会议室dto
   */
  async add(userId: number, bookingDto: CreateBookingDto) {
    // 检查要预约的会议室是否存在
    const meetingRoom = await this.meetingRoomRepository.findOneBy({
      id: bookingDto.meetingRoomId,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    // 找出预约人具体信息
    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    const booking = new Booking();
    booking.room = meetingRoom;
    booking.user = user;
    booking.startTime = new Date(bookingDto.startTime);
    booking.endTime = new Date(bookingDto.endTime);
    booking.note = bookingDto.note;

    // 查看是否有重叠
    const res = await this.bookingRepository.findOneBy({
      room: {
        id: meetingRoom.id,
      },
      startTime: LessThanOrEqual(booking.startTime),
      endTime: MoreThanOrEqual(booking.endTime),
    });

    if (res) {
      throw new BadRequestException('该时间段已被预定');
    }

    await this.bookingRepository.save(booking);
  }

  /**
   * 审批通过
   * @param id
   * @returns
   */
  async apply(id: number) {
    await this.bookingRepository.update(
      {
        id,
      },
      {
        status: '审批通过',
      },
    );
    return '审批通过';
  }

  /**
   * 审批驳回
   * @param id
   * @returns
   */
  async reject(id: number) {
    await this.bookingRepository.update(
      {
        id,
      },
      {
        status: '审批驳回',
      },
    );
    return '审批驳回';
  }

  /**
   * 解绑
   * @param id
   * @returns
   */
  async unbind(id: number) {
    await this.bookingRepository.update(
      {
        id,
      },
      {
        status: '已解除',
      },
    );
    return '已解除';
  }

  /**
   * 催办
   * @param id
   * @returns
   */
  async urge(id: number) {
    // 是否已催办标志
    const flag = await this.redisService.get(`${UrgeEnum.URGE}${id}`);
    if (flag) {
      return '半小时内只能催办一次，请耐心等待';
    }

    // 查找管理员的邮箱
    let email = await this.redisService.get(`${UrgeEnum.ADMIN_EMAIL}`);

    if (!email) {
      const admin = await this.userRepository.findOne({
        select: {
          email: true,
        },
        where: {
          isAdmin: true,
        },
      });

      email = admin.email;

      await this.redisService.set(
        `${UrgeEnum.ADMIN_EMAIL}`,
        admin.email,
        10 * 60,
      );
    }

    await this.emailService.sendMail({
      to: email,
      subject: '预定申请催办提醒',
      html: `id 为 ${id} 的预定申请正在等待审批`,
    });

    await this.redisService.set(`${UrgeEnum.URGE}${id}`, 1, 60 * 30);
    return {
      message: '催办成功',
    };
  }
}
