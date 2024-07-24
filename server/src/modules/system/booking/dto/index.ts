import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsNotEmpty({ message: '会议室id不能为空' })
  @IsNumber()
  meetingRoomId: number;

  @ApiProperty()
  @IsNotEmpty({ message: '开始时间不能为空' })
  @IsNumber()
  startTime: number;

  @ApiProperty()
  @IsNotEmpty({ message: '结束时间不能为空' })
  @IsNumber()
  endTime: number;

  @ApiProperty()
  note: string;
}
