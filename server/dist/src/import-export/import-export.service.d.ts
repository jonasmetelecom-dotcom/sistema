import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Pole } from '../network-elements/entities/pole.entity';
import { InfrastructureBox } from '../network-elements/entities/box.entity';
import { Cable } from '../network-elements/entities/cable.entity';
export declare class ImportExportService {
    private projectRepository;
    private poleRepository;
    private boxRepository;
    private cableRepository;
    constructor(projectRepository: Repository<Project>, poleRepository: Repository<Pole>, boxRepository: Repository<InfrastructureBox>, cableRepository: Repository<Cable>);
    importKml(projectId: string, fileBuffer: Buffer): Promise<{
        success: boolean;
        summary: {
            poles: number;
            boxes: number;
            cables: number;
        };
    }>;
    exportKml(projectId: string): Promise<string>;
    exportBoxesCsv(projectId: string): Promise<string>;
    exportGeoJson(projectId: string): Promise<any>;
    importGeoJson(projectId: string, fileBuffer: Buffer): Promise<{
        success: boolean;
        summary: {
            poles: number;
            boxes: number;
            cables: number;
        };
    }>;
}
