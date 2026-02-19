const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

console.log('--- BUSCANDO JUAZEIRO ---');

db.all("SELECT id, name, 'OLT' as type FROM olt WHERE name LIKE '%JUAZEIRO%' UNION SELECT id, name, 'RBS' as type FROM rbs WHERE name LIKE '%JUAZEIRO%'", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    if (rows.length === 0) {
        console.log('Nenhum equipamento encontrado com o nome JUAZEIRO.');
    } else {
        rows.forEach(row => {
            console.log(`Encontrado: [${row.type}] ${row.name} (ID: ${row.id})`);
        });
    }
    db.close();
});
