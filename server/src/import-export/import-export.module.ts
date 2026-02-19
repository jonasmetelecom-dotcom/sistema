import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { Project } from '../projects/entities/project.entity';
import { Pole } from '../network-elements/entities/pole.entity';
import { InfrastructureBox } from '../network-elements/entities/box.entity';
import { Cable } from '../network-elements/entities/cable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Pole, InfrastructureBox, Cable]),
  ],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
