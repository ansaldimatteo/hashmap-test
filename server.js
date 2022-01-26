const express = require('express')
const app = express()
const crypto = require("crypto")
const { param } = require('express/lib/request')
const dbManager = require("./database")
const jwt = require('jsonwebtoken')
const key = require('./keys')
const keys = require('./keys')
const hashMap = require("./hashMap.js")

var db = {}
var userHashMap = {}
app.use(express.json())

//LOGIN FUNCTIONS ------
app.post('/signup/', async function(req, res) {
   const userId = req.body.userId
   const password = req.body.password

   const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
   const userExists = await db.get(`SELECT * FROM users WHERE userID = (?)`, userId)
   if(userExists == null){
      const result = await db.run(`
      INSERT INTO users (userID, hashPwd, admin)
      VALUES (?,?,?);
      `, userId, passwordHash, 0)
      res.status(201).send({
         "userId":userId
      });
   }
   
   res.status(403).send()
})

app.post('/signin/', async function(req, res){
   const userId = req.body.userId
   const password = req.body.password

   const user = await db.get(`SELECT * FROM users WHERE userID = (?)`, userId)
   if(user == null){
      //user doens't exist
      res.status(401).send()
   }
   const passwordHash = user.hashPwd
   const signinPwdHash = crypto.createHash('sha256').update(password).digest('hex')
   if(passwordHash == signinPwdHash){

      const payload = {
         "userId":userId,
         "admin":user.admin
      };
      const token = await jwt.sign(payload, key.jwtKey, { expiresIn: 3600 })
      res.status(200).json("Bearer " + token)

   }else{
      //wrong password
      res.status(401).send()
   }

})


// HASHMAP FUNCTIONS ------

//You need to be authenticated to use all the apis below this
app.use(async function(req, res, next) {

   if (!req.headers.authorization) {
     return res.status(403).json({ error: 'No credentials sent!' })
   }
   const tokenVerified = await verifyToken(req.headers.authorization)
   
   if(tokenVerified == false){
      console.log("token verification failed")
      return res.status(403).json({ error: 'Please login again.' })
   }

   next()
})

app.get('/hashMap/', async function (req, res) {
   var hash = getUserHashMap(req.headers.authorization)
   res.send(hash.getAll());
})

app.get('/hashMap/:key', function (req, res) {
   var hash = getUserHashMap(req.headers.authorization)
   var value = hash.get(req.params.key)
   res.send({
      "value":value
   });
})

app.put('/hashMap/:key', function(req, res) {
   var hash = getUserHashMap(req.headers.authorization)
   var entry = hash.add(req.params.key, req.body.value)
   res.status(201).send(entry);
});

app.delete('/hashMap/:key', function(req, res) {
   var hash = getUserHashMap(req.headers.authorization)
   var array = hash.delete(req.params.key)
   res.status(200)
});

var server = app.listen(8081, async function () {
   var host = server.address().address
   var port = server.address().port

   db = await dbManager.getDB()

   //await db.exec('INSERT INTO hashmap_table (userID, hashIndex, hashKey, value)VALUES (1, 1, "testKey", "testValue");')
   const value = await db.get('SELECT * FROM hashmap_table;')
   console.log(value)
   //initialize hash maps from db
   //console.log(hash.add("val5", "val2"))
   console.log("Example app listening at http://%s:%s", host, port)
})

// UTILITIES -----------

function getUserHashMap(authToken){
   const userId = getUserIdFromToken(authToken)

   if(userHashMap[userId] == null){
      userHashMap[userId] = new hashMap([], userId)
   }

   return userHashMap[userId]
}

async function verifyToken(token){
   const jwtArray = token.split(" ")
   if(jwtArray[1] == null){
      //not properly formatted
      return false
   }
   
   try {
      const decoded = jwt.verify(jwtArray[1], keys.jwtKey)
      return true
   }
   catch (ex) { 
      console.log(ex.message)
      return false
   } 
}

function getUserIdFromToken(token){
   const jwtArray = token.split(" ")
   const decoded = jwt.verify(jwtArray[1], keys.jwtKey)

   return decoded.userId
}