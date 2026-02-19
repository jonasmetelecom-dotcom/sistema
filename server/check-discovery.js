// Script de diagnóstico para verificar o status da descoberta
const axios = require('axios');

async function checkDiscovery() {
    try {
        // 1. Buscar todas as OLTs
        console.log('=== VERIFICANDO OLTs ===');
        const oltsResponse = await axios.get('http://localhost:3000/network-elements/olts', {
            headers: { Authorization: 'Bearer fake-token-for-test' }
        }).catch(e => ({ data: null, error: e.message }));

        if (oltsResponse.data) {
            console.log(`Total de OLTs: ${oltsResponse.data.length}`);
            const olt172 = oltsResponse.data.find(o => o.ipAddress === '172.16.0.2');
            if (olt172) {
                console.log('\n=== OLT 172.16.0.2 ===');
                console.log(`ID: ${olt172.id}`);
                console.log(`Nome: ${olt172.name}`);
                console.log(`Status: ${olt172.status}`);
                console.log(`Discovery Status: ${olt172.discoveryResults?.status || 'N/A'}`);
                console.log(`Last Run: ${olt172.discoveryResults?.lastRun || 'N/A'}`);
                console.log(`Errors: ${JSON.stringify(olt172.discoveryResults?.errors || [])}`);

                // 2. Buscar ONUs desta OLT
                console.log('\n=== VERIFICANDO ONUs ===');
                const onusResponse = await axios.get(`http://localhost:3000/network-elements/olts/${olt172.id}/onus`, {
                    headers: { Authorization: 'Bearer fake-token-for-test' }
                }).catch(e => ({ data: null, error: e.message }));

                if (onusResponse.data) {
                    console.log(`Total de ONUs: ${onusResponse.data.length}`);
                    onusResponse.data.slice(0, 3).forEach(onu => {
                        console.log(`  - ${onu.serialNumber} | ${onu.status} | Porta: ${onu.ponPort}`);
                    });
                } else {
                    console.log(`Erro ao buscar ONUs: ${onusResponse.error}`);
                }
            } else {
                console.log('OLT 172.16.0.2 não encontrada!');
            }
        } else {
            console.log(`Erro ao buscar OLTs: ${oltsResponse.error}`);
        }
    } catch (error) {
        console.error('Erro geral:', error.message);
    }
}

checkDiscovery();
