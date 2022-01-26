//const sqlite3 = require('sqlite3').verbose()
const sqlite3 = require("sqlite").verbose()

const db = new sqlite3.Database('./db/helbiz.db', (err) => {
    if (err) {
      return console.error(err.message)
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS hashmap_table (
        userID VARCHAR NOT NULL,
        hashIndex INTEGER NOT NULL,
        hashKey VARCHAR NOT NULL,
        value VARCHAR NOT NULL,
        PRIMARY KEY (userID, hashIndex)
        );`
    )
    console.log('Connected to the in-memory SQlite database.')

    /*db.run(`
        INSERT INTO hashmap_table (userID, hashIndex, hashKey, value)
        VALUES (1, 1, "testKey", "testValue");
    `)*/
})

module.exports = db
