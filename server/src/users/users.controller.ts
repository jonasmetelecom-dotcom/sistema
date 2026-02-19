import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    // Force tenantId from authenticated user
    const userData = { ...createUserDto, tenantId: req.user.tenantId };
    return this.usersService.create(userData);
  }

  @Get()
  @Roles('admin')
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    if (updateUserDto.role && updateUserDto.role !== req.user.role) {
      throw new ForbiddenException('Cannot update own role');
    }
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
