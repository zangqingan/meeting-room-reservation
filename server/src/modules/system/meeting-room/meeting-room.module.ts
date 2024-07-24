import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MeetingRoomService } from './meeting-room.service';
import { MeetingRoomController } from './meeting-room.controller';

import { MeetingRoom } from './entities/meeting-room.entity';
import { Booking } from '../booking/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom, Booking])],
  controllers: [MeetingRoomController],
  providers: [MeetingRoomService],
})
export class MeetingRoomModule {}
