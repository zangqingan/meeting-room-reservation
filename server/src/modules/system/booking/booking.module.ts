import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

import { MeetingRoom } from '../meeting-room/entities/meeting-room.entity';
import { User } from '../user/entities/user.entity';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom, User, Booking])],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
