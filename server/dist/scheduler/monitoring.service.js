"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const network_elements_service_1 = require("../network-elements/network-elements.service");
let MonitoringService = MonitoringService_1 = class MonitoringService {
    networkElementsService;
    logger = new common_1.Logger(MonitoringService_1.name);
    constructor(networkElementsService) {
        this.networkElementsService = networkElementsService;
    }
    async handleCron() {
        this.logger.debug('Starting background monitoring poll...');
        try {
            const [olts, rbs] = await Promise.all([
                this.networkElementsService.getAllOlts(),
                this.networkElementsService.getAllRbs(),
            ]);
            this.logger.log(`Polling ${olts.length} OLTs and ${rbs.length} RBS devices.`);
            for (const olt of olts) {
                try {
                    if (this.networkElementsService.isOltIpDiscoveryActive(olt.ipAddress)) {
                        this.logger.log(`Skipping background poll for OLT ${olt.name} (${olt.ipAddress}) - Manual discovery on this IP in progress`);
                        continue;
                    }
                    await this.networkElementsService.pollDeviceStatus(olt.id, 'olt');
                }
                catch (error) {
                    this.logger.error(`Failed to poll OLT ${olt.name}: ${error.message}`);
                }
            }
            for (const rb of rbs) {
                try {
                    await this.networkElementsService.pollDeviceStatus(rb.id, 'rbs');
                }
                catch (error) {
                    this.logger.error(`Failed to poll RBS ${rb.name}: ${error.message}`);
                }
            }
            this.logger.debug('Background monitoring poll completed.');
        }
        catch (error) {
            this.logger.error('Error in monitoring cron job:', error);
        }
    }
};
exports.MonitoringService = MonitoringService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "handleCron", null);
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [network_elements_service_1.NetworkElementsService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map