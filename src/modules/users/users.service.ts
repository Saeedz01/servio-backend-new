import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { toUserEntity, type UserEntity } from './entities/user.entity.js';

// Always load the role and the provider row together with a user, so
// the response can show the role name and the profile picture.
const userInclude = { role: true, provider: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Register a new user. The phone number must be unique. When the role
  // is "provider", a provider row is created in the same step.
  async register(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('A user with this phone number already exists.');
    }
    const role = await this.prisma.role.findUnique({ where: { role: dto.role } });
    if (!role) {
      throw new NotFoundException(`Role "${dto.role}" does not exist.`);
    }
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        password,
        roleId: role.id,
        provider:
          role.role === 'provider'
            ? {
                create: {
                  profilePic: dto.profilePic,
                  // Every new provider starts the month with 40 coins.
                  tokenWallet: { create: { balance: 40 } },
                },
              }
            : undefined,
      },
      include: userInclude,
    });
    return toUserEntity(user);
  }

  // Phone + password login. Wrong phone or wrong password both give the
  // same 401, so nobody can tell which part was wrong.
  async login(dto: LoginDto): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: userInclude,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }
    return toUserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      include: userInclude,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toUserEntity);
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!user) {
      throw new NotFoundException(`User "${id}" was not found.`);
    }
    return toUserEntity(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findOne(id);
    if (dto.phone) {
      const clash = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (clash && clash.id !== id) {
        throw new ConflictException('A user with this phone number already exists.');
      }
    }
    const { profilePic, password, ...rest } = dto;
    const data: Prisma.UserUpdateInput = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    await this.prisma.user.update({ where: { id }, data });
    // A new profile picture goes on the provider row, if one exists.
    if (profilePic !== undefined) {
      const provider = await this.prisma.provider.findUnique({ where: { userId: id } });
      if (provider) {
        await this.prisma.provider.update({ where: { id: provider.id }, data: { profilePic } });
      }
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    // The provider row (if any) is deleted automatically by the database.
    await this.prisma.user.delete({ where: { id } });
    return user;
  }
}
