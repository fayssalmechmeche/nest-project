import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(room: CreateRoomDto): Promise<Room> {
    return this.prisma.room.create({
      data: room,
    });
  }

  async getRooms(): Promise<Room[]> {
    return this.prisma.room.findMany();
  }

  async getRoom(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: { id },
    });
  }
}
