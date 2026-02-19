export declare class OltCliService {
    private readonly logger;
    executeCommand(host: string, protocol: 'ssh' | 'telnet', config: any, command: string): Promise<string>;
    executeCommandSequence(host: string, protocol: 'ssh' | 'telnet', config: any, commands: string[]): Promise<string>;
    private executeTelnetSequence;
    private executeSsh;
    private executeTelnet;
    getOpticalSignals(host: string, protocol: 'ssh' | 'telnet', config: any): Promise<Map<string, number>>;
}
