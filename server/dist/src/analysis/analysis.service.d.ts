export declare class AnalysisService {
    private readonly logger;
    private readonly logPath;
    private logToFile;
    private readonly instances;
    countBuildingsPolygon(points: string): Promise<{
        count: number;
        buildings: any[];
        area: string;
    }>;
    countBuildings(bounds: {
        south: number;
        west: number;
        north: number;
        east: number;
    }): Promise<{
        count: number;
        buildings: any[];
        area: string;
    }>;
    private queryInstance;
}
