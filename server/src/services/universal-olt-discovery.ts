/**
 * Universal OLT SNMP Discovery
 *
 * Metodologia padrão para QUALQUER OLT (Cianet/ZTE/FiberHome/V-Solution/etc)
 * Determina com evidência o que está disponível via SNMP
 */

import * as snmp from 'net-snmp';
import * as fs from 'fs';

const OLT_IP = '172.16.0.2';
const COMMUNITY = 'public';
const REPORT_FILE = './olt-discovery-report.txt';

interface DiscoveryReport {
  identity: any;
  ponInterfaces: any[];
  uplinkPower: any;
  onuPower: any;
  conclusion: string[];
}

const report: DiscoveryReport = {
  identity: {},
  ponInterfaces: [],
  uplinkPower: { found: false, oids: [] },
  onuPower: { found: false, oids: [] },
  conclusion: [],
};

let output = '';

function log(message: string) {
  console.log(message);
  output += message + '\n';
}

async function runDiscovery() {
  log('='.repeat(80));
  log('DESCOBERTA UNIVERSAL DE OLT VIA SNMP');
  log('='.repeat(80));
  log(`OLT: ${OLT_IP}`);
  log(`Community: ${COMMUNITY}`);
  log(`Data: ${new Date().toISOString()}\n`);

  const session = snmp.createSession(OLT_IP, COMMUNITY, {
    timeout: 5000,
    retries: 2,
  });

  // ETAPA 1: IDENTIDADE
  await etapa1_identidade(session);

  // ETAPA 2: MAPEAR PORTAS PON
  await etapa2_mapearPons(session);

  // ETAPA 3: DETECTAR POTÊNCIA UPLINK
  await etapa3_uplinkPower(session);

  // ETAPA 4: DETECTAR POTÊNCIA ONUs
  await etapa4_onuPower(session);

  // ETAPA 5 & 6: CONCLUSÃO E RELATÓRIO
  gerarRelatorioFinal();

  session.close();

  // Salvar relatório
  fs.writeFileSync(REPORT_FILE, output);
  log(`\n✅ Relatório salvo em: ${REPORT_FILE}`);
}

async function etapa1_identidade(session: any) {
  log('\n' + '='.repeat(80));
  log('ETAPA 1: COLETA DE IDENTIDADE');
  log('='.repeat(80) + '\n');

  return new Promise<void>((resolve) => {
    const oids = [
      '1.3.6.1.2.1.1.1.0', // sysDescr
      '1.3.6.1.2.1.1.2.0', // sysObjectID
      '1.3.6.1.2.1.1.5.0', // sysName
    ];

    session.get(oids, (error: any, varbinds: any) => {
      if (error) {
        log(`❌ Erro ao coletar identidade: ${error.message}`);
        resolve();
        return;
      }

      report.identity = {
        sysDescr: varbinds[0]?.value?.toString() || 'N/A',
        sysObjectID: varbinds[1]?.value?.toString() || 'N/A',
        sysName: varbinds[2]?.value?.toString() || 'N/A',
      };

      log(`sysDescr: ${report.identity.sysDescr}`);
      log(`sysObjectID: ${report.identity.sysObjectID}`);
      log(`sysName: ${report.identity.sysName}`);

      log('\n📝 Comando para repetir:');
      log(
        `snmpget -v2c -c ${COMMUNITY} ${OLT_IP} 1.3.6.1.2.1.1.1.0 1.3.6.1.2.1.1.2.0`,
      );

      resolve();
    });
  });
}

