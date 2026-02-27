"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let PingService = PingService_1 = class PingService {
    logger = new common_1.Logger(PingService_1.name);
    async ping(host, count = 4) {
        try {
            const { stdout } = await execAsync(`ping -n ${count} ${host}`, {
                timeout: 10000,
            });
            const timeMatch = stdout.match(/Average = (\d+)ms/i);
            const lossMatch = stdout.match(/\((\d+)% loss\)/i);
            const responseTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
            const packetLoss = lossMatch ? parseInt(lossMatch[1]) : 100;
            return {
                online: packetLoss < 100,
                responseTime,
                packetLoss,
            };
        }
        catch (error) {
            this.logger.error(`Ping failed for ${host}: ${error.message}`);
            return {
                online: false,
                packetLoss: 100,
            };
        }
    }
    async quickPing(host) {
        const result = await this.ping(host, 1);
        return result.online;
    }
};
exports.PingService = PingService;
exports.PingService = PingService = PingService_1 = __decorate([
    (0, common_1.Injectable)()
], PingService);
//# sourceMappingURL=ping.service.js.map