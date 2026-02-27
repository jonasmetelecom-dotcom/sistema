import { AnalysisService } from './analysis.service';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    countBuildings(south?: string, west?: string, north?: string, east?: string, points?: string): Promise<{
        count: number;
        buildings: any[];
        area: string;
    }>;
}
