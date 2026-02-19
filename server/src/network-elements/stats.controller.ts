import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Olt } from './entities/olt.entity';
import { Rbs } from './entities/rbs.entity';
import { Onu } from './entities/onu.entity';
import { Project } from '../projects/entities/project.entity';
import { Alarm } from './entities/alarm.entity';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';

@Controller('stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(
    @InjectRepository(Olt)
    private oltsRepository: Repository<Olt>,
    @InjectRepository(Rbs)
    private rbsRepository: Repository<Rbs>,
    @InjectRepository(Onu)
    private onusRepository: Repository<Onu>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Alarm)
    private alarmsRepository: Repository<Alarm>,
    @InjectRepository(Pole)
    private polesRepository: Repository<Pole>,
    @InjectRepository(InfrastructureBox)
    private boxesRepository: Repository<InfrastructureBox>,
    @InjectRepository(Cable)
    private cablesRepository: Repository<Cable>,
  ) { }

  @Get('dashboard')
  async getDashboardStats(@Req() req: any) {
    const tenantId = req.user.tenantId;

    const [totalProjects, olts, rbs, totalOnus] = await Promise.all([
      this.projectsRepository.count({ where: { tenantId } }),
      this.oltsRepository.find({ where: { tenantId } }),
      this.rbsRepository.find({ where: { tenantId } }),
      this.onusRepository.count({ where: { tenantId } }),
    ]);

    const onlineOlts = olts.filter((o) => o.status === 'online').length;
    const onlineRbs = rbs.filter((r) => r.status === 'online').length;

    const totalEquipments = olts.length + rbs.length;
    const onlineEquipments = onlineOlts + onlineRbs;

    const networkHealth =
      totalEquipments > 0
        ? Math.round((onlineEquipments / totalEquipments) * 100)
        : 100;

    // Calculate PON Occupation
    // Assuming average of 16 PON ports per OLT and 64 clients per port
    const totalCapacity = olts.length * 16 * 64;
    const occupationPercent =
      totalCapacity > 0 ? Math.round((totalOnus / totalCapacity) * 100) : 0;

    return {
      totalClients: totalOnus,
      networkHealth: `${networkHealth}%`,
      networkStatus:
        networkHealth > 90
          ? 'Operação Normal'
          : networkHealth > 50
            ? 'Atenção'
            : 'Crítico',
      activeProjects: totalProjects,
      occupation: {
        percent: occupationPercent,
        used: totalOnus,
        total: totalCapacity,
      },
      equipmentStats: {
        total: totalEquipments,
        online: onlineEquipments,
        offline: totalEquipments - onlineEquipments,
      },
    };
  }

  @Get('recent-alarms')
  async getRecentAlarms(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.alarmsRepository.find({
      where: { tenantId, isAcknowledged: false },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  @Get('project/:id/inventory')
  async getProjectInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;

    const [project, poles, boxes, cables, rbs] = await Promise.all([
      this.projectsRepository.findOne({ where: { id, tenantId } }),
      this.polesRepository.count({ where: { projectId: id } }),
      this.boxesRepository.find({ where: { projectId: id } }),
      this.cablesRepository.find({ where: { projectId: id } }),
      this.rbsRepository.count({ where: { projectId: id } }),
    ]);

    if (!project) return { message: 'Project not found' };

    // Group boxes by type
    const boxTypes = boxes.reduce(
      (acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group cables by type and calculate length
    const cableStats = cables.reduce(
      (acc, c) => {
        let length = 0;
        if (c.points && Array.isArray(c.points)) {
          for (let i = 0; i < c.points.length - 1; i++) {
            const p1 = c.points[i];
            const p2 = c.points[i + 1];
            // Haversine formula (simplified estimate)
            const R = 6371e3;
            const φ1 = (p1.lat * Math.PI) / 180;
            const φ2 = (p2.lat * Math.PI) / 180;
            const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
            const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const circle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            length += R * circle;
          }
        }
        // Add slack (technical reserve)
        length += c.slack || 0;

        acc[c.type] = (acc[c.type] || 0) + length;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      poles: poles,
      boxes: boxTypes,
      cablesInMeters: cableStats,
      totalCablesMeters: Object.values(cableStats).reduce((a, b) => a + b, 0),
      rbs: rbs,
    };
  }
}
