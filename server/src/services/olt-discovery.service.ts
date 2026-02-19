import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as snmp from 'net-snmp';
import { Olt } from '../network-elements/entities/olt.entity';
import { PonPort } from '../network-elements/entities/pon-port.entity';
import { Onu } from '../network-elements/entities/onu.entity';
import { OltCliService } from './olt-cli.service';
import { SnmpService } from './snmp.service';

export interface DiscoveryResult {
  success: boolean;
  sysDescr?: string;
  sysObjectID?: string;
  ponPorts?: PonPort[];
  discoveredOnus?: any[]; // ONUs found during discovery
  capabilities?: {
    pon_status_snmp: boolean;
    pon_traffic_snmp: boolean;
    uplink_power_snmp: boolean;
    onu_power_snmp: boolean;
    onu_power_cli: 'unknown' | 'true' | 'false';
  };
  errors: string[];
}

@Injectable()
export class OltDiscoveryService {
  private readonly logger = new Logger(OltDiscoveryService.name);

  constructor(
    @InjectRepository(Olt)
    private oltsRepository: Repository<Olt>,
    @InjectRepository(PonPort)
    private ponPortsRepository: Repository<PonPort>,
    @InjectRepository(Onu)
    private onusRepository: Repository<Onu>,
    private oltCliService: OltCliService,
    private snmpService: SnmpService,
  ) { }

  private activeDiscoveries = new Set<string>();
  private activeIps = new Set<string>();

  /**
   * Main discovery method - orchestrates all discovery steps
   */
  async discoverOlt(oltId: string): Promise<DiscoveryResult> {
    if (this.activeDiscoveries.has(oltId)) {
      this.logger.warn(
        `[DISCOVERY] Discovery already in progress for OLT ${oltId}.`,
      );
      this.activeDiscoveries.delete(oltId);
    }

    const olt = await this.oltsRepository
      .createQueryBuilder('olt')
      .addSelect('olt.cliPassword')
      .where('olt.id = :id', { id: oltId })
      .getOne();

    if (!olt) throw new Error(`OLT ${oltId} not found`);

    this.activeDiscoveries.add(oltId);
    if (olt.ipAddress) this.activeIps.add(olt.ipAddress);

    await this.oltsRepository.update(oltId, {
      discoveryResults: { lastRun: new Date(), status: 'running', errors: [] },
    });

    const result: DiscoveryResult = {
      success: false,
      errors: [],
      capabilities: {
        pon_status_snmp: false,
        pon_traffic_snmp: false,
        uplink_power_snmp: false,
        onu_power_snmp: false,
        onu_power_cli: 'unknown',
      },
    };

    try {
      await this.performDiscoverySteps(olt, result, oltId);
    } catch (saveError) {
      this.logger.error(`[DISCOVERY] Discovery failed: ${saveError.message}`);
      result.errors.push(saveError.message);
    } finally {
      this.activeDiscoveries.delete(oltId);
      if (olt.ipAddress) this.activeIps.delete(olt.ipAddress);
    }

    return result;
  }

  isDiscoveryActive(oltId: string): boolean {
    return this.activeDiscoveries.has(oltId);
  }

  isIpDiscoveryActive(ip: string): boolean {
    return this.activeIps.has(ip);
  }

