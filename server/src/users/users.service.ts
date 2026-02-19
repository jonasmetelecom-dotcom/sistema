import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: any): Promise<User> {
    if (userData.password) {
      const salt = await bcrypt.genSalt();
      userData.passwordHash = await bcrypt.hash(userData.password, salt);
      delete userData.password; // Don't save plain password
    }
    const user = this.userRepository.create(userData as Partial<User>);
    return this.userRepository.save(user);
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'passwordHash',
        'role',
        'tenantId',
        'tenant',
      ], // Explicitly select passwordHash
      relations: ['tenant'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...rest } = updateUserDto;
    const updateData: any = { ...rest };

    if (password) {
      const salt = await bcrypt.genSalt();
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
