const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {MongoClient, ReturnDocument} = require("mongodb");
const dotenv = require("dotenv");
const ObjectId = require("mongodb").ObjectId;

dotenv.config();
const url = process.env.MONGODB_URL;

let client;

async function connectClient() {
    if (!client) {
        client = new MongoClient(url);
        await client.connect();
    }
}

async function signup(req,res){
    const {username,password,email}=req.body;
    if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 8
) {
    return res.status(400).json({
        error: "A valid username, email, and password of at least 8 characters are required!"
    });
}
    try{
        await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");

        const normalizedUsername = username.trim();
const normalizedEmail = email.trim().toLowerCase();

const existingUser = await UsersCollection.findOne({
    $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
    ]
});

if (existingUser) {
    return res.status(409).json({
        error: "Username or email is already registered!"
    });
}

        const salt = await bcrypt.genSalt(10);
        const hatchPassword = await bcrypt.hash(password,salt);

        const newUser = {
    username: normalizedUsername,
    password: hatchPassword,
    email: normalizedEmail,
    repositories: [],
    followedUsers: [],
    starRepo: []
};

        const result = await UsersCollection.insertOne(newUser);

        const token = jwt.sign(
            {id:result.insertedId},
            process.env.JWT_SECRET_KEY,
            {expiresIn:"1h"}
        );
        res.json({token , userId:result.insertedId});
    }catch(err){
        console.error("Error during Signup!!",err.message);
        res.status(500).send("Server error");
    }
    

};

async function login(req,res) {
    const{email,password}= req.body;
    if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
) {
    return res.status(400).json({
        error: "Email and password are required!"
    });
}
     try{
        await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");

        const user = await UsersCollection.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid credential"});
        }
        
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid credential"});
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"1h"});
        res.json({token , userId:user._id});
    } catch (err) {
    console.error("Error during login:", err.message);

    return res.status(500).json({
        error: "Server error"
    });
}

};

async function getAllUsers (req ,res){
   try{
      await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");
        
        const users = await UsersCollection
       .find({})
       .project({ password: 0 })
       .toArray();

     res.json(users);

   } catch(err){
     console.error("Error during fetching!!",err.message);
     res.status(500).send("Server error");
   }
};

async function getUserProfile (req ,res) {
    const currentID = req.params.id;

    if (!ObjectId.isValid(currentID)) {
    return res.status(400).json({
        error: "Invalid user ID!"
    });
}

    try{
        await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");

        const user = await UsersCollection.findOne(
              { _id: new ObjectId(currentID) },
              { projection: { password: 0 } }
          );

        if(!user){
            return res.status(404).json({message:"User not found!!"});
        }

        res.json(user);

    }catch(err){
     console.error("Error during fetching!!",err.message);
     res.status(500).send("Server error");
    }

};

async function updateUserProfile (req ,res) {
    const currentID = req.params.id;
    const {email,password}=req.body;

    if (req.user.id !== currentID) {
    return res.status(403).json({
        error: "You are not authorized to update this profile!"
    });
    }

    if (!ObjectId.isValid(currentID)) {
    return res.status(400).json({
        error: "Invalid user ID!"
    });
    }
    if (email !== undefined) {
     if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            error: "A valid email address is required!"
        });
    }
    }

    try{
        await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");

       let updateFields ={email};
       if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            error: "Password must be a string with at least 8 characters!"
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateFields.password = hashedPassword;
}

const updatedUser = await UsersCollection.findOneAndUpdate(
    { _id: new ObjectId(currentID) },
    { $set: updateFields },
    { returnDocument: "after" }
);

if (!updatedUser) {
    return res.status(404).json({
        message: "User not found!"
    });
}

const { password: _, ...safeUser } = updatedUser;

return res.status(200).json(safeUser);

    }catch(err){
     console.error("Error during Updating!!",err.message);
     res.status(500).send("Server error");
    }

};

async function deleteUserProfile (req ,res) {
    const currentID = req.params.id;
    if (req.user.id !== currentID) {
    return res.status(403).json({
        error: "You are not authorized to delete this profile!"
    });
}

if (!ObjectId.isValid(currentID)) {
    return res.status(400).json({
        error: "Invalid user ID!"
    });
}

    try{
       await connectClient();
        const db = client.db("githubclone");
        const UsersCollection = db.collection("users");

        const result= await UsersCollection.deleteOne({
         _id: new ObjectId(currentID),
       });

       if(result.deletedCount==0){
        return res.status(404).json({message: "User not found!!"});
       }
       return res.status(200).json({
            message: "User profile deleted successfully!"
        });
    }catch(err){
           console.error("Error during Deleting!!",err.message);
            res.status(500).send("Server error");
    }

};

module.exports={
    getAllUsers,
    signup,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
};



