const crypto = require("crypto")

//GET n and data from user ID. If null, n = 64
var n = 64
var data = []
var currentUserId = ""

module.exports = {
    add: function (key, value) {
        var index = this.getIndex(key)
        if(data[index] == null || data[index]?.key == key){
            data[index] = {
                "key":key,
                "value":value
            }
            
        }else{
            //collision
            this.manageCollision(key, value)
        }

        return data[this.getIndex(key)]
    },

    delete: function (key) {
        var index = this.getIndex(key)
        data[index] = null
        return data
    },

    get: function (key) {
        var index = this.getIndex(key)
        return data[index]?.value
    },

    getAll: function (key) {
        var returnMap = []
        data.forEach(element => {
            if(element == null){
                return
            }

            returnMap.push(element)
        })
        return returnMap
    },

    getIndex: function(key){
        var hash = crypto.createHash('md5').update(key).digest('hex')
        //slice the key to just 8 values in HEX so that the module can be easily computed. This still gives us 4294967295 possibilities
        var hashNumber = parseInt(hash.slice(0,8), 16)
        return hashNumber%n
    },

    manageCollision: function(key,value){
        //resize the data array if the key isn't the same as before
        var newData = []
        n = n * 2
        //place all values in new array
        data.forEach(element => {
            if(element == null){
                return
            }

            var newIndex = this.getIndex(element.key)
            newData[newIndex] = {
                "key":element.key,
                "value":element.value
            }
        })
        data = newData
        //retry adding the data to the array
        this.add(key,value)
    },

    initHashMap: function(keyValueArray, userId){
        data = keyValueArray
        currentUserId = userId
        //compute value of n
        n = 64
        while(n < keyValueArray.length){
            n = n * 2
        }
    }
}



