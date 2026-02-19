import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NetworkElementsService } from '../network-elements/network-elements.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly networkElementsService: NetworkElementsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Starting background monitoring poll...');

    try {
      // Fetch all devices
      const [olts, rbs] = await Promise.all([
        this.networkElementsService.getAllOlts(),
        this.networkElementsService.getAllRbs(),
      ]);

      this.logger.log(
        `Polling ${olts.length} OLTs and ${rbs.length} RBS devices.`,
      );

      // Poll OLTs
      for (const olt of olts) {
        try {
          // Check if ANY OLT with this IP is currently being discovered manually
          if (
            this.networkElementsService.isOltIpDiscoveryActive(olt.ipAddress)
          ) {
            this.logger.log(
              `Skipping background poll for OLT ${olt.name} (${olt.ipAddress}) - Manual discovery on this IP in progress`,
            );
            continue;
          }

          await this.networkElementsService.pollDeviceStatus(olt.id, 'olt');

          // await this.networkElementsService.syncOnus(olt.id, olt.tenantId);
        } catch (error) {
          this.logger.error(`Failed to poll OLT ${olt.name}: ${error.message}`);
        }
      }

      // Poll RBS
      for (const rb of rbs) {
        try {
          await this.networkElementsService.pollDeviceStatus(rb.id, 'rbs');
          // this.logger.debug(`Polled RBS ${rb.name} (${rb.ipAddress})`);
        } catch (error) {
          this.logger.error(`Failed to poll RBS ${rb.name}: ${error.message}`);
        }
      }

      this.logger.debug('Background monitoring poll completed.');
    } catch (error) {
      this.logger.error('Error in monitoring cron job:', error);
    }
  }
}