async function etapa2_mapearPons(session: any) {
  log('\n' + '='.repeat(80));
  log('ETAPA 2: MAPEAR PORTAS PON (IF-MIB)');
  log('='.repeat(80) + '\n');

  return new Promise<void>((resolve) => {
    const IF_DESCR_OID = '1.3.6.1.2.1.2.2.1.2';
    const interfaces: any[] = [];

    session.walk(
      IF_DESCR_OID,
      100,
      (varbinds: any) => {
        varbinds.forEach((vb: any) => {
          if (!snmp.isVarbindError(vb)) {
            const ifIndex = parseInt(vb.oid.split('.').pop() || '0');
            const ifDescr = vb.value.toString();
            interfaces.push({ ifIndex, ifDescr });
          }
        });
      },
      (error: any) => {
        if (error) {
          log(`❌ Erro ao mapear interfaces: ${error.message}`);
          resolve();
          return;
        }

        log(`✅ Total de interfaces encontradas: ${interfaces.length}\n`);

        // Filtrar PONs
        const ponInterfaces = interfaces.filter((iface) => {
          const descr = iface.ifDescr.toLowerCase();
          return (
            descr.includes('gpon') ||
            descr.includes('pon') ||
            descr.includes('epon')
          );
        });

        report.ponInterfaces = ponInterfaces;

        if (ponInterfaces.length > 0) {
          log(`✅ Interfaces PON identificadas: ${ponInterfaces.length}\n`);
          ponInterfaces.forEach((pon) => {
            log(`  ifIndex ${pon.ifIndex}: ${pon.ifDescr}`);
          });
        } else {
          log('⚠️  Nenhuma interface PON encontrada por nome.');
          log('Listando primeiras 15 interfaces:\n');
          interfaces.slice(0, 15).forEach((iface) => {
            log(`  ifIndex ${iface.ifIndex}: ${iface.ifDescr}`);
          });
        }

        log('\n📝 Comando para repetir:');
        log(
          `snmpwalk -v2c -c ${COMMUNITY} ${OLT_IP} 1.3.6.1.2.1.2.2.1.2 | grep -i pon`,
        );

        resolve();
      },
    );
  });
}

async function etapa3_uplinkPower(session: any) {
  log('\n' + '='.repeat(80));
  log('ETAPA 3: DETECTAR POTÊNCIA DO UPLINK (SFP da OLT)');
  log('='.repeat(80) + '\n');

  return new Promise<void>((resolve) => {
    // Tentar ENTITY-SENSOR-MIB
    const ENTITY_SENSOR_OID = '1.3.6.1.2.1.99.1.1.1';
    const sensors: any[] = [];

    log('Procurando sensores em ENTITY-SENSOR-MIB (1.3.6.1.2.1.99)...');

    session.walk(
      ENTITY_SENSOR_OID,
      50,
      (varbinds: any) => {
        varbinds.forEach((vb: any) => {
          if (!snmp.isVarbindError(vb)) {
            const value = vb.value?.toString().toLowerCase() || '';
            if (
              value.includes('optical') ||
              value.includes('power') ||
              value.includes('tx') ||
              value.includes('rx') ||
              value.includes('sfp')
            ) {
              sensors.push({ oid: vb.oid, value: vb.value });
            }
          }
        });
      },
      (error: any) => {
        if (sensors.length > 0) {
          log(`\n✅ Sensores ópticos encontrados: ${sensors.length}\n`);
          sensors.forEach((sensor) => {
            log(`  ${sensor.oid} = ${sensor.value}`);
          });
          report.uplinkPower.found = true;
          report.uplinkPower.oids = sensors;
        } else {
          log('❌ Nenhum sensor óptico encontrado em ENTITY-SENSOR-MIB');
        }

        log('\n📝 Comando para repetir:');
        log(
          `snmpwalk -v2c -c ${COMMUNITY} ${OLT_IP} 1.3.6.1.2.1.99 | grep -iE "optical|power|tx|rx"`,
        );

        resolve();
      },
    );
  });
}

