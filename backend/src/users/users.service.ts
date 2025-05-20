import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUsersDto): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUsersDto): Promise<User> {
    return await this.prisma.user.update({ where: { id }, data });
  }
}