  private async performDiscoverySteps(
    olt: Olt,
    result: DiscoveryResult,
    oltId: string,
  ): Promise<void> {
    // Step 1: Discover Identity
    let identity = await this.discoverIdentity(olt.ipAddress, olt.community);
    if (
      identity.sysObjectID === 'unknown' &&
      olt.cliUsername &&
      (olt as any).cliPassword
    ) {
      const cliInfo = await this.discoverIdentityViaCli(olt);
      if (cliInfo) identity = cliInfo;
    }
    result.sysDescr = identity.sysDescr;
    result.sysObjectID = identity.sysObjectID;

    // Step 2: Discover PON Ports
    let ponPorts = await this.discoverPonPorts(
      olt.ipAddress,
      olt.community,
      olt.tenantId,
    );
    if (ponPorts.length === 0 && olt.cliUsername && (olt as any).cliPassword) {
      ponPorts = await this.discoverPonPortsViaCli(olt, identity.sysObjectID);
    }
    result.ponPorts = ponPorts;

    // Step 3 & 4: Sensoring
    if (result.capabilities) {
      result.capabilities.uplink_power_snmp = await this.discoverUplinkPower(
        olt.ipAddress,
        olt.community,
      );
      const onuPower = await this.discoverOnuPowerCapability(
        olt.ipAddress,
        olt.community,
      );
      result.capabilities.onu_power_snmp = onuPower;
    }

    // Step 5: DEEP DISCOVERY - Live ONUs
    this.logger.log(`[DESCOBERTA] Passo 5: Consultando ONUs em tempo real...`);
    const liveOnus = await this.getOnusLive(olt, identity.sysObjectID);
    result.discoveredOnus = liveOnus;

    // Save results to DB
    await this.saveDiscoveryResults(oltId, result);
    result.success = true;
  }

  /**
   * Core Live Discovery Method - Used for both initial Discovery and On-Demand Real-time view
   */
  public async getOnusLive(
    olt: Olt,
    detectedSysObjectID?: string,
  ): Promise<any[]> {
    this.logger.log(
      `[LIVE] Iniciando varredura paralela CLI + SNMP para OLT ${olt.ipAddress}`,
    );

    const results = await Promise.allSettled([
      // 1. CLI Scan (High precision for names/Cianet)
      (async () => {
        if (olt.cliUsername && (olt as any).cliPassword) {
          return await Promise.race([
            this.discoverOnusViaCli(olt, detectedSysObjectID),
            new Promise<any[]>((_, reject) =>
              setTimeout(
                () => reject(new Error('CLI Discovery Timeout (30s)')),
                30000,
              ),
            ),
          ]);
        }
        return [];
      })(),
      // 2. SNMP Scan (Wide inventory)
      this.snmpService.getOltOnus(olt.ipAddress, olt.community),
    ]);

    const cliOnus: any[] =
      results[0].status === 'fulfilled' ? results[0].value : [];
    const snmpOnus: any[] =
      results[1].status === 'fulfilled' ? results[1].value : [];

    if (results[0].status === 'rejected') {
      this.logger.error(
        `[LIVE] CLI Discovery failed or timed out: ${results[0].reason}`,
      );
    }
    if (results[1].status === 'rejected') {
      this.logger.error(`[LIVE] SNMP Discovery failed: ${results[1].reason}`);
    }

    this.logger.log(
      `[LIVE] Resultados brutos: CLI=${cliOnus.length}, SNMP=${snmpOnus.length}`,
    );

    // 2.5 Fetch Optical Signals based on Monitoring Method
    let signalMap = new Map<string, number>();
    const method = olt.monitoringMethod || 'auto';

    this.logger.log(`[LIVE] Signal Fetch Strategy: ${method.toUpperCase()}`);

    try {
      if (method === 'snmp') {
        signalMap = await this.snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
      } else if (method === 'cli') {
        if (olt.cliUsername && (olt as any).cliPassword) {
          signalMap = await this.oltCliService.getOpticalSignals(
            olt.ipAddress,
            olt.cliProtocol as any,
            { username: olt.cliUsername, password: (olt as any).cliPassword }
          );
        } else {
          this.logger.error(`[LIVE] Method is CLI but credentials are missing for ${olt.ipAddress}`);
        }
      } else {
        // Auto: Try SNMP first, fallback to CLI
        try {
          signalMap = await this.snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
          if (signalMap.size === 0 && olt.cliUsername) {
            this.logger.log('[LIVE] SNMP yielded no signals, trying CLI fallback...');
            throw new Error('SNMP Empty');
          }
        } catch (snmpErr) {
          if (olt.cliUsername && (olt as any).cliPassword) {
            signalMap = await this.oltCliService.getOpticalSignals(
              olt.ipAddress,
              olt.cliProtocol as any,
              { username: olt.cliUsername, password: (olt as any).cliPassword }
            );
          }
        }
      }
    } catch (e) {
      this.logger.warn(`[LIVE] Failed to fetch optical signals via ${method}: ${e.message}`);
    }

    // 3. Intelligent Merge & Hardware Source of Truth
    // Para OLTs Cianet que suportam CLI, o Telnet é o DONO DA VERDADE.
    // Se encontramos algo no CLI, não permitimos que o SNMP adicione "fantasmas".
    if (cliOnus.length > 0 || snmpOnus.length > 0) {
      this.logger.log(
        `[LIVE] Modo Unificado: Unindo inventário CLI (${cliOnus.length}) e SNMP (${snmpOnus.length}) para OLT ${olt.ipAddress}.`,
      );
      const all = new Map<string, any>();

      // 1. Add all from SNMP (wide inventory)
      snmpOnus.forEach((o) => {
        const signal = signalMap.get(o.serialNumber);
        all.set(o.serialNumber, {
          ...o,
          discoverySource: 'snmp',
          signalLevel: signal !== undefined ? signal : null // Use Map or Null
        });
      });

      // 2. Add/Enrich from CLI (Specific for Cianet/Huawei names/status)
      cliOnus.forEach((o) => {
        const existing = all.get(o.serialNumber);
        const signal = signalMap.get(o.serialNumber);

        // Prioritize: 
        // 1. Real-time fetched signal (signalMap)
        // 2. Existing signal from previous fetch (if strictly needed, but here we rebuild)
        // 3. Signal from the CLI discovery itself (if it parsed it)
        // 4. Null (do not fake it)

        let finalSignal: number | null = null;
        if (signal !== undefined) finalSignal = signal;
        else if (o.signalLevel && o.signalLevel !== -20.0) finalSignal = o.signalLevel;

        if (existing) {
          all.set(o.serialNumber, {
            ...existing,
            ...o,
            // Mantemos a porta do CLI se disponível, pois costuma ser mais amigável
            ponPort: o.ponPort || existing.ponPort,
            discoverySource: 'both',
            signalLevel: finalSignal ?? existing.signalLevel
          });
        } else {
          all.set(o.serialNumber, {
            ...o,
            discoverySource: 'cli',
            signalLevel: finalSignal
          });
        }
      });

      const final = Array.from(all.values());
      await this.saveDiscoveryResults(
        olt.id,
        { success: true, discoveredOnus: final, errors: [] },
        true,
      );
      return final;
    }

    const all = new Map<string, any>();
    snmpOnus.forEach((o) => {
      const signal = signalMap.get(o.serialNumber);
      all.set(o.serialNumber, {
        ...o,
        signalLevel: signal !== undefined ? signal : null
      });
    });
    const final = Array.from(all.values());

    this.logger.log(
      `[LIVE] Unificação concluída (SNMP Fallback): ${final.length} ONUs retornadas.`,
    );
    await this.saveDiscoveryResults(
      olt.id,
      { success: true, discoveredOnus: final, errors: [] },
      true,
    );
    return final;
  }

