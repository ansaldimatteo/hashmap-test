const express = require('express')
const app = express()
const crypto = require("crypto")
const { param } = require('express/lib/request')
const dbManager = require("./database")
const jwt = require('jsonwebtoken')
const key = require('./keys')
const keys = require('./keys')
const { body, validationResult } = require('express-validator')
const hashMap = require("./hashMap.js")

var db = {}
var userHashMap = []
var users = []
app.use(express.json())

//LOGIN FUNCTIONS ------
app.post('/signup/',
body('userId').isString().trim().escape(),
body('password').isLength({ min: 8 }),
async function(req, res) {

   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
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

app.post('/signin/',
body('userId').isString().trim().escape(),
body('password').isLength({ min: 8 }).trim().escape(),
async function(req, res){

   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
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
   const userId = getUserIdFromToken(req.headers.authorization)
   var hash = getUserHashMap(userId)
   res.send(hash.getAll());
})

app.get('/hashMap/:key', function (req, res) {
   const userId = getUserIdFromToken(req.headers.authorization)
   var hash = getUserHashMap(userId)
   var value = hash.get(req.params.key)
   res.send({
      "value":value
   });
})

app.put('/hashMap/:key',
body('value').isString().trim().escape(),
function(req, res) {

   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   const userId = getUserIdFromToken(req.headers.authorization)
   var hash = getUserHashMap(userId)
   var entry = hash.add(req.params.key, req.body.value)
   res.status(201).send(entry);
});

app.delete('/hashMap/:key', function(req, res) {
   const userId = getUserIdFromToken(req.headers.authorization)
   var hash = getUserHashMap(userId)
   var array = hash.deleteValue(req.params.key)
   res.status(200).send()
});

var server = app.listen(8082, async function () {
   var host = server.address().address
   var port = server.address().port

   db = await dbManager.getDB()

   //initialize hash maps from db
   loadHashMaps()

   console.log("Example app listening at http://%s:%s", host, port)
})

// UTILITIES -----------

function getUserHashMap(userId){


   if(userHashMap[userId] == null){
      userHashMap[userId] = new hashMap([], userId, db)
      users.push(userId)
   }

   return userHashMap[userId]
}

async function loadHashMaps(){
   const data = await db.all(`SELECT * FROM hashmap_table`)
   data.forEach(datapoint => {
      const hash = getUserHashMap(datapoint.userID)
      hash.add(datapoint.hashKey, datapoint.value)
   })
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

