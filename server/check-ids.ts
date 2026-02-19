import { DataSource } from 'typeorm';
import { Olt } from './src/network-elements/entities/olt.entity';
import { Project } from './src/projects/entities/project.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function check() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [Olt, Project],
        synchronize: false,
    });

    await dataSource.initialize();

    const olts = await dataSource.getRepository(Olt).find({
        where: { ipAddress: '172.16.0.2' }
    });

    const projects = await dataSource.getRepository(Project).find();

    console.log('--- OLTS ---');
    console.log(JSON.stringify(olts, null, 2));
    console.log('--- PROJECTS ---');
    console.log(JSON.stringify(projects.map(p => ({ id: p.id, name: p.name })), null, 2));

    await dataSource.destroy();
}

check().catch(console.error);
