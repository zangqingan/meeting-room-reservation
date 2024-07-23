import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMeetingRoomDto {
  @ApiProperty()
  @IsNotEmpty({
    message: '会议室名称不能为空',
  })
  @MaxLength(10, {
    message: '会议室名称最长为 10 字符',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '容量不能为空',
  })
  capacity: number;

  @ApiProperty()
  @IsNotEmpty({
    message: '位置不能为空',
  })
  @MaxLength(50, {
    message: '位置最长为 50 字符',
  })
  location: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '设备不能为空',
  })
  @MaxLength(50, {
    message: '设备最长为 50 字符',
  })
  equipment: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '描述不能为空',
  })
  @MaxLength(100, {
    message: '描述最长为 100 字符',
  })
  description: string;
}

export class UpdateMeetingRoomDto extends PickType(CreateMeetingRoomDto, [
  'name',
  'location',
  'capacity',
]) {
  @ApiProperty()
  @MaxLength(50, {
    message: '设备最长为 50 字符',
  })
  equipment: string;

  @ApiProperty()
  @MaxLength(100, {
    message: '描述最长为 100 字符',
  })
  description: string;
}
