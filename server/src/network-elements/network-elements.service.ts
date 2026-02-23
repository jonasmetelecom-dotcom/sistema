import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
import { Splitter } from './entities/splitter.entity';
import { Fusion } from './entities/fusion.entity';
import { ProjectsService } from '../projects/projects.service';

import { Olt } from './entities/olt.entity';
import { Onu } from './entities/onu.entity';
import { Rbs } from './entities/rbs.entity';
import { Alarm } from './entities/alarm.entity';
import { AuditLog } from './entities/audit-log.entity';
import { WorkOrder } from './entities/work-order.entity';
import { CtoCustomer } from './entities/cto-customer.entity';
import { PonPort } from './entities/pon-port.entity';
import { SnmpService } from '../services/snmp.service';
import { OltDiscoveryService } from '../services/olt-discovery.service';
import { OltCliService } from '../services/olt-cli.service';
import { MikrotikApiService } from '../services/mikrotik-api.service';
import { MonitoringGateway } from '../gateways/monitoring.gateway';
import { PingService } from '../services/ping.service';

@Injectable()
export class NetworkElementsService {
  private readonly logger = new Logger(NetworkElementsService.name);

  constructor(
    @InjectRepository(Pole)
    private polesRepository: Repository<Pole>,
    @InjectRepository(InfrastructureBox)
    private boxesRepository: Repository<InfrastructureBox>,
    @InjectRepository(Cable)
    private cablesRepository: Repository<Cable>,
    @InjectRepository(Splitter)
    private splittersRepository: Repository<Splitter>,
    @InjectRepository(Fusion)
    private fusionsRepository: Repository<Fusion>,
    @InjectRepository(Olt)
    private oltsRepository: Repository<Olt>,
    @InjectRepository(Onu)
    private onusRepository: Repository<Onu>,
    @InjectRepository(PonPort)
    private ponPortsRepository: Repository<PonPort>,
    @InjectRepository(Rbs)
    private rbsRepository: Repository<Rbs>,
    @InjectRepository(Alarm)
    private alarmsRepository: Repository<Alarm>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    @InjectRepository(WorkOrder)
    private workOrdersRepository: Repository<WorkOrder>,
    @InjectRepository(CtoCustomer)
    private ctoCustomersRepository: Repository<CtoCustomer>,
    private snmpService: SnmpService,
    private oltDiscoveryService: OltDiscoveryService,
    private oltCliService: OltCliService,
    private mikrotikApiService: MikrotikApiService,
    private monitoringGateway: MonitoringGateway,
    private pingService: PingService,
    private projectsService: ProjectsService,
  ) { }

  async findAllByProject(projectId: string, user: any) {
    // Verify project existence and access
    const project = await this.projectsService.findOne(projectId, user);
    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const [poles, boxes, cables, splitters, fusions, onus, ctoCustomers] = await Promise.all([
      this.polesRepository.find({ where: { projectId } }),
      this.boxesRepository.find({ where: { projectId } }),
      this.cablesRepository.find({ where: { projectId } }),
      this.splittersRepository.find({ where: { projectId } }),
      this.fusionsRepository.find({ where: { projectId } }),
      this.onusRepository.find({ where: { projectId } }),
      this.ctoCustomersRepository.find({ where: { projectId } }),
    ]);

    return { poles, boxes, cables, splitters, fusions, onus, ctoCustomers };
  }

  // Generic creators for simplicity for now
  async createPole(data: Partial<Pole>) {
    const pole = this.polesRepository.create(data);
    return this.polesRepository.save(pole);
  }

  async createBox(data: Partial<InfrastructureBox>) {
    const box = this.boxesRepository.create(data);
    return this.boxesRepository.save(box);
  }

  async findOneBox(id: string) {
    return this.boxesRepository.findOne({ where: { id } });
  }

  async createCable(data: Partial<Cable>) {
    const cable = this.cablesRepository.create(data);
    return this.cablesRepository.save(cable);
  }

  async createOnu(data: Partial<Onu>) {
    const onu = this.onusRepository.create(data);
    return this.onusRepository.save(onu);
  }

  async updatePole(id: string, data: Partial<Pole>) {
    await this.polesRepository.update(id, data);
    return this.polesRepository.findOne({ where: { id } });
  }

  async updateBox(id: string, data: Partial<InfrastructureBox>) {
    await this.boxesRepository.update(id, data);
    return this.boxesRepository.findOne({ where: { id } });
  }

  async updateCable(id: string, data: Partial<Cable>) {
    await this.cablesRepository.update(id, data);
    return this.cablesRepository.findOne({ where: { id } });
  }

  async deletePole(id: string) {
    return this.polesRepository.softDelete(id);
  }

  async restorePole(id: string) {
    return this.polesRepository.restore(id);
  }

  async deleteBox(id: string) {
    // 1. Clean up internals (Splitters/Fusions)
    try {
      // Try soft delete first
      await this.splittersRepository.softDelete({ boxId: id });
      await this.fusionsRepository.softDelete({ boxId: id });
    } catch (error) {
      console.error(
        `Soft delete internals failed for box ${id}, trying hard delete:`,
        error,
      );
      try {
        // Fallback to hard delete for internals to ensure cleanup
        await this.splittersRepository.delete({ boxId: id });
        await this.fusionsRepository.delete({ boxId: id });
      } catch (hardError) {
        console.error(`Hard delete internals also failed:`, hardError);
      }
    }

    // 2. Delete the Box
    try {
      return await this.boxesRepository.softDelete(id);
    } catch (error) {
      console.error(`Soft delete box ${id} failed, trying hard delete:`, error);
      // Fallback to hard delete
      return this.boxesRepository.delete(id);
    }
  }

  async restoreBox(id: string) {
    // Cascade restore to contents
    await this.splittersRepository.restore({ boxId: id });
    await this.fusionsRepository.restore({ boxId: id });
    return this.boxesRepository.restore(id);
  }

  async deleteCable(id: string) {
    return this.cablesRepository.softDelete(id);
  }

  async restoreCable(id: string) {
    return this.cablesRepository.restore(id);
  }

  // --- Illumination / Connectivity ---

