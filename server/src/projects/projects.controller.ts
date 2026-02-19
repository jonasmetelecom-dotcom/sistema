import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin', 'engineer')
  create(@Req() req: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Delete(':id')
  @Roles('admin', 'engineer')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user);
  }
}
