var express = require('express')
var app = express()
var userHashMap = {}
const { param } = require('express/lib/request')

const userId = "User1"
app.use(express.json())


app.get('/hashMap/', function (req, res) {
   var hash = getUserHashMap(userId)
   res.send(hash.getAll());
})

app.get('/hashMap/:key', function (req, res) {
   var hash = getUserHashMap(userId)
   var value = hash.get(req.params.key)
   res.send({
      "value":value
   });
})

app.put('/hashMap/:key', function(req, res) {
   var hash = getUserHashMap(userId)
   var entry = hash.add(req.params.key, req.body.value)
   res.status(201).send(entry);
});

app.delete('/hashMap/:key', function(req, res) {
   var hash = getUserHashMap(userId)
   var array = hash.delete(req.params.key)
   res.status(200)
});

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   //initialize hash maps from db
   //console.log(hash.add("val5", "val2"))
   console.log("Example app listening at http://%s:%s", host, port)
})

function getUserHashMap(userId){
   if(userHashMap[userId] == null){
      userHashMap[userId] = require("./hashMap")
   }

   return userHashMap[userId]
}