const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');
db.serialize(() => {
    db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(row.name);
    });
});
db.close();
