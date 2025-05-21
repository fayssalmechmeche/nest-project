import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from '@prisma/client';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() room: CreateRoomDto): Promise<Room> {
    return this.roomsService.createRoom(room);
  }

  @Get()
  getRooms(): Promise<Room[]> {
    return this.roomsService.getRooms();
  }

  @Get(':id')
  getRoom(@Param('id') id: string): Promise<Room | null> {
    return this.roomsService.getRoom(id);
  }
}
