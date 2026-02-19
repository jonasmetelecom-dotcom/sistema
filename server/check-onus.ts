
import { createConnection } from 'typeorm';
import { Olt } from './src/network-elements/entities/olt.entity';
import { Onu } from './src/network-elements/entities/onu.entity';
import { PonPort } from './src/network-elements/entities/pon-port.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkOnuMapping() {
    const connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [Olt, Onu, PonPort],
        synchronize: false,
    });

    const oltIp = '172.16.0.2';
    const olt = await connection.getRepository(Olt).findOne({ where: { ipAddress: oltIp } });

    if (!olt) {
        console.log(`OLT with IP ${oltIp} not found.`);
        await connection.close();
        return;
    }

    console.log(`Checking ONUs for OLT: ${olt.name} (${olt.id})`);

    const ports = await connection.getRepository(PonPort).find({ where: { oltId: olt.id } });
    console.log(`Found ${ports.length} PON Ports in DB:`, ports.map(p => p.ifDescr));

    const onus = await connection.getRepository(Onu).find({ where: { oltId: olt.id } });
    console.log(`Total ONUs in DB for this OLT: ${onus.length}`);

    const portCounts: Record<string, number> = {};
    onus.forEach(o => {
        portCounts[o.ponPort] = (portCounts[o.ponPort] || 0) + 1;
    });

    console.log('ONUs per Port in DB:', JSON.stringify(portCounts, null, 2));

    await connection.close();
}

checkOnuMapping().catch(console.error);
