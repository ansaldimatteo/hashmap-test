const { strict } = require("assert")
const crypto = require("crypto")

class hashMap{

    constructor(keyValueArray, userId, db){
        this.data = keyValueArray
        this.currentUserId = userId
        //compute value of n
        this.db = db
        this.n = 64
        while(this.n < keyValueArray.length){
            this.n = this.n * 2
        }
    }


    add = async function (key, value) {
        var index = this.getIndex(key)
        if(this.data[index] == null || this.data[index]?.key == key){
            this.data[index] = {
                "key":key,
                "value":value
            }

            const result = await this.db.run(`
            INSERT OR REPLACE INTO hashmap_table (userID, hashKey, value)
            VALUES (?,?,?);
            `, this.currentUserId, key, value)

        }else{
            //collision
            this.manageCollision(key, value)
        }

        return this.data[this.getIndex(key)]
    }

    deleteValue = async function (key) {
        var index = this.getIndex(key)
        this.data[index] = null

        const result = await this.db.run(`
            DELETE FROM hashmap_table
            WHERE userID = ? AND hashKey = ?;
            `, this.currentUserId, key)
        return 0
    }

    get = function (key) {
        var index = this.getIndex(key)
        return this.data[index]?.value
    }

    getAll = function (key) {
        var returnMap = []
        this.data.forEach(element => {
            if(element == null){
                return
            }

            returnMap.push(element)
        })
        return returnMap
    }

    getIndex = function (key){
        var hash = crypto.createHash('md5').update(key).digest('hex')
        //slice the key to just 8 values in HEX so that the module can be easily computed. This still gives us 4294967295 possibilities
        var hashNumber = parseInt(hash.slice(0,8), 16)
        return hashNumber % this.n
    }

    manageCollision = function (key,value){
        //resize the data array if the key isn't the same as before
        var newData = []
        this.n = this.n * 2
        //place all values in new array
        this.data.forEach(element => {
            if(element == null){
                return
            }

            var newIndex = this.getIndex(element.key)
            newData[newIndex] = {
                "key":element.key,
                "value":element.value
            }
        })
        this.data = newData
        //retry adding the data to the array
        this.add(key,value)
    }
}

module.exports = hashMap;
