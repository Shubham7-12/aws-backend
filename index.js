const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const {Server}=require("socket.io");
const mainRouter = require("./routes/main.router")

const yargs = require('yargs');
const {hideBin} = require("yargs/helpers");

const {initRepo} = require("./controllers/init");
const {addRepo} = require("./controllers/add");
const {commitRepo}= require("./controllers/commit");
const {pushRepo}= require("./controllers/push");
const {pullRepo}= require("./controllers/pull");
const {revertRepo}= require("./controllers/revert");


dotenv.config();

yargs(hideBin(process.argv))
//Star server command
    
  .command("start","Start a new server",{},startServer)     

//init command
    .command("init", "Initialise a new repository",{},initRepo )

 //Add command   
    .command("add <file>", "Add a file to the repository",
        (yargs)=>{
         yargs.positional("file",{
         describe: "File to add to the Staging area",
         type: "string",
         });
        },
        (argv)=>{
            addRepo(argv.file);
        }
     )

// Commit Command
    .command("commit <message>",
            "commit the staged files",
        (yargs)=>{
            yargs.positional("message", {
                describe:"Commit message",
                type:"string",
            });
        },(argv)=>{
        commitRepo(argv.message);
       } 
    )

//push command    

    .command("push","Push commits to S3",{},pushRepo)

//pull command

    .command("pull","Pull commits from S3",{},pullRepo) 

 //Revert command
    
    .command("revert <commitId>",
        "Revert to a Specific commit",
        (yargs)=>{
            yargs.positional("commitId",{
                describe:"comit ID to revert to ",
                type:"string",
            });
        },
        (argv)=>{
            revertRepo(argv.commitId);
        }
     )   
    .demandCommand(1,"You ned at least one command")
    .help().argv;

function startServer(){
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(bodyParser.json());
    app.use(express.json());

    const mongoURL = process.env.MONGODB_URL;

    mongoose.connect(mongoURL)
    .then(()=>console.log("MongoDB connected!"))
    .catch((err)=>console.error("Unable to connect : ",err))

    app.use(cors({ origin: "*" }));

    app.use("/",mainRouter);

    let user = "test";

    const httpServer = http.createServer(app);
    const io = new Server(httpServer,{
        cors:{
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

   io.on("connection",(socket)=>{
    socket.on("joinRoom",(userID)=>{
        user = userID;
        console.log("=====");
        console.log(user);
        console.log("=====");
        socket.join(userID);
    });
   });

    const db = mongoose.connection;

    db.once("open",async()=>{
        console.log("CRUD operations called");
    });

    httpServer.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
    });

    console.log("Server logic called!");
}