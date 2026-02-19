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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const olt_entity_1 = require("./src/network-elements/entities/olt.entity");
const onu_entity_1 = require("./src/network-elements/entities/onu.entity");
const pon_port_entity_1 = require("./src/network-elements/entities/pon-port.entity");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function checkOnuMapping() {
    const connection = await (0, typeorm_1.createConnection)({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [olt_entity_1.Olt, onu_entity_1.Onu, pon_port_entity_1.PonPort],
        synchronize: false,
    });
    const oltIp = '172.16.0.2';
    const olt = await connection.getRepository(olt_entity_1.Olt).findOne({ where: { ipAddress: oltIp } });
    if (!olt) {
        console.log(`OLT with IP ${oltIp} not found.`);
        await connection.close();
        return;
    }
    console.log(`Checking ONUs for OLT: ${olt.name} (${olt.id})`);
    const ports = await connection.getRepository(pon_port_entity_1.PonPort).find({ where: { oltId: olt.id } });
    console.log(`Found ${ports.length} PON Ports in DB:`, ports.map(p => p.ifDescr));
    const onus = await connection.getRepository(onu_entity_1.Onu).find({ where: { oltId: olt.id } });
    console.log(`Total ONUs in DB for this OLT: ${onus.length}`);
    const portCounts = {};
    onus.forEach(o => {
        portCounts[o.ponPort] = (portCounts[o.ponPort] || 0) + 1;
    });
    console.log('ONUs per Port in DB:', JSON.stringify(portCounts, null, 2));
    await connection.close();
}
checkOnuMapping().catch(console.error);
//# sourceMappingURL=check-onus.js.map