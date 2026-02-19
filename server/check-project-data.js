const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

const projectId = 'ab706054-111a-441f-8095-ecf9b56382cf';

console.log('--- CHECKING DATA FOR PROJECT:', projectId, '---');

db.all('SELECT * FROM cables WHERE projectId = ?', [projectId], (err, rows) => {
    if (err) {
        console.error('Error fetching cables:', err);
        return;
    }
    console.log('CABLES COUNT:', rows.length);
    rows.forEach(row => {
        if (!row.points) {
            console.error('CABLE WITHOUT POINTS:', row.id);
        } else {
            try {
                const pts = JSON.parse(row.points);
                if (!Array.isArray(pts) || pts.length < 2) {
                    console.error('CABLE WITH INVALID POINTS ARRAY:', row.id, pts);
                }
            } catch (e) {
                console.error('CABLE WITH MALFORMED JSON POINTS:', row.id, row.points);
            }
        }
    });

    db.all('SELECT * FROM boxes WHERE projectId = ?', [projectId], (err, rows) => {
        if (err) {
            console.error('Error fetching boxes:', err);
            return;
        }
        console.log('BOXES COUNT:', rows.length);
        rows.forEach(row => {
            if (row.latitude == null || row.longitude == null) {
                console.error('BOX WITHOUT COORDINATES:', row.id);
            }
        });

        db.all('SELECT * FROM poles WHERE projectId = ?', [projectId], (err, rows) => {
            if (err) {
                console.error('Error fetching poles:', err);
                return;
            }
            console.log('POLES COUNT:', rows.length);
            rows.forEach(row => {
                if (row.latitude == null || row.longitude == null) {
                    console.error('POLE WITHOUT COORDINATES:', row.id);
                }
            });
            db.close();
        });
    });
});