async function etapa4_onuPower(session: any) {
  log('\n' + '='.repeat(80));
  log('ETAPA 4: DETECTAR POTÊNCIA DAS ONUs (HEURÍSTICA)');
  log('='.repeat(80) + '\n');

  return new Promise<void>((resolve) => {
    log('Analisando árvore enterprise para tabelas de alta cardinalidade...\n');

    const searchTrees = [
      { oid: '1.3.6.1.4.1.8072', name: 'NET-SNMP' },
      { oid: '1.3.6.1.4.1.3902', name: 'ZTE' },
      { oid: '1.3.6.1.4.1.5875', name: 'FiberHome' },
      { oid: '1.3.6.1.4.1.2011', name: 'Huawei' },
    ];

    let completed = 0;
    const highCardinalityTables: any[] = [];

    searchTrees.forEach((tree) => {
      const results: any[] = [];

      session.walk(
        tree.oid,
        100,
        (varbinds: any) => {
          varbinds.forEach((vb: any) => {
            if (!snmp.isVarbindError(vb)) {
              results.push({ oid: vb.oid, value: vb.value });
            }
          });
        },
        () => {
          log(`${tree.name} (${tree.oid}): ${results.length} entradas`);

          if (results.length > 50) {
            highCardinalityTables.push({
              tree: tree.name,
              oid: tree.oid,
              count: results.length,
            });
          }

          completed++;
          if (completed === searchTrees.length) {
            finishOnuDiscovery();
          }
        },
      );
    });

    function finishOnuDiscovery() {
      log('\n📊 Tabelas de alta cardinalidade (>50 entradas):');
      if (highCardinalityTables.length > 0) {
        highCardinalityTables.forEach((table) => {
          log(`  ${table.tree}: ${table.count} entradas`);
        });
        log('\n⚠️  Análise manual necessária para correlacionar com ONUs');
        report.onuPower.found = false;
        report.onuPower.oids = highCardinalityTables;
      } else {
        log('  Nenhuma tabela de alta cardinalidade encontrada');
        report.onuPower.found = false;
      }

      log('\n📝 Comandos para investigação manual:');
      searchTrees.forEach((tree) => {
        log(`snmpbulkwalk -v2c -c ${COMMUNITY} -Cr50 ${OLT_IP} ${tree.oid}`);
      });

      resolve();
    }
  });
}

function gerarRelatorioFinal() {
  log('\n' + '='.repeat(80));
  log('CONCLUSÃO TÉCNICA');
  log('='.repeat(80) + '\n');

  // PONs
  if (report.ponInterfaces.length > 0) {
    log(
      `✅ PORTAS PON: ${report.ponInterfaces.length} identificadas via IF-MIB`,
    );
    report.conclusion.push(
      `PON interfaces: ${report.ponInterfaces.length} via IF-MIB`,
    );
  } else {
    log('❌ PORTAS PON: Não identificadas automaticamente');
    report.conclusion.push(
      'PON interfaces: Não identificadas (verificar manualmente)',
    );
  }

  // Uplink Power
  if (report.uplinkPower.found) {
    log(
      `✅ POTÊNCIA UPLINK: Disponível via SNMP (${report.uplinkPower.oids.length} sensores)`,
    );
    report.conclusion.push('Uplink power: SIM via SNMP');
  } else {
    log('❌ POTÊNCIA UPLINK: NÃO disponível via SNMP neste firmware');
    report.conclusion.push('Uplink power: NÃO via SNMP (somente CLI/API)');
  }

  // ONU Power
  if (report.onuPower.found) {
    log(`✅ POTÊNCIA ONUs: Disponível via SNMP`);
    report.conclusion.push('ONU power: SIM via SNMP');
  } else {
    log('❌ POTÊNCIA ONUs: NÃO disponível via SNMP neste firmware');
    log('   Recomendação: Usar CLI (show onu optical-info) ou API REST');
    report.conclusion.push('ONU power: NÃO via SNMP (somente CLI/API)');
  }

  log('\n' + '='.repeat(80));
  log('RESUMO EXECUTIVO');
  log('='.repeat(80));
  report.conclusion.forEach((c) => log(`• ${c}`));
}

// Executar descoberta
runDiscovery().catch((err) => {
  console.error('Erro na descoberta:', err);
});
