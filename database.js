const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

module.exports = {
    getDB: async function () {
        const db = await open({
            filename: './db/helbiz.db',
            driver: sqlite3.Database
        })
        await db.run(`
            CREATE TABLE IF NOT EXISTS hashmap_table (
                userID VARCHAR NOT NULL,
                hashKey VARCHAR NOT NULL,
                value VARCHAR NOT NULL,
                PRIMARY KEY (userID, hashKey)
            );`
        )
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                userID VARCHAR NOT NULL,
                hashPwd VARCHAR NOT NULL,
                admin INTEGER DEFAULT 0,
                PRIMARY KEY (userID)
            );`
        )

        await db.run(`
            CREATE TABLE IF NOT EXISTS "userlogs" (
                "id"	INTEGER NOT NULL,
                "userID"	VARCHAR NOT NULL,
                "method"	VARCHAR NOT NULL,
                "path"	VARCHAR NOT NULL,
                "body"	VARCHAR,
                PRIMARY KEY("id" AUTOINCREMENT)
            );`
        )
        return db
    }
}

