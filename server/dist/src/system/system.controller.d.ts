export declare class SystemController {
    checkUpdate(): Promise<{
        updateAvailable: boolean;
        commitsBehind: number;
        changelog: string[];
        error?: undefined;
    } | {
        updateAvailable: boolean;
        error: string;
        commitsBehind?: undefined;
        changelog?: undefined;
    }>;
    triggerUpdate(): Promise<{
        message: string;
    }>;
}
