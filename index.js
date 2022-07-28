const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
const cors = require('cors')
require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))

mongoose.connect(process.env.Mongo_Url).then(()=>console.log("connection Successful")).catch((err)=>console.log(err));



let exerciesSchema=new mongoose.Schema({
  description: {type:String,
               required:true},
  duration:{
    type:Number,
    required:true
  },
  date:String,
  username:String
})


let userSchema = new mongoose.Schema({
  username:{type:String,
               required:true}
})

let logSchema =new mongoose.Schema({
  username:String,
  count:Number,
  log:Array
})

const Exercise = new mongoose.model("Exercise",exerciesSchema)
const User = new mongoose.model("User",userSchema)
const log = new mongoose.model("log",logSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',async (req, res) => {
  User.find({username:req.body.username},(err,data)=>{
      if(err){
        console.log("Error with server ==>",err)
      }else{
        if(data.length === 0){
          let newUser = new User({username:req.body.username});
           newUser.save((err,data)=>{
            if(!err){
              res.json({username:data.username,_id:data._id})
            }else{
             res.send("Error with server ==>",err)
            }
  })
        }else{
           res.send("Username Already exists");
        }
      }
    
  })
});

app.get('/api/users',async (req,res)=>{
  User.find({},(err,data)=>{
    if(!err){
      res.json(data);
    }
  })
})

app.post("/api/users/:_id/exercises",async (req,res)=>{
  let checkDate=req.body.date;
  let noDateHandler=(checkDate)=>{
    if(checkDate){
      return checkDate;
    }else{
       
       return new Date().toISOString().substring(0,10);
    }
  }
  User.findById({_id:req.params._id},(err,data)=>{
    
    if(err){
      res.send("ERROR Inside findbyId =>",err)
    }else{
      let SessionUser = new Exercise({
        username:data?.username,
        description:req.body.description,
        duration:req.body.duration,
        date:noDateHandler(checkDate),
    })
     
      SessionUser.save((err,userDetails)=>{
        if(err){
          res.send("ERROR Inside save =>",err)
        }else{
          let returnObj={
            _id:req.params._id,
            username:data?.username,
            date:new Date(noDateHandler(checkDate)).toDateString(),
            duration:userDetails.duration,
            description:userDetails.description
          }
          return res.json(returnObj)
        }
      });
    }
  })
  
})

app.get('/api/users/:_id/logs', (req, res) => {
  const {from,to,limit} = req.query;
  console.log("Logs request", req.params, req.query)
  User.findById({_id:req.params._id},(err,userData)=>{
   
    let query ={
      username:userData?.username
    }
  
    // if(from !== undefined && to === undefined){
      
    //   query.date = {$gte:new Date(from)}
    // }else if(from === undefined && to !== undefined){
    //   query.date = {$lte:new Date(to)}
    // }else if(from !== undefined && to !== undefined){
    //     let fromDate =(new Date(from)).toDateString()
    //   let toDate =(new Date(to)).toDateString()
    //   query.date = {$gte:new Date(from),$lte:new Date(to)}
    // }
    // let limitCheck = (limit)=>{
    //   let maxLimit = 100;
    //   if(limit){
    //     return limit;
    //   }else{
    //     return maxLimit;
    //   }
    // }

  if (from) {
    query.$and = [
      {
        date: {$gte: from}
      }
    ]
  }
  if (to) {
    if (!query.$and) query.$and = []
    query.$and.push({
      date: {$lte: to}
    })
  }
    
  Exercise.find((query),null,{limit: limit ? Number(limit) : undefined},(err,data)=>{
      
      if(err){
        console.log("error in find =>",err)
      }else{
        
        let loggedArray=data.map((item)=>{
          return {
            description:item.description,
            duration:item.duration,
            date:new Date(item.date).toDateString()
          }
        })
        const testLog =new log({
          username:userData?.username,
          count:loggedArray.length,
          log:loggedArray,
        })
     
        // testLog.save((err,data)=>{
        //   if(err){
        //     console.log("error here",err)
        //   }else{
            let returnObj = {
              _id:req.params._id,
              username:userData?.username,
              count:loggedArray.length,
              log:loggedArray
            }
            return res.json(returnObj);
        //   }
        // })
      }  
    })
    
    
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