  async getBoxInternals(boxId: string) {
    // 1. Get Box to find location
    const box = await this.boxesRepository.findOne({ where: { id: boxId } });
    if (!box) throw new Error('Box not found');

    console.log(
      `[getBoxInternals] Box ${boxId} at ${box.latitude}, ${box.longitude}`,
    );

    // 2. Find underlying Pole using fuzzy search (approx 1 meter tolerance)
    // 0.00001 degrees is roughly 1.1 meters at equator
    const epsilon = 0.00001;

    const pole = await this.polesRepository
      .createQueryBuilder('pole')
      .where('pole.projectId = :projectId', { projectId: box.projectId })
      .andWhere('ABS(pole.latitude - :lat) < :epsilon', {
        lat: box.latitude,
        epsilon,
      })
      .andWhere('ABS(pole.longitude - :lng) < :epsilon', {
        lng: box.longitude,
        epsilon,
      })
      .getOne();

    console.log(
      `[getBoxInternals] Found underlying pole: ${pole ? pole.id : 'NONE'} (Fuzzy Search)`,
    );

    const poleId = pole ? pole.id : null;

    // 3. Build queries
    // Incoming: To Box OR To Pole (if found)
    const incomingQuery: any[] = [{ toId: boxId }];
    if (poleId) incomingQuery.push({ toId: poleId, toType: 'pole' });

    // Outgoing: From Box OR From Pole (if found)
    const outgoingQuery: any[] = [{ fromId: boxId }];
    if (poleId) outgoingQuery.push({ fromId: poleId, fromType: 'pole' });

    console.log(
      '[getBoxInternals] Queries:',
      JSON.stringify({ incoming: incomingQuery, outgoing: outgoingQuery }),
    );

    const [splitters, fusions, incomingCables, outgoingCables, ctoCustomers] =
      await Promise.all([
        this.splittersRepository.find({ where: { boxId } }),
        this.fusionsRepository.find({ where: { boxId } }),
        this.cablesRepository.find({ where: incomingQuery }),
        this.cablesRepository.find({ where: outgoingQuery }),
        this.ctoCustomersRepository.find({ where: { boxId } }),
      ]);

    console.log(
      `[getBoxInternals] Found: ${incomingCables.length} incoming, ${outgoingCables.length} outgoing, ${ctoCustomers.length} customers`,
    );

    // Resolve destinations for simple visualization (is it CTO or Splice?)
    const destinationBoxIds = outgoingCables
      .filter((c) => c.toType === 'box' && c.toId)
      .map((c) => c.toId);

    const destinationTypes: Record<string, string> = {};

    if (destinationBoxIds.length > 0) {
      // Remove duplicates
      const uniqueIds = [...new Set(destinationBoxIds)];

      // Check if we can find them
      const destBoxes = await this.boxesRepository.find({
        where: { id: In(uniqueIds) },
        select: ['id', 'type'],
      });

      destBoxes.forEach((b) => {
        destinationTypes[b.id] = b.type;
      });
    }

    return {
      splitters,
      fusions,
      incomingCables,
      outgoingCables,
      destinationTypes,
      ctoCustomers,
      images: box.images || [],
      poleId,
    };
  }

  async createSplitter(data: Partial<Splitter>) {
    const splitter = this.splittersRepository.create(data);
    return this.splittersRepository.save(splitter);
  }

  async createFusion(data: Partial<Fusion>) {
    const fusion = this.fusionsRepository.create(data);
    return this.fusionsRepository.save(fusion);
  }

  async deleteFusion(id: string) {
    return this.fusionsRepository.softDelete(id);
  }

  async deleteSplitter(id: string) {
    // Soft delete connections involving this splitter
    await this.fusionsRepository.softDelete({
      originId: id,
      originType: 'splitter',
    });
    await this.fusionsRepository.softDelete({
      destinationId: id,
      destinationType: 'splitter',
    });
    return this.splittersRepository.softDelete(id);
  }

  // --- CTO Customers ---

  async createCtoCustomer(data: Partial<CtoCustomer>) {
    const customer = this.ctoCustomersRepository.create(data);
    return this.ctoCustomersRepository.save(customer);
  }

  async updateCtoCustomer(id: string, data: Partial<CtoCustomer>) {
    await this.ctoCustomersRepository.update(id, data);
    return this.ctoCustomersRepository.findOne({ where: { id } });
  }

  async deleteCtoCustomer(id: string) {
    return this.ctoCustomersRepository.delete(id);
  }

  async findCtoCustomersByBox(boxId: string) {
    return this.ctoCustomersRepository.find({ where: { boxId } });
  }

  // --- Active Equipment (OLT / RBS) ---

