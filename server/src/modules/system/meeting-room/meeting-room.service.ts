import { Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Injectable()
export class MeetingRoomService {
  create(createMeetingRoomDto: CreateMeetingRoomDto) {
    return 'This action adds a new meetingRoom';
  }

  findAll() {
    return `This action returns all meetingRoom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meetingRoom`;
  }

  update(id: number, updateMeetingRoomDto: UpdateMeetingRoomDto) {
    return `This action updates a #${id} meetingRoom`;
  }

  remove(id: number) {
    return `This action removes a #${id} meetingRoom`;
  }
}
