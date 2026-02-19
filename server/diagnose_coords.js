const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

db.all("SELECT id, name, latitude, longitude, type FROM (SELECT id, name, latitude, longitude, 'olt' as type FROM olt UNION SELECT id, name, latitude, longitude, 'rbs' as type FROM rbs)", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('--- EQUIPMENT COORDINATES ---');
    rows.forEach(row => {
        console.log(`${row.type.toUpperCase()}: ${row.name} | Lat: ${row.latitude} | Lng: ${row.longitude}`);
    });
    db.close();
});
