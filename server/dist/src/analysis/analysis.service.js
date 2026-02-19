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
var AnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AnalysisService = AnalysisService_1 = class AnalysisService {
    logger = new common_1.Logger(AnalysisService_1.name);
    logPath = path.join(process.cwd(), 'scan-debug.log');
    logToFile(message) {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(this.logPath, `[${timestamp}] ${message}\n`);
    }
    instances = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter',
        'https://overpass.osm.ch/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ];
    async countBuildingsPolygon(points) {
        const query = `[out:json][timeout:25];(nwr["building"](poly:"${points}"););out center;`;
        this.logger.log(`Scanning polygon area: ${points.substring(0, 50)}...`);
        this.logToFile(`SCAN POLYGON REQUEST: ${points}`);
        for (const baseUrl of this.instances) {
            try {
                const result = await this.queryInstance(baseUrl, query);
                this.logger.log(`Scan result for ${baseUrl}: ${result.buildings.length} buildings`);
                this.logToFile(`SCAN POLYGON SUCCESS (${baseUrl}): ${result.buildings.length} buildings`);
                return {
                    count: result.count,
                    buildings: result.buildings,
                    area: 'Polygon Selection',
                };
            }
            catch (e) {
                this.logger.warn(`Overpass instance ${baseUrl} failed: ${e.message}. Trying next...`);
                this.logToFile(`SCAN POLYGON TRY FAILED (${baseUrl}): ${e.message}`);
                continue;
            }
        }
        throw new Error('All Overpass API instances are currently busy or unavailable. Please try again in a few moments.');
    }
    async countBuildings(bounds) {
        const { south, west, north, east } = bounds;
        const query = `[out:json][timeout:25];(nwr["building"](${south},${west},${north},${east}););out center;`;
        const areaStr = `S:${south}, W:${west}, N:${north}, E:${east}`;
        this.logger.log(`Scanning area: ${areaStr}`);
        this.logToFile(`SCAN REQUEST: ${areaStr}`);
        for (const baseUrl of this.instances) {
            try {
                const result = await this.queryInstance(baseUrl, query);
                this.logger.log(`Scan result for ${baseUrl}: ${result.buildings.length} buildings`);
                this.logToFile(`SCAN SUCCESS (${baseUrl}): ${result.buildings.length} buildings`);
                return {
                    count: result.count,
                    buildings: result.buildings,
                    area: `${south.toFixed(4)},${west.toFixed(4)} to ${north.toFixed(4)},${east.toFixed(4)}`,
                };
            }
            catch (e) {
                this.logger.warn(`Overpass instance ${baseUrl} failed: ${e.message}. Trying next...`);
                this.logToFile(`SCAN TRY FAILED (${baseUrl}): ${e.message}`);
                continue;
            }
        }
        throw new Error('All Overpass API instances are currently busy or unavailable. Please try again in a few moments.');
    }
    queryInstance(baseUrl, query) {
        const url = `${baseUrl}?data=${encodeURIComponent(query)}`;
        this.logToFile(`QUERY URL: ${url}`);
        const options = {
            timeout: 20000,
            headers: {
                'User-Agent': 'Antigravity-FTTH-Project-Scanner/1.0',
                Accept: 'application/json',
            },
        };
        return new Promise((resolve, reject) => {
            const req = https.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        this.logToFile(`HTTP ERROR ${res.statusCode}: ${data.substring(0, 200)}`);
                        return reject(new Error(`HTTP ${res.statusCode}`));
                    }
                    try {
                        this.logToFile(`RAW RESPONSE: ${data.substring(0, 500)}`);
                        const json = JSON.parse(data);
                        const elements = json.elements || [];
                        const buildings = elements
                            .map((el) => {
                            const lat = el.lat || el.center?.lat;
                            const lon = el.lon || el.center?.lon;
                            if (lat && lon) {
                                return {
                                    id: el.id,
                                    lat,
                                    lng: lon,
                                    type: el.tags?.building || 'yes',
                                };
                            }
                            return null;
                        })
                            .filter(Boolean);
                        resolve({
                            count: buildings.length,
                            buildings,
                        });
                    }
                    catch (e) {
                        this.logToFile(`PARSE ERROR: ${e.message} | DATA: ${data.substring(0, 200)}`);
                        this.logger.debug('Raw response from failed parse:', data);
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            req.on('error', (err) => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = AnalysisService_1 = __decorate([
    (0, common_1.Injectable)()
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map