  async createOlt(data: Partial<Olt>, user: any) {
    const olt = this.oltsRepository.create({
      ...data,
      tenantId: user.tenantId,
    });
    const saved = await this.oltsRepository.save(olt);

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'CREATE',
      entityType: 'OLT',
      entityId: saved.id,
      details: JSON.stringify(saved),
      tenantId: user.tenantId,
    });

    // Trigger quick poll for immediate "Online" status (fire-and-forget)
    this.pollDeviceStatus(saved.id, 'olt').catch((err) =>
      this.logger.error(`Initial quick poll failed for OLT ${saved.id}`, err),
    );

    // Trigger deep discovery in background after the initial poll
    this.runOltDiscovery(saved.id, user.tenantId).catch((err) =>
      this.logger.error(`Automatic discovery failed for OLT ${saved.id}`, err),
    );

    return saved;
  }

  async createRbs(data: Partial<Rbs>, user: any) {
    console.log('[CREATE RBS] Received data:', JSON.stringify(data, null, 2));
    const rbs = this.rbsRepository.create({ ...data, tenantId: user.tenantId });
    const saved = await this.rbsRepository.save(rbs);
    console.log('[CREATE RBS] Saved RBS:', JSON.stringify(saved, null, 2));

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'CREATE',
      entityType: 'RBS',
      entityId: saved.id,
      details: JSON.stringify(saved),
      tenantId: user.tenantId,
    });

    // Trigger poll immediately
    this.pollDeviceStatus(saved.id, 'rbs').catch((err) =>
      console.error(`Initial poll failed for RBS ${saved.id}`, err),
    );
    return saved;
  }

  async testRbsConnection(data: any) {
    const { ipAddress, monitoringMethod, apiUsername, apiPassword, apiPort, port, community } = data;

    try {
      if (monitoringMethod === 'api') {
        // Test MikroTik API connection
        const client = await this.mikrotikApiService.connect({
          host: ipAddress,
          username: apiUsername,
          password: apiPassword,
          port: apiPort || 8728,
          timeout: 5000
        });

        if (client) {
          // Disconnect after test
          await this.mikrotikApiService.disconnect(ipAddress);
          return {
            success: true,
            message: `Conexão API estabelecida com sucesso! (${ipAddress}:${apiPort || 8728})`
          };
        } else {
          throw new Error('Falha ao conectar via API');
        }
      } else if (monitoringMethod === 'snmp') {
        // Test SNMP connection
        const snmp = require('net-snmp');
        const session = snmp.createSession(ipAddress, community || 'public', { port: port || 161, version: snmp.Version2c });

        // Try to get system description OID
        const result = await new Promise((resolve, reject) => {
          session.get(['1.3.6.1.2.1.1.1.0'], (error: any, varbinds: any) => {
            session.close();
            if (error) {
              reject(error);
            } else {
              resolve(varbinds);
            }
          });
        });

        return {
          success: true,
          message: `Conexão SNMP estabelecida com sucesso! (${ipAddress}:${port || 161})`
        };
      } else if (monitoringMethod === 'ping') {
        // Test ping connectivity
        const { exec } = require('child_process');
        const isWindows = process.platform === 'win32';
        const pingCommand = isWindows ? `ping -n 1 ${ipAddress}` : `ping -c 1 ${ipAddress}`;

        const result = await new Promise((resolve, reject) => {
          exec(pingCommand, (error: any, stdout: string, stderr: string) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });

        return {
          success: true,
          message: `Ping bem-sucedido! Dispositivo ${ipAddress} está respondendo.`
        };
      }

      throw new Error('Método de monitoramento inválido');
    } catch (error: any) {
      console.error('Test connection error:', error);
      throw new Error(error.message || 'Falha ao testar conexão');
    }
  }

  async disconnectRbs(id: string, tenantId: string) {
    const rbs = await this.rbsRepository.findOne({
      where: { id, tenantId },
      select: ['id', 'name', 'ipAddress', 'apiPort']
    });

    if (!rbs) {
      throw new NotFoundException('RBS not found');
    }

    try {
      await this.mikrotikApiService.disconnect(rbs.ipAddress, rbs.apiPort || 8728);
      this.logger.log(`[DISCONNECT] Manually disconnected from RBS ${rbs.name} (${rbs.ipAddress})`);

      return {
        success: true,
        message: `Desconectado de ${rbs.name} com sucesso!`
      };
    } catch (error: any) {
      this.logger.error(`[DISCONNECT] Failed to disconnect from ${rbs.ipAddress}: ${error.message}`);
      throw new Error('Falha ao desconectar: ' + error.message);
    }
  }

  async getOlts(projectId: string, tenantId: string) {
    // Removed 'onus' relation for performance in listing
    return this.oltsRepository.find({ where: { projectId, tenantId } });
  }

  async getAllOlts(tenantId?: string) {
    // Removed 'onus' relation for performance in listing
    return this.oltsRepository.find({
      where: tenantId ? { tenantId } : {},
      relations: ['project'],
    });
  }

  async getOltById(id: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id, tenantId },
      relations: ['project'],
    });
    if (!olt) {
      throw new NotFoundException('OLT não encontrada');
    }
    return olt;
  }

  async getRbs(projectId: string, tenantId: string) {
    return this.rbsRepository.find({ where: { projectId, tenantId } });
  }

  async getAllRbs(tenantId?: string) {
    return this.rbsRepository.find({
      where: tenantId ? { tenantId } : {},
      relations: ['project'],
    });
  }

  async getMonitoringData(tenantId?: string) {
    const [olts, rbs] = await Promise.all([
      this.oltsRepository.find({
        where: tenantId ? { tenantId } : {},
        relations: ['project'],
      }),
      this.rbsRepository.find({
        where: tenantId ? { tenantId } : {},
        relations: ['project'],
      }),
    ]);

    // Find active unacknowledged critical alarms
    const alarms = await this.alarmsRepository.find({
      where: {
        isAcknowledged: false,
        severity: 'critical',
        tenantId: tenantId ? tenantId : undefined,
      },
    });

    const alertingDeviceIds = new Set(alarms.map((a) => a.deviceId));

    const mappedOlts = olts.map((o) => ({
      ...o,
      type: 'olt',
      isAlerting: alertingDeviceIds.has(o.id),
      isInMaintenance:
        o.maintenanceUntil && new Date(o.maintenanceUntil) > new Date(),
    }));

    const mappedRbs = rbs.map((r) => ({
      ...r,
      type: 'rbs',
      isAlerting: alertingDeviceIds.has(r.id),
      isInMaintenance:
        r.maintenanceUntil && new Date(r.maintenanceUntil) > new Date(),
    }));

    return [...mappedOlts, ...mappedRbs];
  }

  async deleteOlt(id: string, user: any) {
    const olt = await this.oltsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!olt) {
      throw new NotFoundException('OLT não encontrada ou acesso negado.');
    }

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'DELETE',
      entityType: 'OLT',
      entityId: id,
      tenantId: user.tenantId,
    });
    return this.oltsRepository.remove(olt);
  }

  async updateOlt(id: string, data: Partial<Olt>, user: any) {
    const olt = await this.oltsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!olt) {
      throw new NotFoundException('OLT não encontrada ou acesso negado.');
    }

    // Protection: Explicitly allowed fields for update
    const allowedFields = [
      'name',
      'ipAddress',
      'latitude',
      'longitude',
      'port',
      'community',
      'model',
      'firmwareVersion',
      'projectId',
      'maintenanceUntil',
      'cliProtocol',
      'cliUsername',
      'cliPassword',
    ];
    const updateData: any = {};

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        // Ignorar senha se vier vazia no update (para não sobrescrever o que já existe)
        if (key === 'cliPassword' && !data[key]) {
          return;
        }
        updateData[key] = (data as any)[key];
      }
    });

    Object.assign(olt, updateData);
    const saved = await this.oltsRepository.save(olt);

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'UPDATE',
      entityType: 'OLT',
      entityId: id,
      details: JSON.stringify(updateData),
      tenantId: user.tenantId,
    });

    // Trigger quick poll to refresh basic status
    this.pollDeviceStatus(saved.id, 'olt').catch((err) =>
      this.logger.error(`Poll failed after update for OLT ${id}`, err),
    );

    // Trigger deep discovery in background
    this.runOltDiscovery(saved.id, user.tenantId).catch((err) =>
      this.logger.error(
        `Automatic discovery failed after update for OLT ${id}`,
        err,
      ),
    );

    return saved;
  }

  async deleteRbs(id: string, user: any) {
    const rbs = await this.rbsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!rbs) {
      throw new NotFoundException('RBS não encontrada ou acesso negado.');
    }

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'DELETE',
      entityType: 'RBS',
      entityId: id,
      tenantId: user.tenantId,
    });
    return this.rbsRepository.remove(rbs);
  }

  async updateRbs(id: string, data: Partial<Rbs>, user: any) {
    console.log('[UPDATE RBS] Received data for RBS', id, ':', JSON.stringify(data, null, 2));

    const rbs = await this.rbsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!rbs) {
      throw new NotFoundException('RBS não encontrada ou acesso negado.');
    }

    // Protection: Explicitly allowed fields for update
    const allowedFields = [
      'name',
      'ipAddress',
      'latitude',
      'longitude',
      'port',
      'community',
      'model',
      'projectId',
      'maintenanceUntil',
      'monitoringMethod',
      'apiUsername',
      'apiPassword',
      'apiPort',
      'cliProtocol',
      'cliUsername',
      'cliPassword',
    ];
    const updateData: any = {};

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = (data as any)[key];
      }
    });

    console.log('[UPDATE RBS] Filtered update data:', JSON.stringify(updateData, null, 2));

    Object.assign(rbs, updateData);
    const saved = await this.rbsRepository.save(rbs);
    console.log('[UPDATE RBS] Saved RBS:', JSON.stringify(saved, null, 2));

    await this.logAudit({
      userId: user.userId,
      userName: user.username,
      action: 'UPDATE',
      entityType: 'RBS',
      entityId: id,
      details: JSON.stringify(updateData),
      tenantId: user.tenantId,
    });

    this.pollDeviceStatus(saved.id, 'rbs').catch((err) =>
      console.error(`Poll failed after update for RBS ${id}`, err),
    );

    return saved;
  }

  async getRbsMonitoring(id: string, tenantId: string) {
    this.logger.debug(`[MONITORING] Fetching data for RBS ${id}`);
    const rbs = await this.rbsRepository.findOne({
      where: { id, tenantId },
      select: ['id', 'name', 'ipAddress', 'community', 'monitoringMethod', 'apiUsername', 'apiPassword', 'apiPort', 'tenantId']
    });
    if (!rbs) throw new NotFoundException('RBS not found');

    // Select monitoring method based on configuration
    let health: any;
    let interfaces: any[];
    let ethernetPorts: any[] = [];
    let status: any;
    let actualMethod = rbs.monitoringMethod;

    if (rbs.monitoringMethod === 'api' && rbs.apiUsername && rbs.apiPassword) {
      try {
        this.logger.log(`[MONITORING] Using MikroTik API for ${rbs.ipAddress}`);
        const [resourceStats, interfaceStats, ports] = await Promise.all([
          this.mikrotikApiService.getResourceStats({
            host: rbs.ipAddress,
            username: rbs.apiUsername!,
            password: rbs.apiPassword!,
            port: rbs.apiPort,
          }),
          this.mikrotikApiService.getInterfaceStats({
            host: rbs.ipAddress,
            username: rbs.apiUsername!,
            password: rbs.apiPassword!,
            port: rbs.apiPort,
          }),
          this.mikrotikApiService.getEthernetPorts({
            host: rbs.ipAddress,
            username: rbs.apiUsername!,
            password: rbs.apiPassword!,
            port: rbs.apiPort,
          }).catch(() => []),
        ]);

        health = {
          cpuLoad: resourceStats.cpuLoad,
          freeMemory: resourceStats.freeMemory,
          totalMemory: resourceStats.totalMemory,
          voltage: resourceStats.voltage || 0,
          temperature: resourceStats.temperature || 0,
        };

        interfaces = interfaceStats.map(iface => ({
          index: iface.index,
          name: iface.name,
          status: iface.status,
          inOctets: iface.rxBytes,
          outOctets: iface.txBytes,
        }));

        status = {
          online: true,
          uptime: resourceStats.uptime,
        };
        ethernetPorts = ports;
      } catch (error: any) {

        this.logger.error(`[MONITORING] API failed for ${rbs.ipAddress}, falling back to SNMP: ${error.message}`);
        actualMethod = 'snmp';
        [health, interfaces, status] = await Promise.all([
          this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
          this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
          this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
        ]);
      }
    } else if (rbs.monitoringMethod === 'snmp') {
      this.logger.log(`[MONITORING] Using SNMP for ${rbs.ipAddress}`);
      [health, interfaces, status] = await Promise.all([
        this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
        this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
        this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
      ]);
    } else if (rbs.monitoringMethod === 'ping') {
      this.logger.log(`[MONITORING] Using Ping for ${rbs.ipAddress}`);
      const pingResult = await this.pingService.ping(rbs.ipAddress);

      health = {
        cpuLoad: 0,
        freeMemory: 0,
        totalMemory: 0,
        voltage: 0,
        temperature: 0,
      };

      interfaces = [];

      status = {
        online: pingResult.online,
        uptime: pingResult.online ? 'Online' : 'Offline',
      };
    } else {
      // Default to SNMP if no valid method
      this.logger.log(`[MONITORING] No valid method configured, using SNMP for ${rbs.ipAddress}`);
      actualMethod = 'snmp';
      [health, interfaces, status] = await Promise.all([
        this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
        this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
        this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
      ]);
    }

    const alarms = await this.alarmsRepository.find({
      where: { deviceId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const result = {
      health: {
        ...health,
        uptime: status.uptime,
      },
      interfaces,
      ports: ethernetPorts,
      alarms,
      monitoringMethod: actualMethod,
    };

    // Broadcast update via WebSocket
    this.monitoringGateway.broadcastDeviceUpdate(id, result);

    return result;
  }

  async syncOnus(oltId: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId },
    });
    if (!olt) throw new NotFoundException('OLT not found');

    this.logger.log(
      `[SYNC] Starting ONU sync for OLT ${olt.name} (${olt.ipAddress})`,
    );

    const onus = await this.snmpService.getOltOnus(
      olt.ipAddress,
      olt.community,
    );

    this.logger.log(`[SYNC] Received ${onus.length} ONUs from SNMP service`);

    // Log ONUs per PON port
    const ponCounts = onus.reduce(
      (acc, onu) => {
        acc[onu.ponPort] = (acc[onu.ponPort] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    this.logger.log(`[SYNC] ONUs per PON port: ${JSON.stringify(ponCounts)}`);

    const scannedSerialNumbers = onus.map((o) => o.serialNumber);
    const updatedOnuIds: string[] = [];

    for (const data of onus) {
      const existingOnu = await this.onusRepository.findOne({
        where: { serialNumber: data.serialNumber, oltId: olt.id, tenantId },
      });

      if (existingOnu) {
        // Update existing - PROTECT ponPort!
        // Trust the Discovery (Deep Scan) mapping more than the background SNMP polling
        const newStatus = data.status || 'offline';
        const newSignal = data.signalLevel || 0;

        this.logger.log(
          `[SYNC] Updating ONU ${data.serialNumber}: Status ${existingOnu.status}->${newStatus}, Signal ${existingOnu.signalLevel}->${newSignal}. Port remains ${existingOnu.ponPort}`,
        );

        await this.onusRepository.update(existingOnu.id, {
          status: newStatus,
          signalLevel: newSignal,
          // ponPort: data.ponPort, // REMOVIDO: Não sobrescrever mapeamento de porta no background
          isAuthorized: true,
          lastSeen: newStatus === 'online' ? new Date() : existingOnu.lastSeen,
        });
        updatedOnuIds.push(existingOnu.id);
      } else {
        // Create new
        const newOnu = this.onusRepository.create({
          ...data,
          oltId: olt.id,
          tenantId,
          isAuthorized: true, // Auto-authorize discovered units
        });
        const saved = await this.onusRepository.save(newOnu);
        updatedOnuIds.push((saved as any).id);
        this.logger.log(
          `[SYNC] Created new ONU: ${data.serialNumber} on PON ${data.ponPort}`,
        );
      }
    }

    // Cleanup: REMOVIDO para evitar deletar ONUs descobertas via CLI
    // O scan SNMP de background pode ser incompleto. Deletar aqui causaria reversão de dados.
    if (scannedSerialNumbers.length > 0) {
      const allDbOnus = await this.onusRepository.find({
        where: { oltId: olt.id, tenantId },
      });
      const missingCount = allDbOnus.filter(
        (dbOnu) => !scannedSerialNumbers.includes(dbOnu.serialNumber),
      ).length;
      if (missingCount > 0) {
        this.logger.debug(
          `[SYNC] Existem ${missingCount} ONUs no banco que não apareceram neste scan rápido de SNMP. Mantendo-as para evitar perda de dados CLI.`,
        );
      }
    }

    this.logger.log(
      `[SYNC] Sync complete: ${onus.length} ONUs atualizadas de ${olt.ipAddress}`,
    );

    return { success: true, count: onus.length, cleanedCount: 0 };
  }

  async getAllOnus(tenantId: string) {
    return this.onusRepository.find({
      where: { tenantId },
      relations: ['olt'],
      order: { ponPort: 'ASC', name: 'ASC' },
    });
  }

  async getOnus(oltId: string, tenantId: string) {
    return this.onusRepository.find({ where: { oltId, tenantId } });
  }

  async getOnusLive(oltId: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId },
      relations: ['project'],
    });
    if (!olt) throw new NotFoundException('OLT not found');

    return this.oltDiscoveryService.getOnusLive(olt);
  }

  async deleteOnu(id: string, tenantId: string) {
    return this.onusRepository.delete({ id, tenantId });
  }

  /**
   * Polls an OLT or RBS for basic status (Uptime, Name) and updates DB
   */
  async pollDeviceStatus(id: string, type: 'olt' | 'rbs') {
    let device: Olt | Rbs | null = null;
    if (type === 'olt') {
      device = await this.oltsRepository.findOne({
        where: { id },
        relations: ['project'],
      });
    } else {
      device = await this.rbsRepository.findOne({
        where: { id },
        relations: ['project'],
      });
    }

    if (!device) throw new NotFoundException('Device not found');

    // Poll SNMP
    const status = await this.snmpService.getDeviceStatus(
      device.ipAddress,
      device.community,
    );

    // Check if device is in maintenance mode
    const isInMaintenance =
      device.maintenanceUntil && new Date(device.maintenanceUntil) > new Date();

    // Check for status change to generate alarm
    if (!isInMaintenance) {
      if (device.status === 'online' && !status.online) {
        await this.generateAlarm({
          type: `${type}_down`,
          severity: 'critical',
          deviceId: device.id,
          deviceName: device.name,
          message: `Equipamento ${device.name} está OFFLINE.`,
          tenantId: device.project?.tenantId,
        });
      } else if (device.status === 'offline' && status.online) {
        await this.generateAlarm({
          type: `${type}_up`,
          severity: 'info',
          deviceId: device.id,
          deviceName: device.name,
          message: `Equipamento ${device.name} voltou a ficar ONLINE.`,
          tenantId: device.project?.tenantId,
        });
      }
    }

    // Update Entity
    const updateData: any = {
      uptime: status.uptime,
      status: status.online ? 'online' : 'offline',
    };
    if (status.online) {
      updateData.lastSeen = new Date();
    }

    if (type === 'olt') {
      await this.oltsRepository.update(id, updateData);
    } else {
      // RBS health polling...
      let health = {
        cpuLoad: 0,
        freeMemory: 0,
        totalMemory: 0,
        voltage: 0,
        temperature: 0,
      };
      if (!status.icmpOnly) {
        health = await this.snmpService.getRbsHealth(
          device.ipAddress,
          device.community,
        );
      }

      await this.rbsRepository.update(id, {
        ...updateData,
        cpuLoad: health.cpuLoad,
        freeMemory: health.freeMemory,
        totalMemory: health.totalMemory,
        voltage: health.voltage,
        temperature: health.temperature,
      });

      return { ...device, ...status, ...health };
    }

    return { ...device, ...status };
  }

  // --- Phase 4: Alarms & Audit Logging ---

  async getAlarms(tenantId?: string) {
    return this.alarmsRepository.find({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async acknowledgeAlarm(
    id: string,
    userId: string,
    userName: string,
    tenantId: string,
  ) {
    return this.alarmsRepository.update(
      { id, tenantId },
      {
        isAcknowledged: true,
        acknowledgedBy: userName,
        acknowledgedAt: new Date(),
      },
    );
  }

  async generateAlarm(data: {
    type: string;
    severity: string;
    deviceId: string;
    deviceName: string;
    message: string;
    tenantId?: string;
  }) {
    const alarm = this.alarmsRepository.create(data);
    return this.alarmsRepository.save(alarm);
  }

  async logAudit(data: {
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: string;
    ipAddress?: string;
    tenantId?: string;
  }) {
    const log = this.auditLogsRepository.create(data);
    return this.auditLogsRepository.save(log);
  }

  async tracePath(
    startElementId: string,
    startFiberIndex: number,
    tenantId: string,
  ) {
    const path = [];
    const visited = new Set<string>();
    // Queue now explicitly tracks "side" for splitters to resolve Index 1 ambiguity
    // side: 'input' (Left/Destination-side) | 'output' (Right/Origin-side) | 'neutral' (Cables)
    const queue: {
      id: string;
      type: string;
      fiberIndex: number;
      side: 'input' | 'output' | 'neutral';
    }[] = [];

    // Determine type of start element
    const startSplitter = await this.splittersRepository.findOne({
      where: { id: startElementId },
    });
    if (startSplitter) {
      // Starting at a splitter is tricky.
      // If Index 1, it could be Input or Output 1.
      // We'll queue both possibilities to be safe, visited set will handle dupes.
      if (startFiberIndex === 1) {
        queue.push({
          id: startElementId,
          type: 'splitter',
          fiberIndex: 1,
          side: 'input',
        });
        queue.push({
          id: startElementId,
          type: 'splitter',
          fiberIndex: 1,
          side: 'output',
        });
      } else {
        queue.push({
          id: startElementId,
          type: 'splitter',
          fiberIndex: startFiberIndex,
          side: 'output',
        });
      }
    } else {
      const startCable = await this.cablesRepository.findOne({
        where: { id: startElementId },
      });
      if (startCable) {
        queue.push({
          id: startElementId,
          type: 'cable',
          fiberIndex: startFiberIndex,
          side: 'neutral',
        });
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      // Unique key includes SIDE for splitters
      const key = `${current.id}-${current.fiberIndex}-${current.type}-${current.side}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Only add to result path if it's a physical element (don't double count splitter internal states)
      // But for visualization we might want to know we passed through.
      // Let's rely on the client to dedupe or handle visual logic.
      path.push(current);

      if (current.type === 'cable') {
        // ... same cable logic, but set neighbor side correctly ...
        const cable = await this.cablesRepository.findOne({
          where: { id: current.id },
        });
        if (!cable) continue;

        // Helper to queue neighbors
        const queueNeighbor = (
          id: string,
          type: string,
          index: number,
          isDestination: boolean,
        ) => {
          let nextSide: 'input' | 'output' | 'neutral' = 'neutral';
          if (type === 'splitter') {
            // If we are moving TO a splitter (it is Destination), we enter its Input side.
            // If we are moving FROM a splitter (it is Origin), we enter from its Output side? Use logic below:

            // Wait, 'isDestination' means the Fusion's Destination is the Neighbor.
            // Fusion: Cable -> Splitter. Splitter is Dest. We enter Splitter Input.
            if (isDestination) nextSide = 'input';
            // Fusion: Splitter -> Cable. Cable is Dest. We are scanning from Cable back to Splitter.
            // So Splitter is Origin. We enter Splitter Output.
            else nextSide = 'output';
          }
          queue.push({ id, type, fiberIndex: index, side: nextSide });
        };

        // Find connections (Both ends of cable)
        await this.findFailoverConnectionsEnhanced(
          current.id,
          current.fiberIndex,
          queueNeighbor,
        );
      } else if (current.type === 'splitter') {
        const splitter = await this.splittersRepository.findOne({
          where: { id: current.id },
        });
        if (!splitter) continue;
        const capacity = parseInt(splitter.type.split(':')[1]) || 8;

        if (current.side === 'input') {
          // We are at Splitter Input.
          // 1. Internal Flow: Go to All Outputs
          for (let i = 1; i <= capacity; i++) {
            // Output 1 is Index 1, Output 2 is Index 2...
            queue.push({
              id: current.id,
              type: 'splitter',
              fiberIndex: i,
              side: 'output',
            });
          }

          // 2. External Flow (Retrace upstream?):
          // If we want to light up what's feeding this input, we check Fusions where destinationId = Splitter.
          // But usually trace follows light. If we are at input, light came from outside.
          // Do we trace back out? "Find Break" might need full continuity.
          // Let's assume tracePropagates through.
          // If we started here, we might want to go out.
          // Check connections where Splitter is Destination (Input connected to Cable)
          await this.findSplitterConnections(
            current.id,
            current.fiberIndex,
            'destination',
            queue,
          );
        } else if (current.side === 'output') {
          // We are at Splitter Output.
          // 1. Internal Flow: Go to Input (Index 1)
          queue.push({
            id: current.id,
            type: 'splitter',
            fiberIndex: 1,
            side: 'input',
          });

          // 2. External Flow: Light leaves the splitter towards clients.
          // Check connections where Splitter is Origin (Output connected to Cable)
          await this.findSplitterConnections(
            current.id,
            current.fiberIndex,
            'origin',
            queue,
          );
        }
      }
    }

    return path;
  }

  private async findFailoverConnectionsEnhanced(
    cableId: string,
    fiberIdx: number,
    queueFn: (id: string, type: string, idx: number, isDest: boolean) => void,
  ) {
    // Find fusions where this cable is involved
    const fusions = await this.fusionsRepository.find({
      where: [
        { originId: cableId, originFiberIndex: fiberIdx },
        { destinationId: cableId, destinationFiberIndex: fiberIdx },
      ],
    });

    for (const f of fusions) {
      if (f.originId === cableId) {
        // Connection: Cable(Origin) -> Neighbor(Dest)
        queueFn(
          f.destinationId,
          f.destinationType,
          f.destinationFiberIndex,
          true,
        );
      } else {
        // Connection: Neighbor(Origin) -> Cable(Dest)
        queueFn(f.originId, f.originType, f.originFiberIndex, false);
      }
    }
  }

  private async findSplitterConnections(
    splitterId: string,
    fiberIdx: number,
    role: 'origin' | 'destination',
    queue: any[],
  ) {
    // If role is 'destination', we look for fusions where destination = splitter (Input side connections)
    // If role is 'origin', we look for fusions where origin = splitter (Output side connections)

    const whereClause =
      role === 'destination'
        ? { destinationId: splitterId, destinationFiberIndex: fiberIdx }
        : { originId: splitterId, originFiberIndex: fiberIdx };

    const fusions = await this.fusionsRepository.find({ where: whereClause });

    for (const f of fusions) {
      // We want the OTHER side
      if (role === 'destination') {
        // Splitter is Dest. Neighbor is Origin.
        // Neighbor is NOT a splitter usually (Cable). But if it is, calculate side.
        // If neighbor is Cable, side is neutral.
        // If neighbor is Splitter, and it is Origin, then we are at its Output.
        let nextSide = 'neutral';
        if (f.originType === 'splitter') nextSide = 'output';

        queue.push({
          id: f.originId,
          type: f.originType,
          fiberIndex: f.originFiberIndex,
          side: nextSide,
        });
      } else {
        // Splitter is Origin. Neighbor is Dest.
        // If neighbor is Splitter (Dest), we enter its Input.
        let nextSide = 'neutral';
        if (f.destinationType === 'splitter') nextSide = 'input';

        queue.push({
          id: f.destinationId,
          type: f.destinationType,
          fiberIndex: f.destinationFiberIndex,
          side: nextSide,
        });
      }
    }
  }
  async removeAllByProject(projectId: string, tenantId: string) {
    const project = await this.projectsService.findOne(projectId, { tenantId });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    // Hard delete everything for this project to ensure a clean slate
    try {
      // 1. Find all boxes to ensuring we delete internals that might rely on boxId
      const boxes = await this.boxesRepository.find({
        where: { projectId },
        select: ['id'],
      });
      const boxIds = boxes.map((b) => b.id);

      // 2. Delete Internals (Fusions & Splitters)
      // Delete by ProjectId AND BoxId to be safe (orphaned data handling)
      if (boxIds.length > 0) {
        await this.fusionsRepository.delete({ boxId: In(boxIds) });
        await this.splittersRepository.delete({ boxId: In(boxIds) });
      }
      // Also delete by projectId just in case
      await this.fusionsRepository.delete({ projectId });
      await this.splittersRepository.delete({ projectId });

      // 3. Delete Cables
      await this.cablesRepository.delete({ projectId });

      // 4. Delete ONUs (Customers)
      await this.onusRepository.delete({ projectId });

      // 5. Delete CTO Customers (Assignments)
      await this.ctoCustomersRepository.delete({ projectId });

      // 6. Delete Boxes
      await this.boxesRepository.delete({ projectId });

      // 7. Delete Poles
      await this.polesRepository.delete({ projectId });

      return { success: true, message: 'Project cleaned up successfully' };
    } catch (error) {
      console.error('Error cleaning project:', error);
      throw error;
    }
  }

  async calculateLinkBudget(
    cableId: string,
    fiberIndex: number,
    tenantId: string,
  ) {
    const path = await this.tracePath(cableId, fiberIndex, tenantId);
    let totalLoss = 0;
    let totalDistance = 0;
    const events = [];

    for (const item of path) {
      if (item.type === 'cable') {
        const cable = await this.cablesRepository.findOne({
          where: { id: item.id },
        });
        if (cable) {
          const length = this.calculateCableLength(cable);
          const cableLoss = length * 0.00035; // 0.35 dB/km = 0.00035 dB/m
          totalLoss += cableLoss;
          totalDistance += length;
          events.push({
            type: 'cable',
            description: `Cabo ${cable.type.toUpperCase()} (${length.toFixed(1)}m)`,
            loss: cableLoss,
          });
        }
      } else if (item.type === 'splitter') {
        const splitter = await this.splittersRepository.findOne({
          where: { id: item.id },
        });
        if (splitter) {
          const ratio = splitter.type.split(':')[1];
          const losses: Record<string, number> = {
            '2': 3.5,
            '4': 7.0,
            '8': 10.5,
            '16': 14.1,
            '32': 17.5,
          };
          const loss = losses[ratio] || 10.5;
          totalLoss += loss;
          events.push({
            type: 'splitter',
            description: `Splitter 1:${ratio}`,
            loss: loss,
          });
        }
      }

      // Add fusion loss for every step (simplified)
      if (item !== path[0]) {
        const fusionLoss = 0.1;
        totalLoss += fusionLoss;
        events.push({
          type: 'fusion',
          description: 'Fusão / Conexão',
          loss: fusionLoss,
        });
      }
    }

    const estimatedSignal = parseFloat((3.0 - totalLoss).toFixed(2)); // Assuming +3.0dBm OLT Power (Standard Class B+/C+)
    let status: 'optimal' | 'warning' | 'critical' = 'optimal';

    if (estimatedSignal < -28) status = 'critical';
    else if (estimatedSignal < -25) status = 'warning';

    return {
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      estimatedSignal,
      status,
      events,
    };
  }

  private calculateCableLength(cable: Cable): number {
    let length = 0;
    if (cable.points && Array.isArray(cable.points)) {
      for (let i = 0; i < cable.points.length - 1; i++) {
        const p1 = cable.points[i];
        const p2 = cable.points[i + 1];
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
    return length + (cable.slack || 0);
  }

  async getTechnicalMemorial(projectId: string, user: any) {
    const project = await this.projectsService.findOne(projectId, user);
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    const [poles, boxes, cables, splitters, onus] = await Promise.all([
      this.polesRepository.count({ where: { projectId } }),
      this.boxesRepository.find({ where: { projectId } }),
      this.cablesRepository.find({ where: { projectId } }),
      this.splittersRepository.find({ where: { projectId } }),
      this.onusRepository.find({ where: { projectId } }),
    ]);

    const boxTypes: Record<string, number> = {};
    boxes.forEach((b) => {
      boxTypes[b.type] = (boxTypes[b.type] || 0) + 1;
    });

    const cableMeters: Record<string, number> = {};
    cables.forEach((c) => {
      const length = this.calculateCableLength(c);
      cableMeters[c.type] = (cableMeters[c.type] || 0) + length;
    });

    // BOM Calculation
    const defaultPrices = {
      pole: 350, // Default price R$ 350,00
      poleRental: 15.0, // Default rental R$ 15,00 / pole
      box: { cto: 180, ce: 120, reserve: 80 },
      cable: { as80: 2.5, as120: 3.5, underground: 5.0, drop: 1.2 },
      activation: 150.0, // Default activation R$ 150,00
    };

    const prices = (project.settings?.prices || defaultPrices) as any;

    const bom: any[] = [];
    let grandTotal = 0;

    // Poles
    const poleTotal = poles * (prices.pole || defaultPrices.pole);
    bom.push({
      item: 'Posteação (Aquisição)',
      quantity: poles,
      unit: 'un',
      unitPrice: prices.pole || defaultPrices.pole,
      total: poleTotal,
    });
    grandTotal += poleTotal;

    // Pole Rental (Monthly/Onetime estimate)
    const rentalUnitPrice = prices.poleRental || defaultPrices.poleRental;
    const rentalTotal = poles * rentalUnitPrice;
    bom.push({
      item: 'Aluguel de Postes (Ocupação)',
      quantity: poles,
      unit: 'un',
      unitPrice: rentalUnitPrice,
      total: rentalTotal,
    });
    grandTotal += rentalTotal;

    // Boxes
    Object.entries(boxTypes).forEach(([type, count]) => {
      const unitPrice =
        (prices.box && prices.box[type]) ||
        (defaultPrices.box as any)[type] ||
        150;
      const total = count * unitPrice;
      bom.push({
        item: `Caixa ${type.toUpperCase()}`,
        quantity: count,
        unit: 'un',
        unitPrice,
        total,
      });
      grandTotal += total;
    });

    // Cables
    Object.entries(cableMeters).forEach(([type, meters]) => {
      const unitPrice =
        (prices.cable && prices.cable[type]) ||
        (defaultPrices.cable as any)[type] ||
        2.0;
      const total = meters * unitPrice;
      bom.push({
        item: `Cabo ${type.toUpperCase()}`,
        quantity: parseFloat(meters.toFixed(1)),
        unit: 'm',
        unitPrice,
        total,
      });
      grandTotal += total;
    });

    // Customer Activations
    const activationPrice = prices.activation || defaultPrices.activation;
    const activationTotal = onus.length * activationPrice;
    bom.push({
      item: 'Ativação de Cliente (ONU/Drop)',
      quantity: onus.length,
      unit: 'un',
      unitPrice: activationPrice,
      total: activationTotal,
    });
    grandTotal += activationTotal;

    return {
      projectName: project.name,
      customer: project.tenant?.name || project.tenantId,
      status: project.status,
      date: new Date(),
      summary: {
        totalPoles: poles,
        totalBoxes: boxes.length,
        totalCablesMeters: Object.values(cableMeters).reduce(
          (a, b) => a + b,
          0,
        ),
        totalSplitters: splitters.length,
        totalCustomers: onus.length,
      },
      details: {
        boxes: boxTypes,
        cables: cableMeters,
      },
      bom: {
        items: bom,
        grandTotal,
      },
    };
  }

  async addBoxImage(boxId: string, imageUrl: string) {
    const box = await this.boxesRepository.findOne({ where: { id: boxId } });
    if (!box) throw new NotFoundException('Box not found');

    const images = box.images || [];
    images.push(imageUrl);
    box.images = images;

    return this.boxesRepository.save(box);
  }

  async getAuditLogs(tenantId: string) {
    return this.auditLogsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100, // Limit to latest 100 for performance
    });
  }

  async getNetworkAnalytics(tenantId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // 1. MTTR (Mean Time To Repair/Resolve)
    const completedWOs = await this.workOrdersRepository.find({
      where: { tenantId, status: 'COMPLETED' },
      select: ['createdAt', 'completedAt'],
    });

    let totalResolutionTime = 0;
    completedWOs.forEach((wo) => {
      if (wo.completedAt) {
        totalResolutionTime +=
          wo.completedAt.getTime() - wo.createdAt.getTime();
      }
    });
    const mttrHours =
      completedWOs.length > 0
        ? totalResolutionTime / completedWOs.length / (1000 * 60 * 60)
        : 0;

    // 2. Network Growth (ONUs authorized per month)
    const onus = await this.onusRepository.find({
      where: { tenantId, isAuthorized: true },
      select: ['id', 'createdAt'],
    });

    const growthMap = new Map();
    onus.forEach((onu) => {
      const month = onu.createdAt.toISOString().slice(0, 7); // YYYY-MM
      growthMap.set(month, (growthMap.get(month) || 0) + 1);
    });

    const growthData = Array.from(growthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 3. Technician Productivity
    const techStats = await this.workOrdersRepository
      .createQueryBuilder('wo')
      .select('wo.technicianName', 'name')
      .addSelect('COUNT(wo.id)', 'completed')
      .where('wo.tenantId = :tenantId', { tenantId })
      .andWhere('wo.status = :status', { status: 'COMPLETED' })
      .groupBy('wo.technicianName')
      .getRawMany();

    return {
      mttrHours: parseFloat(mttrHours.toFixed(2)),
      growthData,
      techStats,
      totalWorkOrders: await this.workOrdersRepository.count({
        where: { tenantId },
      }),
    };
  }

  // --- Work Order & Provisioning ---

  async createWorkOrder(data: Partial<WorkOrder>, user: any) {
    const wo = this.workOrdersRepository.create({
      ...data,
      tenantId: user.tenantId,
      status: 'PENDING',
    });
    return this.workOrdersRepository.save(wo);
  }

  async getWorkOrders(tenantId: string) {
    return this.workOrdersRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateWorkOrder(
    id: string,
    data: Partial<WorkOrder>,
    tenantId: string,
  ) {
    await this.workOrdersRepository.update({ id, tenantId }, data);
    return this.workOrdersRepository.findOne({ where: { id, tenantId } });
  }

  async deleteWorkOrder(id: string, tenantId: string) {
    return this.workOrdersRepository.delete({ id, tenantId });
  }

  async rebootOnu(onuId: string, tenantId: string) {
    const onu = await this.onusRepository.findOne({
      where: { id: onuId, tenantId },
      relations: ['olt'],
    });
    if (!onu) throw new NotFoundException('ONU não encontrada');

    // SNMP Command to reboot (Interface reset or specific ONU OID)
    await this.snmpService.rebootOnu(
      onu.olt.ipAddress,
      onu.olt.community,
      onu.ponPort,
      onu.serialNumber,
    );

    return {
      success: true,
      message: `Comando de reboot enviado para ONU ${onu.serialNumber}`,
    };
  }

  async bulkRebootOnus(onuIds: string[], tenantId: string) {
    this.logger.log(`[BULK] Rebooting ${onuIds.length} ONUs for tenant ${tenantId}`);
    const results = [];

    for (const id of onuIds) {
      try {
        await this.rebootOnu(id, tenantId);
        results.push({ id, success: true });
      } catch (error) {
        this.logger.error(`Failed to reboot ONU ${id}:`, error);
        results.push({ id, success: false, error: error.message });
      }
    }

    return { success: true, processed: results.length, results };
  }

  async authorizeOnu(onuId: string, tenantId: string) {
    const onu = await this.onusRepository.findOne({
      where: { id: onuId, tenantId },
      relations: ['olt'],
    });
    if (!onu) throw new NotFoundException('ONU não encontrada');

    await this.snmpService.authorizeOnu(
      onu.olt.ipAddress,
      onu.olt.community,
      onu.ponPort,
      onu.serialNumber,
    );

    await this.onusRepository.update(onuId, { isAuthorized: true });

    return {
      success: true,
      message: `ONU ${onu.serialNumber} autorizada com sucesso`,
    };
  }

  async bulkAuthorizeOnus(onuIds: string[], tenantId: string) {
    this.logger.log(`[BULK] Authorizing ${onuIds.length} ONUs for tenant ${tenantId}`);
    const results = [];

    for (const id of onuIds) {
      try {
        await this.authorizeOnu(id, tenantId);
        results.push({ id, success: true });
      } catch (error) {
        this.logger.error(`Failed to authorize ONU ${id}:`, error);
        results.push({ id, success: false, error: error.message });
      }
    }

    return { success: true, processed: results.length, results };
  }

  async updateOnu(id: string, data: Partial<Onu>, tenantId: string) {
    const onu = await this.onusRepository.findOne({
      where: { id, tenantId },
      relations: ['olt'],
    });
    if (!onu) throw new NotFoundException('ONU não encontrada');

    // If name changed, we might want to push it to the OLT via SNMP as well
    if (data.name && data.name !== onu.name) {
      try {
        await this.snmpService.setOnuName(
          onu.olt.ipAddress,
          onu.olt.community,
          onu.ponPort,
          onu.serialNumber,
          data.name,
        );
      } catch (e) {
        console.error('Failed to update ONU name on hardware:', e);
      }
    }

    await this.onusRepository.update({ id, tenantId }, data);
    return this.onusRepository.findOne({ where: { id, tenantId } });
  }

  // ==================== OLT Discovery Methods ====================

  async runOltDiscovery(oltId: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId },
    });
    if (!olt) throw new NotFoundException('OLT not found');

    this.logger.log(`[OLT_DISCOVERY] Starting discovery for OLT ${olt.name}`);
    const result = await this.oltDiscoveryService.discoverOlt(oltId);
    this.logger.log(
      `[OLT_DISCOVERY] Completed: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    );

    return result;
  }

  async getOltDiscovery(oltId: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId },
    });
    if (!olt) throw new NotFoundException('OLT not found');

    return {
      capabilities: olt.capabilities,
      discoveryResults: olt.discoveryResults,
      sysDescr: olt.sysDescr,
      sysObjectID: olt.sysObjectID,
    };
  }

  async getOltPonPorts(oltId: string, tenantId: string) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId },
    });
    if (!olt) throw new NotFoundException('OLT not found');

    return await this.ponPortsRepository.find({
      where: { oltId, tenantId },
      order: { ifIndex: 'ASC' },
    });
  }

  isOltDiscoveryActive(oltId: string): boolean {
    return this.oltDiscoveryService.isDiscoveryActive(oltId);
  }

  isOltIpDiscoveryActive(ip: string): boolean {
    return this.oltDiscoveryService.isIpDiscoveryActive(ip);
  }
  async testOltCliConnection(data: any) {
    const { ipAddress, cliProtocol, cliUsername, cliPassword, id } = data;
    this.logger.log(
      `[CLI_TEST] Testando conexão ${cliProtocol.toUpperCase()} para ${ipAddress}...`,
    );

    try {
      let password = cliPassword;

      // Se a senha vier vazia (modo edição), buscamos do banco
      if (!password && id) {
        const olt = await this.oltsRepository
          .createQueryBuilder('olt')
          .addSelect('olt.cliPassword')
          .where('olt.id = :id', { id })
          .getOne();
        password = olt?.cliPassword;
      }

      if (!password) {
        throw new Error(
          'Senha não fornecida e nenhuma senha salva encontrada.',
        );
      }

      // Tentar rodar um comando simples para validar
      const command = 'show version'; // Comando comum que não causa dano
      const output = await this.oltCliService.executeCommand(
        ipAddress,
        cliProtocol,
        { username: cliUsername, password },
        command,
      );

      this.logger.log(`[CLI_TEST] Sucesso na conexão com ${ipAddress}`);
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        output: output.substring(0, 100),
      };
    } catch (error) {
      this.logger.error(
        `[CLI_TEST] Falha na conexão com ${ipAddress}: ${error.message}`,
      );
      return { success: false, message: `Falha na conexão: ${error.message}` };
    }
  }

  async applyOltTemplate(oltId: string, templateType: string, user: any) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId: user.tenantId },
    });
    if (!olt) throw new NotFoundException('OLT não encontrada.');

    this.logger.log(
      `[TIPO_FACIL] Aplicando modelo "${templateType}" para OLT ${olt.name}`,
    );

    // Limpar portas existentes primeiro
    await this.ponPortsRepository.delete({ oltId });

    const newPorts = [];
    if (templateType === 'cianet_8pon' || templateType === 'generic_8pon') {
      for (let i = 1; i <= 8; i++) {
        newPorts.push(
          this.ponPortsRepository.create({
            oltId,
            ifIndex: 100 + i,
            ifDescr: `PON 1/1/${i}`,
            ifOperStatus: 1,
            tenantId: user.tenantId,
          }),
        );
      }
    } else if (templateType === 'generic_16pon') {
      for (let i = 1; i <= 16; i++) {
        newPorts.push(
          this.ponPortsRepository.create({
            oltId,
            ifIndex: 100 + i,
            ifDescr: `PON 1/1/${i}`,
            ifOperStatus: 1,
            tenantId: user.tenantId,
          }),
        );
      }
    } else {
      throw new Error('Modelo desconhecido.');
    }

    await this.ponPortsRepository.save(newPorts);

    // Atualizar resultados de descoberta para refletir sucesso manual
    olt.discoveryResults = {
      lastRun: new Date(),
      status: 'success',
      errors: [`Modelo ${templateType} aplicado manualmente`],
    };
    await this.oltsRepository.save(olt);

    return { success: true, count: newPorts.length };
  }

  async createManualPonPort(oltId: string, data: any, user: any) {
    const olt = await this.oltsRepository.findOne({
      where: { id: oltId, tenantId: user.tenantId },
    });
    if (!olt) throw new NotFoundException('OLT não encontrada.');

    const port = this.ponPortsRepository.create({
      ...data,
      oltId,
      tenantId: user.tenantId,
      ifOperStatus: 1, // Default up
    });

    return this.ponPortsRepository.save(port);
  }

  async deletePonPort(id: string, user: any) {
    const port = await this.ponPortsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });
    if (!port) throw new NotFoundException('Porta PON não encontrada.');
    return this.ponPortsRepository.remove(port);
  }
}
