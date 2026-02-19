/**
 * IF-MIB Discovery for Cianet OLT
 *
 * Discovers PON ports and ONUs using generic IF-MIB instead of enterprise OIDs
 * Following the correct methodology for OEM/rebrand equipment
 */

import * as snmp from 'net-snmp';

const OLT_IP = '172.16.0.2';
const COMMUNITY = 'public';

interface PonInterface {
  ifIndex: number;
  ifDescr: string;
  ifOperStatus: number;
  ifInOctets: number;
  ifOutOctets: number;
}

async function discoverPonInterfaces() {
  console.log('🔍 ETAPA 1: Mapeando interfaces PON via IF-MIB\n');

  const session = snmp.createSession(OLT_IP, COMMUNITY, {
    timeout: 5000,
    retries: 2,
  });

  // IF-MIB base OIDs
  const IF_MIB = {
    ifIndex: '1.3.6.1.2.1.2.2.1.1',
    ifDescr: '1.3.6.1.2.1.2.2.1.2',
    ifType: '1.3.6.1.2.1.2.2.1.3',
    ifOperStatus: '1.3.6.1.2.1.2.2.1.8',
    ifInOctets: '1.3.6.1.2.1.2.2.1.10',
    ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
  };

  const ponInterfaces: PonInterface[] = [];
  const allInterfaces: any[] = [];

  // Step 1: Walk ifDescr to find all interfaces
  console.log('Coletando ifDescr...');
  const ifDescrResults: any[] = [];

  session.walk(
    IF_MIB.ifDescr,
    100,
    (varbinds) => {
      varbinds.forEach((vb) => {
        if (!snmp.isVarbindError(vb) && vb.value) {
          const ifIndex = parseInt(vb.oid.split('.').pop() || '0');
          const ifDescr = vb.value.toString();
          ifDescrResults.push({ ifIndex, ifDescr });
        }
      });
    },
    async (error) => {
      if (error) {
        console.error('Erro ao coletar ifDescr:', error.message);
        session.close();
        return;
      }

      console.log(`\n✅ Encontradas ${ifDescrResults.length} interfaces\n`);

      // Filter PON interfaces
      const ponCandidates = ifDescrResults.filter((iface) => {
        const descr = iface.ifDescr.toLowerCase();
        return (
          descr.includes('gpon') ||
          descr.includes('pon') ||
          descr.includes('epon') ||
          descr.match(/^(gpon|pon|epon)\d/)
        );
      });

      console.log(`📍 Interfaces PON candidatas: ${ponCandidates.length}\n`);
      ponCandidates.forEach((iface) => {
        console.log(`  ifIndex ${iface.ifIndex}: ${iface.ifDescr}`);
      });

      if (ponCandidates.length === 0) {
        console.log('\n⚠️  Nenhuma interface PON encontrada via ifDescr');
        console.log('Listando TODAS as interfaces para análise:\n');
        ifDescrResults.slice(0, 20).forEach((iface) => {
          console.log(`  ifIndex ${iface.ifIndex}: ${iface.ifDescr}`);
        });
      }

      // Step 2: Get detailed info for PON interfaces
      if (ponCandidates.length > 0) {
        console.log('\n\n🔍 ETAPA 2: Coletando detalhes das interfaces PON\n');

        for (const pon of ponCandidates) {
          const oids = [
            `${IF_MIB.ifOperStatus}.${pon.ifIndex}`,
            `${IF_MIB.ifInOctets}.${pon.ifIndex}`,
            `${IF_MIB.ifOutOctets}.${pon.ifIndex}`,
          ];

          session.get(oids, (getError, varbinds) => {
            if (!getError && varbinds) {
              const ponIface: PonInterface = {
                ifIndex: pon.ifIndex,
                ifDescr: pon.ifDescr,
                ifOperStatus: Number(varbinds[0]?.value) || 0,
                ifInOctets: Number(varbinds[1]?.value) || 0,
                ifOutOctets: Number(varbinds[2]?.value) || 0,
              };
              ponInterfaces.push(ponIface);

              const status = ponIface.ifOperStatus === 1 ? 'UP' : 'DOWN';
              console.log(`PON ${ponIface.ifDescr}:`);
              console.log(`  Status: ${status}`);
              console.log(`  RX: ${ponIface.ifInOctets} bytes`);
              console.log(`  TX: ${ponIface.ifOutOctets} bytes\n`);
            }
          });
        }
      }

      // Step 3: Discover ONU correlation
      setTimeout(() => {
        console.log('\n\n🔍 ETAPA 3: Descoberta heurística de ONUs\n');
        console.log(
          'Procurando tabelas com alta cardinalidade relacionadas às PONs...\n',
        );

        // Walk common ONU-related trees
        const searchTrees = [
          '1.3.6.1.2.1.31.1.1.1', // ifXTable
          '1.3.6.1.2.1.10', // Transmission
          '1.3.6.1.4.1.8072', // NET-SNMP extensions
        ];

        let completedWalks = 0;

        searchTrees.forEach((tree) => {
          console.log(`Analisando ${tree}...`);
          const results: any[] = [];

          session.walk(
            tree,
            50,
            (vbs) => {
              vbs.forEach((vb) => {
                if (!snmp.isVarbindError(vb)) {
                  results.push({
                    oid: vb.oid,
                    value: vb.value?.toString() || '',
                  });
                }
              });
            },
            () => {
              console.log(`  ✅ ${tree}: ${results.length} entradas`);

              // Look for patterns
              if (results.length > 0) {
                console.log(`  Primeiros 5 OIDs:`);
                results.slice(0, 5).forEach((r) => {
                  console.log(`    ${r.oid} = ${r.value.substring(0, 50)}`);
                });
              }

              completedWalks++;
              if (completedWalks === searchTrees.length) {
                finishDiscovery();
              }
            },
          );
        });

        function finishDiscovery() {
          console.log('\n\n📊 RESULTADO DA DESCOBERTA\n');
          console.log('='.repeat(60));

          if (ponInterfaces.length > 0) {
            console.log(`\n✅ Portas PON descobertas: ${ponInterfaces.length}`);
            ponInterfaces.forEach((pon) => {
              console.log(`  - ${pon.ifDescr} (ifIndex: ${pon.ifIndex})`);
            });
          } else {
            console.log('\n⚠️  Nenhuma porta PON identificada via IF-MIB');
          }

          console.log('\n\n🎯 PRÓXIMOS PASSOS:\n');
          console.log(
            '1. Verificar se as portas PON foram identificadas corretamente',
          );
          console.log(
            '2. Analisar os OIDs retornados para encontrar padrões de ONUs',
          );
          console.log(
            '3. Correlacionar ifIndex das PONs com tabelas de alta cardinalidade',
          );
          console.log(
            '4. Testar acesso via CLI para potência óptica se SNMP não expor',
          );

          session.close();
        }
      }, 2000);
    },
  );
}

discoverPonInterfaces();
