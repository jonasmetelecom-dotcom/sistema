const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');
db.serialize(() => {
    db.each("SELECT email, role, tenantId FROM users", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(`${row.email} | ${row.role} | ${row.tenantId}`);
    });
});
db.close();
