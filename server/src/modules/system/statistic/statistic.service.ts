import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MeetingRoom } from 'src/modules/system/meeting-room/entities/meeting-room.entity';
import { Booking } from 'src/modules/system/booking/entities/booking.entity';
import { User } from 'src/modules/system/user/entities/user.entity';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * 用户预约次数统计
   * @param startTime
   * @param endTime
   * @returns
   */
  async userBookingCount(startTime: string, endTime: string) {
    const res = await this.bookingRepository
      .createQueryBuilder('b')
      .select('u.id', 'userId')
      .addSelect('u.username', 'username')
      .leftJoin(User, 'u', 'b.userId = u.id')
      .addSelect('count(1)', 'bookingCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      .addGroupBy('b.user')
      .getRawMany();
    return res;
  }

  /**
   * 会议室预定统计
   * @param startTime
   * @param endTime
   * @returns
   */
  async meetingRoomUsedCount(startTime: string, endTime: string) {
    const res = await this.bookingRepository
      .createQueryBuilder('b')
      .select('m.id', 'meetingRoomId')
      .addSelect('m.name', 'meetingRoomName')
      .leftJoin(MeetingRoom, 'm', 'b.roomId = m.id')
      .addSelect('count(1)', 'usedCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      .addGroupBy('b.roomId')
      .getRawMany();
    return res;
  }
}
