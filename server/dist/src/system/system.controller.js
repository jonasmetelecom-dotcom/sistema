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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let SystemController = class SystemController {
    async checkUpdate() {
        if (process.env.NODE_ENV === 'development') {
            return { updateAvailable: true, commitsBehind: 3, changelog: ['fix: bug 1', 'feat: new feature'] };
        }
        try {
            await execAsync('git fetch');
            const { stdout: countOut } = await execAsync('git rev-list HEAD...origin/main --count');
            const count = parseInt(countOut.trim(), 10);
            let changelog = [];
            if (count > 0) {
                const { stdout: logOut } = await execAsync('git log HEAD..origin/main --pretty=format:"%s" -n 10');
                changelog = logOut.split('\n').filter(line => line.trim() !== '');
            }
            return {
                updateAvailable: count > 0,
                commitsBehind: count,
                changelog
            };
        }
        catch (error) {
            console.error('Update check failed:', error);
            return { updateAvailable: false, error: 'Failed to check git status' };
        }
    }
    async triggerUpdate() {
        if (process.env.NODE_ENV === 'development') {
            return { message: 'In dev mode, update simulated.' };
        }
        const { spawn } = require('child_process');
        const path = require('path');
        const batchPath = path.resolve(__dirname, '../../../../update.bat');
        console.log(`[UPDATE] Triggering update script at ${batchPath}`);
        const subprocess = spawn('cmd.exe', ['/c', 'start', '/min', batchPath], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
        });
        subprocess.unref();
        return { message: 'Update started. The server will restart shortly.' };
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Get)('check-update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "checkUpdate", null);
__decorate([
    (0, common_1.Post)('trigger-update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "triggerUpdate", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)('system')
], SystemController);
//# sourceMappingURL=system.controller.js.map