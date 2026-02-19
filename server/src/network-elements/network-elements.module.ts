import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkElementsService } from './network-elements.service';
import { NetworkElementsController } from './network-elements.controller';
import { StatsController } from './stats.controller';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
import { Splitter } from './entities/splitter.entity';
import { Fusion } from './entities/fusion.entity';
import { Olt } from './entities/olt.entity';
import { Onu } from './entities/onu.entity';
import { PonPort } from './entities/pon-port.entity';
import { Rbs } from './entities/rbs.entity';
import { Alarm } from './entities/alarm.entity';
import { AuditLog } from './entities/audit-log.entity';
import { WorkOrder } from './entities/work-order.entity';
import { CtoCustomer } from './entities/cto-customer.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';

import { SnmpService } from '../services/snmp.service';
import { OltDiscoveryService } from '../services/olt-discovery.service';
import { OltCliService } from '../services/olt-cli.service';
import { MonitoringService } from '../scheduler/monitoring.service';
import { MikrotikApiService } from '../services/mikrotik-api.service';
import { MonitoringGateway } from '../gateways/monitoring.gateway';
import { PingService } from '../services/ping.service';
import { PortMonitoringService } from '../services/port-monitoring.service';

import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pole,
      InfrastructureBox,
      Cable,
      Project,
      Splitter,
      Fusion,
      Olt,
      Onu,
      PonPort,
      Rbs,
      Alarm,
      AuditLog,
      WorkOrder,
      CtoCustomer,
    ]),
    ProjectsModule,
    AuthModule,
  ],
  controllers: [NetworkElementsController, StatsController],
  providers: [
    NetworkElementsService,
    SnmpService,
    OltDiscoveryService,
    OltCliService,
    MonitoringService,
    MikrotikApiService,
    MonitoringGateway,
    PingService,
    PortMonitoringService,
  ],
})
export class NetworkElementsModule { }
