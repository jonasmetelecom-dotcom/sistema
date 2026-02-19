/**
 * SNMP OID Discovery Tool for Cianet OLT
 *
 * This script walks the enterprise tree to identify the real manufacturer
 * and find ONU-related OIDs.
 */

import * as snmp from 'net-snmp';

const OLT_IP = '172.16.0.2';
const COMMUNITY = 'public';

async function discoverEnterpriseOIDs() {
  console.log('🔍 Starting OID discovery for Cianet OLT...\n');

  const session = snmp.createSession(OLT_IP, COMMUNITY, {
    timeout: 5000,
    retries: 2,
  });

  // Step 1: Get sysDescr
  console.log('Step 1: Getting sysDescr...');
  session.get(['1.3.6.1.2.1.1.1.0'], (error, varbinds) => {
    if (!error && varbinds && varbinds.length > 0) {
      console.log(`✅ sysDescr: ${varbinds[0].value}\n`);
    }

    // Step 2: Walk enterprise tree to find manufacturer
    console.log('Step 2: Walking enterprise tree (1.3.6.1.4.1)...');
    const enterprises = new Set<string>();

    session.walk(
      '1.3.6.1.4.1',
      100,
      (vbs) => {
        vbs.forEach((vb) => {
          if (!snmp.isVarbindError(vb)) {
            // Extract enterprise ID (first 4 parts after 1.3.6.1.4.1)
            const parts = vb.oid.split('.');
            if (parts.length >= 7) {
              const enterpriseId = parts.slice(0, 7).join('.');
              enterprises.add(enterpriseId);
            }
          }
        });
      },
      (walkError) => {
        console.log(`\n✅ Found ${enterprises.size} enterprise IDs:\n`);

        const sortedEnterprises = Array.from(enterprises).sort();
        sortedEnterprises.forEach((oid) => {
          const id = oid.split('.')[6];
          let manufacturer = 'Unknown';

          if (id === '3902') manufacturer = 'ZTE';
          else if (id === '5875') manufacturer = 'FiberHome';
          else if (id === '37950') manufacturer = 'V-Solution';
          else if (id === '2011') manufacturer = 'Huawei';
          else if (id === '8072') manufacturer = 'NET-SNMP (system)';

          console.log(`  ${oid} → ${manufacturer}`);
        });

        // Step 3: Look for ONU-related OIDs
        console.log('\n\nStep 3: Searching for ONU-related OIDs...');
        console.log(
          'Looking for keywords: serial, status, power, optical, onu, gpon\n',
        );

        const onuOids: any[] = [];

        sortedEnterprises.forEach((enterpriseOid) => {
          const id = enterpriseOid.split('.')[6];
          // Skip NET-SNMP
          if (id === '8072') return;

          console.log(`\nWalking ${enterpriseOid}...`);
          session.walk(
            enterpriseOid,
            50,
            (vbs) => {
              vbs.forEach((vb) => {
                if (!snmp.isVarbindError(vb)) {
                  const value = vb.value?.toString().toLowerCase() || '';
                  const oid = vb.oid;

                  // Look for ONU-related keywords
                  if (
                    value.includes('serial') ||
                    value.includes('onu') ||
                    value.includes('gpon') ||
                    value.includes('power') ||
                    value.includes('optical') ||
                    value.includes('status')
                  ) {
                    onuOids.push({ oid, value });
                    console.log(`  📍 ${oid} = ${value}`);
                  }
                }
              });
            },
            () => {},
          );
        });

        setTimeout(() => {
          session.close();
          console.log('\n\n✅ Discovery complete!');
          console.log('\nNext steps:');
          console.log('1. Identify the real manufacturer from enterprise IDs');
          console.log('2. Use the ONU-related OIDs found above');
          console.log('3. Update snmp.service.ts with correct OIDs');
        }, 10000);
      },
    );
  });
}

discoverEnterpriseOIDs();
