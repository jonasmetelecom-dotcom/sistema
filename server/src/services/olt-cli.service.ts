import { Injectable, Logger } from '@nestjs/common';
import * as Client from 'ssh2';
import { Telnet } from 'telnet-client';

@Injectable()
export class OltCliService {
  private readonly logger = new Logger(OltCliService.name);

  async executeCommand(
    host: string,
    protocol: 'ssh' | 'telnet',
    config: any,
    command: string,
  ): Promise<string> {
    return this.executeCommandSequence(host, protocol, config, [command]);
  }

  async executeCommandSequence(
    host: string,
    protocol: 'ssh' | 'telnet',
    config: any,
    commands: string[],
  ): Promise<string> {
    if (protocol === 'ssh') {
      const results = [];
      for (const cmd of commands) {
        results.push(await this.executeSsh(host, config, cmd));
      }
      return results.join('\n');
    } else {
      return this.executeTelnetSequence(host, config, commands);
    }
  }

  private async executeTelnetSequence(
    host: string,
    config: any,
    commands: string[],
  ): Promise<string> {
    const connection = new Telnet();
    const params = {
      host,
      port: config.port || 23,
      shellPrompt: config.shellPrompt || /[\s\w-\(\)]*[>#\]]\s*$/, // Regex mais agressivo para prompts Cianet/Huawei
      timeout: 30000, // Aumentado para 30s
      negotiationMandatory: false,
      loginPrompt: config.loginPrompt || /(login|User Name|username):/i,
      passwordPrompt: config.passwordPrompt || /password:/i,
      username: config.username,
      password: config.password,
      initialCtrlC: true, // Tenta limpar buffer inicial
      sendInitialData: '\n', // Acorda o terminal
    };

    try {
      this.logger.log(`[TELNET] Conectando em ${host}...`);
      await connection.connect(params);

      let finalOutput = '';
      for (const command of commands) {
        this.logger.log(`[TELNET] Executando: ${command}`);
        const res = await connection.exec(command);
        finalOutput += res + '\n';
      }

      await connection.end();
      return finalOutput;
    } catch (error) {
      this.logger.error(`[TELNET] Erro em ${host}: ${error.message}`);
      try {
        await connection.end();
      } catch (e) { }
      throw error;
    }
  }

  private executeSsh(
    host: string,
    config: any,
    command: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client.Client();
      let output = '';

      conn
        .on('ready', () => {
          conn.exec(
            command,
            (err: Error | undefined, stream: Client.Channel) => {
              if (err) {
                conn.end();
                return reject(err);
              }
              stream
                .on('data', (data: Buffer) => {
                  output += data.toString();
                })
                .on('close', () => {
                  conn.end();
                  resolve(output);
                });
            },
          );
        })
        .on('error', (err: Error) => {
          reject(err);
        })
        .connect({
          host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          readyTimeout: 15000,
        });
    });
  }

  private async executeTelnet(
    host: string,
    config: any,
    command: string,
  ): Promise<string> {
    const connection = new Telnet();
    const params = {
      host,
      port: config.port || 23,
      shellPrompt: config.shellPrompt || /[\s\w]*[>#\]]\s*$/, // Regex more flexible para prompts
      timeout: 30000,
      negotiationMandatory: false, // Importante para hardwares específicos
      loginPrompt: config.loginPrompt || /(login|User Name):/i,
      passwordPrompt: config.passwordPrompt || /password:/i,
      username: config.username,
      password: config.password,
    };

    try {
      this.logger.log(
        `[TELNET] Tentando conectar em ${host} com params: ${JSON.stringify({ ...params, password: '***' })}`,
      );
      await connection.connect(params);
      this.logger.log(`[TELNET] Conectado! Executando: ${command}`);
      const res = await connection.exec(command);
      this.logger.log(`[TELNET] Comando executado com sucesso.`);
      await connection.end();
      return res;
    } catch (error) {
      this.logger.error(
        `[TELNET] Erro na conexão/comando em ${host}: ${error.message}`,
      );
      throw error;
    }
  }
  async getOpticalSignals(
    host: string,
    protocol: 'ssh' | 'telnet',
    config: any,
  ): Promise<Map<string, number>> {
    const signals = new Map<string, number>();
    try {
      // Setup generic commands that might reveal power
      // Note: "show pon power attenuation" is common for ZTE/Cianet/Fiberhome variants
      const commands = [
        'enable',
        'terminal length 0', // Disable paging
        'show pon power attenuation',
        'show gpon onu optical-info',
        'show onu optical-info'
      ];

      this.logger.log(`[CLI-SIGNAL] Attempting to fetch signals from ${host}...`);
      const output = await this.executeCommandSequence(host, protocol, config, commands);

      // Parse output looking for Serial Number patterns and Signal Levels
      const lines = output.split('\n');
      lines.forEach((line) => {
        // Broad Regex to capture Serial (alphanumeric 10-20 chars) and Signal (float like -22.45 or -22)
        // Guard against matching unrelated numbers by ensuring structure

        // Strategy: Look for lines with a Serial AND a Signal
        const mSerial = line.match(/(?:SN:|Serial:|MAC:)?\s*([A-Za-z0-9]{12,16})/); // Focus on 12-16 chars common for SN
        const mPower = line.match(/(?:Rx:|Power:|Level:)?\s*(-?\d{1,3}\.\d+)/); // Match e.g. -22.50

        if (mSerial && mPower) {
          const serial = mSerial[1].toUpperCase();
          const power = parseFloat(mPower[1]);

          // Sanity check for optical power (expecting -40 to +10 dBm range)
          if (power > -50 && power < 10 && !signals.has(serial)) {
            signals.set(serial, power);
          }
        }
      });

      this.logger.log(`[CLI-SIGNAL] CLI fetch complete. Found ${signals.size} signals.`);

    } catch (e) {
      this.logger.warn(`[CLI-SIGNAL] Failed to fetch signals via CLI from ${host}: ${e.message}`);
    }
    return signals;
  }
}
