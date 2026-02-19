const { Telnet } = require('telnet-client');

const host = '172.16.0.2';
const username = 'jonas';
const password = 'jonas16';

async function testCianetDiscovery() {
    const connection = new Telnet();
    const params = {
        host,
        port: 23,
        shellPrompt: /[\s\w]*[>#\]]\s*$/,
        timeout: 10000,
        negotiationMandatory: false,
        loginPrompt: /(login|User Name):/i,
        passwordPrompt: /password:/i,
        username,
        password
    };

    try {
        console.log(`Conectando em ${host}...`);
        await connection.connect(params);
        console.log('Fase de login concluída.');

        // Tentar desativar paginação (comum em Cianet/Sino-telecom/Huawei)
        console.log('Tentando desativar paginação...');
        try {
            await connection.exec('terminal length 0');
        } catch (e) {
            console.log('Comando "terminal length 0" falhou, tentando "screen-length 0 temp"...');
            try {
                await connection.exec('screen-length 0 temp');
            } catch (e2) {
                console.log('Não foi possível desativar paginação.');
            }
        }

        console.log('Executando: show interface brief');
        const res = await connection.exec('show interface brief');
        console.log('--- RESULTADO ---');
        console.log(res);
        console.log('-----------------');

        await connection.end();
    } catch (error) {
        console.error('ERRO:', error.message);
    }
}

testCianetDiscovery();
