import { Repository } from 'typeorm';
import { Olt } from './entities/olt.entity';
import { Rbs } from './entities/rbs.entity';
import { Onu } from './entities/onu.entity';
import { Project } from '../projects/entities/project.entity';
import { Alarm } from './entities/alarm.entity';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
export declare class StatsController {
    private oltsRepository;
    private rbsRepository;
    private onusRepository;
    private projectsRepository;
    private alarmsRepository;
    private polesRepository;
    private boxesRepository;
    private cablesRepository;
    constructor(oltsRepository: Repository<Olt>, rbsRepository: Repository<Rbs>, onusRepository: Repository<Onu>, projectsRepository: Repository<Project>, alarmsRepository: Repository<Alarm>, polesRepository: Repository<Pole>, boxesRepository: Repository<InfrastructureBox>, cablesRepository: Repository<Cable>);
    getDashboardStats(req: any): Promise<{
        totalClients: number;
        networkHealth: string;
        networkStatus: string;
        activeProjects: number;
        occupation: {
            percent: number;
            used: number;
            total: number;
        };
        equipmentStats: {
            total: number;
            online: number;
            offline: number;
        };
    }>;
    getRecentAlarms(req: any): Promise<Alarm[]>;
    getProjectInventory(id: string, req: any): Promise<{
        message: string;
        poles?: undefined;
        boxes?: undefined;
        cablesInMeters?: undefined;
        totalCablesMeters?: undefined;
        rbs?: undefined;
    } | {
        poles: number;
        boxes: Record<string, number>;
        cablesInMeters: Record<string, number>;
        totalCablesMeters: number;
        rbs: number;
        message?: undefined;
    }>;
}