  private async discoverIdentity(
    ip: string,
    community: string,
  ): Promise<{ sysDescr: string; sysObjectID: string }> {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, community, {
        timeout: 3000,
        retries: 1,
      });
      session.get(
        ['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.2.0'],
        (error, varbinds) => {
          if (error || !varbinds || varbinds.length < 2) {
            session.close();
            resolve({ sysDescr: 'Unknown', sysObjectID: 'unknown' });
            return;
          }
          const res = {
            sysDescr: varbinds[0]?.value?.toString() || 'Unknown',
            sysObjectID: varbinds[1]?.value?.toString() || 'unknown',
          };
          session.close();
          resolve(res);
        },
      );
    });
  }

  private async discoverIdentityViaCli(
    olt: Olt,
  ): Promise<{ sysDescr: string; sysObjectID: string } | null> {
    try {
      const out = await this.oltCliService.executeCommand(
        olt.ipAddress,
        olt.cliProtocol as any,
        { username: olt.cliUsername, password: (olt as any).cliPassword },
        'show version',
      );
      if (out.toLowerCase().includes('cianet'))
        return { sysDescr: 'Cianet OLT', sysObjectID: '.1.3.6.1.4.1.33369' };
      return { sysDescr: 'Generic OLT (CLI)', sysObjectID: 'generic_cli' };
    } catch {
      return null;
    }
  }

  private async discoverPonPorts(
    ip: string,
    community: string,
    tenantId: string,
  ): Promise<PonPort[]> {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, community, {
        timeout: 4000,
        retries: 1,
      });
      const interfaces: any[] = [];
      session.walk(
        '1.3.6.1.2.1.2.2.1.2',
        20,
        (vbs) => {
          vbs.forEach((vb) => {
            if (vb.oid && vb.value) {
              interfaces.push({
                ifIndex: parseInt(vb.oid.split('.').pop()!),
                ifDescr: vb.value.toString(),
              });
            }
          });
        },
        (err) => {
          session.close();
          const filtered = interfaces
            .filter((i) => /pon|gpon|epon/i.test(i.ifDescr))
            .map((i) => ({ ...i, tenantId, ifOperStatus: 1 }));
          resolve(filtered as any);
        },
      );
    });
  }

  private async discoverPonPortsViaCli(
    olt: Olt,
    sysId?: string,
  ): Promise<PonPort[]> {
    const out = await this.oltCliService.executeCommandSequence(
      olt.ipAddress,
      olt.cliProtocol as any,
      { username: olt.cliUsername, password: (olt as any).cliPassword },
      ['enable', 'terminal length 0', 'show interface brief'],
    );
    const pons: PonPort[] = [];
    out.split('\n').forEach((line, i) => {
      const m = line.match(/(pon|gpon|epon)\s*([\d\/:\-]+)/i);
      if (m)
        pons.push({
          ifIndex: 2000 + i,
          ifDescr: m[0],
          tenantId: olt.tenantId,
          ifOperStatus: 1,
        } as any);
    });
    return pons;
  }

  private async discoverUplinkPower(
    ip: string,
    community: string,
  ): Promise<boolean> {
    return true; // Simplificado
  }

  private async discoverOnuPowerCapability(
    ip: string,
    community: string,
  ): Promise<boolean> {
    return false;
  }

  private async discoverOnusViaCli(olt: Olt, sysId?: string): Promise<any[]> {
    const isCianet =
      (sysId || olt.sysObjectID || '').includes('33369') ||
      (olt.sysDescr || '').toLowerCase().includes('cianet') ||
      !!(olt.cliUsername && (olt as any).cliPassword);

    if (!isCianet) return [];
    const cmds = [
      'enable',
      'terminal length 0',
      'screen-length 0 temp',
      // Apenas os comandos que trazem o hardware REAL e ATIVO (evita configuração de ONUs mortas)
      'show gpon onu information all',
      'show gpon onu unconfigured',
      'show onu information all',
      'show onu unconfigured',
    ];
    const out = await this.oltCliService.executeCommandSequence(
      olt.ipAddress,
      olt.cliProtocol as any,
      { username: olt.cliUsername, password: (olt as any).cliPassword },
      cmds,
    );
    const discovered: any[] = [];
    const lines = out.split('\n');
    lines.forEach((line) => {
      // Regex Ultra-Flexível: Busca um padrão de porta e um padrão de serial em qualquer lugar da linha
      const mPort = line.match(/([\d\/]+[:\s]+\d+)/);
      const mSerial = line.match(/(?:sn:|mac:)?([a-zA-Z0-9]{10,20})/i); // Aumentado para 10-20 chars
      const mStatus = line.match(
        /(operational|online|reg|offline|discovery|logging|up|down|config)/i,
      );

      if (mPort && mSerial) {
        const fullPortRaw = mPort[1].split(/[:\s]+/)[0].trim();
        const serialNumber = mSerial[1]
          .replace(/[:.-]/g, '')
          .toUpperCase()
          .trim();
        const status = mStatus
          ? /online|reg|operational|up|config/i.test(mStatus[1])
            ? 'online'
            : 'offline'
          : 'online';
        const ponPort = this.normalizePonPort(fullPortRaw);

        if (!discovered.find((o) => o.serialNumber === serialNumber)) {
          discovered.push({
            serialNumber: serialNumber,
            ponPort: ponPort,
            status: status,
            name: `ONU ${serialNumber.substring(0, 6)}`,
            // signalLevel: -20.0, // Removed hardcode, now fetched via SNMP
          });
        }
      }
    });
    return discovered;
  }

  private normalizePonPort(port: string): string {
    if (!port) return '1/1';
    const trimmed = port.trim().toUpperCase();

    // 1. Match shelf/slot/port:index (0/1/1:2 -> 1/1)
    const mThree = trimmed.match(/(\d+)\/(\d+)\/(\d+)(?::\d+)?$/);
    if (mThree) {
      const slot = parseInt(mThree[2]);
      const portNum = parseInt(mThree[3]);
      return `${slot === 0 ? 1 : slot}/${portNum}`;
    }

    // 2. Match slot/port:index (1/1:5 -> 1/1)
    const mTwo = trimmed.match(/(\d+)[\/\-](\d+)(?::\d+)?$/);
    if (mTwo) {
      const slot = parseInt(mTwo[1]);
      const portNum = parseInt(mTwo[2]);
      return `${slot === 0 ? 1 : slot}/${portNum}`;
    }

    // 3. Match pure numbers (if just "1" is returned)
    const mOne = trimmed.match(/^(\d+)$/);
    if (mOne) {
      return `1/${mOne[1]}`;
    }

    // Fallback for weird formats like "GPA 1/1"
    const cleaned = trimmed.replace(/[A-Z\s]/g, '').replace(/^0\//, '1/');
    return cleaned.split(':')[0] || '1/1';
  }

  public async saveDiscoveryResults(
    oltId: string,
    result: DiscoveryResult,
    forceReset = false,
  ): Promise<void> {
    const olt = await this.oltsRepository.findOne({ where: { id: oltId } });
    if (!olt) return;

    // Se forceReset for true (Novo Scan manual), limpamos TUDO antes de salvar
    if (forceReset) {
      this.logger.log(
        `[DISCOVERY] Realizando Hard Reset (Deleção Total) para OLT ${oltId} antes de salvar novos dados.`,
      );
      await this.onusRepository.delete({ oltId });
    }

    await this.oltsRepository.update(oltId, {
      sysDescr: result.sysDescr,
      sysObjectID: result.sysObjectID,
      capabilities: result.capabilities,
      discoveryResults: {
        lastRun: new Date(),
        status: result.success ? 'success' : 'failed',
        errors: result.errors,
      },
    });

    if (result.ponPorts && result.ponPorts.length > 0) {
      await this.ponPortsRepository.delete({ oltId });
      await this.ponPortsRepository.save(
        result.ponPorts.map((p) => ({ ...p, oltId, tenantId: olt.tenantId })),
      );
    }

    if (result.discoveredOnus && result.discoveredOnus.length > 0) {
      // 1. Get current serials from hardware
      const currentSerials = result.discoveredOnus.map((o) => o.serialNumber);

      // 2. Remove "ghost" ONUs (Old data) that are no longer present on the OLT hardware
      // Limitamos a deleção apenas para esta OLT específica.
      await this.onusRepository
        .createQueryBuilder()
        .delete()
        .from(Onu)
        .where('oltId = :oltId', { oltId })
        .andWhere('serialNumber NOT IN (:...serials)', {
          serials: currentSerials,
        })
        .execute();

      this.logger.log(
        `[DISCOVERY] Limpeza concluída: ONUs antigas (fantasmas) removidas para OLT ${oltId}.`,
      );

      // 3. Update or create current ONUs
      for (const data of result.discoveredOnus) {
        const existing = await this.onusRepository.findOne({
          where: {
            serialNumber: data.serialNumber,
            oltId,
            tenantId: olt.tenantId,
          },
        });
        if (existing) {
          await this.onusRepository.update(existing.id, {
            status: data.status,
            ponPort: data.ponPort,
            signalLevel: data.signalLevel,
            lastSeen: data.status === 'online' ? new Date() : existing.lastSeen,
          });
        } else {
          await this.onusRepository.save(
            this.onusRepository.create({
              ...data,
              oltId,
              tenantId: olt.tenantId,
              isAuthorized: true,
            }),
          );
        }
      }
    }
  }
}
