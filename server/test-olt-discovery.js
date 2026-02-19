#!/usr/bin/env node
/**
 * Script de Teste para OLT Discovery Module
 * 
 * Este script testa todos os endpoints da API de descoberta de OLT
 * e valida as respostas.
 */

const https = require('https');
const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3000';
const TOKEN = process.env.AUTH_TOKEN || 'SEU_TOKEN_AQUI';
const OLT_ID = process.env.OLT_ID || 'SEU_OLT_ID_AQUI';

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testDiscoveryEndpoint() {
    log('\n🧪 Teste 1: Executar Descoberta', 'blue');
    log('━'.repeat(50), 'blue');

    try {
        const response = await makeRequest('POST', `/network-elements/olts/${OLT_ID}/discovery/run`);

        if (response.status === 200 || response.status === 201) {
            log('✅ Descoberta executada com sucesso!', 'green');
            log(`Status: ${response.data.success ? 'SUCCESS' : 'FAILED'}`, response.data.success ? 'green' : 'red');

            if (response.data.sysDescr) {
                log(`sysDescr: ${response.data.sysDescr}`, 'yellow');
            }

            if (response.data.ponPorts) {
                log(`PON Ports encontradas: ${response.data.ponPorts.length}`, 'yellow');
            }

            if (response.data.errors && response.data.errors.length > 0) {
                log('⚠️  Erros encontrados:', 'yellow');
                response.data.errors.forEach(err => log(`  - ${err}`, 'red'));
            }

            return true;
        } else {
            log(`❌ Falha na descoberta (Status: ${response.status})`, 'red');
            log(JSON.stringify(response.data, null, 2), 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Erro na requisição: ${error.message}`, 'red');
        return false;
    }
}

async function testGetDiscoveryResults() {
    log('\n🧪 Teste 2: Obter Resultados da Descoberta', 'blue');
    log('━'.repeat(50), 'blue');

    try {
        const response = await makeRequest('GET', `/network-elements/olts/${OLT_ID}/discovery`);

        if (response.status === 200) {
            log('✅ Resultados obtidos com sucesso!', 'green');

            if (response.data.capabilities) {
                log('\nCapacidades SNMP:', 'yellow');
                log(`  PON Status: ${response.data.capabilities.pon_status_snmp ? '✅' : '❌'}`, 'yellow');
                log(`  PON Traffic: ${response.data.capabilities.pon_traffic_snmp ? '✅' : '❌'}`, 'yellow');
                log(`  Uplink Power: ${response.data.capabilities.uplink_power_snmp ? '✅' : '❌'}`, 'yellow');
                log(`  ONU Power (SNMP): ${response.data.capabilities.onu_power_snmp ? '✅' : '❌'}`, 'yellow');
                log(`  ONU Power (CLI): ${response.data.capabilities.onu_power_cli}`, 'yellow');
            }

            if (response.data.discoveryResults) {
                log(`\nÚltima execução: ${response.data.discoveryResults.lastRun}`, 'yellow');
                log(`Status: ${response.data.discoveryResults.status}`, 'yellow');
            }

            return true;
        } else {
            log(`❌ Falha ao obter resultados (Status: ${response.status})`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Erro na requisição: ${error.message}`, 'red');
        return false;
    }
}

async function testGetPonPorts() {
    log('\n🧪 Teste 3: Listar Portas PON', 'blue');
    log('━'.repeat(50), 'blue');

    try {
        const response = await makeRequest('GET', `/network-elements/olts/${OLT_ID}/pons`);

        if (response.status === 200) {
            log('✅ Portas PON obtidas com sucesso!', 'green');

            if (Array.isArray(response.data)) {
                log(`\nTotal de portas: ${response.data.length}`, 'yellow');

                response.data.slice(0, 5).forEach((port, idx) => {
                    log(`\nPON ${idx + 1}:`, 'yellow');
                    log(`  Interface: ${port.ifDescr} (ifIndex: ${port.ifIndex})`, 'yellow');
                    log(`  Status: ${port.ifOperStatus === 1 ? 'UP' : 'DOWN'}`, port.ifOperStatus === 1 ? 'green' : 'red');
                    log(`  IN: ${port.ifInOctets} bytes | OUT: ${port.ifOutOctets} bytes`, 'yellow');
                });

                if (response.data.length > 5) {
                    log(`\n... e mais ${response.data.length - 5} portas`, 'yellow');
                }
            }

            return true;
        } else {
            log(`❌ Falha ao obter portas PON (Status: ${response.status})`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Erro na requisição: ${error.message}`, 'red');
        return false;
    }
}

async function runAllTests() {
    log('\n' + '='.repeat(50), 'blue');
    log('🚀 INICIANDO TESTES DO MÓDULO OLT DISCOVERY', 'blue');
    log('='.repeat(50) + '\n', 'blue');

    if (TOKEN === 'SEU_TOKEN_AQUI' || OLT_ID === 'SEU_OLT_ID_AQUI') {
        log('⚠️  ATENÇÃO: Configure as variáveis de ambiente!', 'yellow');
        log('export AUTH_TOKEN="seu_token"', 'yellow');
        log('export OLT_ID="id_da_olt"\n', 'yellow');
    }

    const results = [];

    // Aguardar um pouco entre testes
    results.push(await testDiscoveryEndpoint());
    await new Promise(resolve => setTimeout(resolve, 2000));

    results.push(await testGetDiscoveryResults());
    await new Promise(resolve => setTimeout(resolve, 1000));

    results.push(await testGetPonPorts());

    // Resumo
    log('\n' + '='.repeat(50), 'blue');
    log('📊 RESUMO DOS TESTES', 'blue');
    log('='.repeat(50), 'blue');

    const passed = results.filter(r => r).length;
    const total = results.length;

    log(`\nTestes passados: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

    if (passed === total) {
        log('\n✅ TODOS OS TESTES PASSARAM!', 'green');
        log('O módulo de descoberta OLT está funcionando corretamente! 🎉\n', 'green');
    } else {
        log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
        log('Verifique os erros acima e corrija os problemas.\n', 'yellow');
    }
}

// Executar testes
runAllTests().catch(error => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
});
