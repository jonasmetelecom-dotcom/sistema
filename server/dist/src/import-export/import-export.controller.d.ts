import { ImportExportService } from './import-export.service';
import type { Response } from 'express';
export declare class ImportExportController {
    private readonly importExportService;
    constructor(importExportService: ImportExportService);
    importKml(projectId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        summary: {
            poles: number;
            boxes: number;
            cables: number;
        };
    }>;
    exportKml(projectId: string, res: Response): Promise<void>;
    importGeoJson(projectId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        summary: {
            poles: number;
            boxes: number;
            cables: number;
        };
    }>;
    exportGeoJson(projectId: string, res: Response): Promise<void>;
    exportBoxesCsv(projectId: string, res: Response): Promise<void>;
}
