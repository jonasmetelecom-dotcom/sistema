import { Controller, Get, Post } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Controller('system')
export class SystemController {

    @Get('check-update')
    async checkUpdate() {
        if (process.env.NODE_ENV === 'development') {
            // Mock update in dev
            return { updateAvailable: true, commitsBehind: 3, changelog: ['fix: bug 1', 'feat: new feature'] };
        }

        try {
            // 1. Fetch latest changes from remote
            await execAsync('git fetch');

            // 2. Check how many commits behind
            const { stdout: countOut } = await execAsync('git rev-list HEAD...origin/main --count');
            const count = parseInt(countOut.trim(), 10);

            // 3. Get changelog
            let changelog: string[] = [];
            if (count > 0) {
                const { stdout: logOut } = await execAsync('git log HEAD..origin/main --pretty=format:"%s" -n 10');
                changelog = logOut.split('\n').filter(line => line.trim() !== '');
            }

            return {
                updateAvailable: count > 0,
                commitsBehind: count,
                changelog
            };
        } catch (error) {
            console.error('Update check failed:', error);
            return { updateAvailable: false, error: 'Failed to check git status' };
        }
    }

    @Post('trigger-update')
    async triggerUpdate() {
        if (process.env.NODE_ENV === 'development') {
            return { message: 'In dev mode, update simulated.' };
        }

        const { spawn } = require('child_process');
        const path = require('path');

        const isWindows = process.platform === 'win32';
        const batchPath = path.resolve(__dirname, '../../../../update.bat');
        const shPath = path.resolve(__dirname, '../../../../update.sh');

        console.log(`[UPDATE] Triggering update. Platform: ${process.platform}`);

        if (isWindows) {
            // Windows logic
            const subprocess = spawn('cmd.exe', ['/c', 'start', '/min', batchPath], {
                detached: true,
                stdio: 'ignore'
            });
            subprocess.unref();
            return { message: 'Update started on Windows. Server will restart.' };
        } else {
            // Linux/macOS logic
            // In Docker, we usually can't self-update easily, so we just log and return message
            if (require('fs').existsSync('/.dockerenv')) {
                return {
                    message: 'Running in Docker. Please run "git pull && docker compose up -d --build" on the host server.',
                    isDocker: true
                };
            }

            const subprocess = spawn('bash', [shPath], {
                detached: true,
                stdio: 'ignore'
            });
            subprocess.unref();
            return { message: 'Update started on Linux. Server will restart.' };
        }
    }
}
