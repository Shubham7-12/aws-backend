
const mongoose = require("mongoose");
const {Schema} = mongoose;

const RepositorySchema = new Schema({
    
name: {
    type: String,
    required: true,
    trim: true,
},

    description: {
        type: String,
    },
    content: [
        {
            type:String,
        },
    ],
    
visibility: {
    type: Boolean,
    default: true,
},

    owner:{
        type:Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issues:[
        {
            type:Schema.Types.ObjectId,
            ref:"Issue"

        }
    ]
},
{
    timestamps: true,  
}
);

RepositorySchema.index(
    { owner: 1, name: 1 },
    { unique: true }
);

const Repository = mongoose.model("Repository",RepositorySchema);
module.exports= Repository;