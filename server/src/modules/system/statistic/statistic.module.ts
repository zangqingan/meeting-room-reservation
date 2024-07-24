import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/modules/system/user/entities/user.entity';
import { Booking } from 'src/modules/system/booking/entities/booking.entity';
import { MeetingRoom } from 'src/modules/system/meeting-room/entities/meeting-room.entity';

import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking, MeetingRoom])],
  providers: [StatisticService],
  controllers: [StatisticController],
})
export class StatisticModule {}
