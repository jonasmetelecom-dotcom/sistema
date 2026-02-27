"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var OltCliService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OltCliService = void 0;
const common_1 = require("@nestjs/common");
const Client = __importStar(require("ssh2"));
const telnet_client_1 = require("telnet-client");
let OltCliService = OltCliService_1 = class OltCliService {
    logger = new common_1.Logger(OltCliService_1.name);
    async executeCommand(host, protocol, config, command) {
        return this.executeCommandSequence(host, protocol, config, [command]);
    }
    async executeCommandSequence(host, protocol, config, commands) {
        if (protocol === 'ssh') {
            const results = [];
            for (const cmd of commands) {
                results.push(await this.executeSsh(host, config, cmd));
            }
            return results.join('\n');
        }
        else {
            return this.executeTelnetSequence(host, config, commands);
        }
    }
    async executeTelnetSequence(host, config, commands) {
        const connection = new telnet_client_1.Telnet();
        const params = {
            host,
            port: config.port || 23,
            shellPrompt: config.shellPrompt || /[\s\w-\(\)]*[>#\]]\s*$/,
            timeout: 30000,
            negotiationMandatory: false,
            loginPrompt: config.loginPrompt || /(login|User Name|username):/i,
            passwordPrompt: config.passwordPrompt || /password:/i,
            username: config.username,
            password: config.password,
            initialCtrlC: true,
            sendInitialData: '\n',
        };
        try {
            this.logger.log(`[TELNET] Conectando em ${host}...`);
            await connection.connect(params);
            let finalOutput = '';
            for (const command of commands) {
                this.logger.log(`[TELNET] Executando: ${command}`);
                const res = await connection.exec(command);
                finalOutput += res + '\n';
            }
            await connection.end();
            return finalOutput;
        }
        catch (error) {
            this.logger.error(`[TELNET] Erro em ${host}: ${error.message}`);
            try {
                await connection.end();
            }
            catch (e) { }
            throw error;
        }
    }
    executeSsh(host, config, command) {
        return new Promise((resolve, reject) => {
            const conn = new Client.Client();
            let output = '';
            conn
                .on('ready', () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }
                    stream
                        .on('data', (data) => {
                        output += data.toString();
                    })
                        .on('close', () => {
                        conn.end();
                        resolve(output);
                    });
                });
            })
                .on('error', (err) => {
                reject(err);
            })
                .connect({
                host,
                port: config.port || 22,
                username: config.username,
                password: config.password,
                readyTimeout: 15000,
            });
        });
    }
    async executeTelnet(host, config, command) {
        const connection = new telnet_client_1.Telnet();
        const params = {
            host,
            port: config.port || 23,
            shellPrompt: config.shellPrompt || /[\s\w]*[>#\]]\s*$/,
            timeout: 30000,
            negotiationMandatory: false,
            loginPrompt: config.loginPrompt || /(login|User Name):/i,
            passwordPrompt: config.passwordPrompt || /password:/i,
            username: config.username,
            password: config.password,
        };
        try {
            this.logger.log(`[TELNET] Tentando conectar em ${host} com params: ${JSON.stringify({ ...params, password: '***' })}`);
            await connection.connect(params);
            this.logger.log(`[TELNET] Conectado! Executando: ${command}`);
            const res = await connection.exec(command);
            this.logger.log(`[TELNET] Comando executado com sucesso.`);
            await connection.end();
            return res;
        }
        catch (error) {
            this.logger.error(`[TELNET] Erro na conexão/comando em ${host}: ${error.message}`);
            throw error;
        }
    }
    async getOpticalSignals(host, protocol, config) {
        const signals = new Map();
        try {
            const commands = [
                'enable',
                'terminal length 0',
                'show pon power attenuation',
                'show gpon onu optical-info',
                'show onu optical-info'
            ];
            this.logger.log(`[CLI-SIGNAL] Attempting to fetch signals from ${host}...`);
            const output = await this.executeCommandSequence(host, protocol, config, commands);
            const lines = output.split('\n');
            lines.forEach((line) => {
                const mSerial = line.match(/(?:SN:|Serial:|MAC:)?\s*([A-Za-z0-9]{12,16})/);
                const mPower = line.match(/(?:Rx:|Power:|Level:)?\s*(-?\d{1,3}\.\d+)/);
                if (mSerial && mPower) {
                    const serial = mSerial[1].toUpperCase();
                    const power = parseFloat(mPower[1]);
                    if (power > -50 && power < 10 && !signals.has(serial)) {
                        signals.set(serial, power);
                    }
                }
            });
            this.logger.log(`[CLI-SIGNAL] CLI fetch complete. Found ${signals.size} signals.`);
        }
        catch (e) {
            this.logger.warn(`[CLI-SIGNAL] Failed to fetch signals via CLI from ${host}: ${e.message}`);
        }
        return signals;
    }
};
exports.OltCliService = OltCliService;
exports.OltCliService = OltCliService = OltCliService_1 = __decorate([
    (0, common_1.Injectable)()
], OltCliService);
//# sourceMappingURL=olt-cli.service.js.map