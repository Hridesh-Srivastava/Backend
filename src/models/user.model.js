   import mongoose , {Schema} from "mongoose";
   import jwt from "jsonwebtoken";
   import bcrypt from "bcrypt";

   const userSchema = new Schema({
    username : {
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        unique:true,
        index:true
    },
    email : {
        type:String,
        lowercase:true,
        unique:true,
        required:true,
        trim:true,
    },
    fullname : {
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true , "❗Password is required"]
    },
    refreshToken:{
        type:String,
    }
   },
 {
    timestamps:true
 }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password , 10);
    next(); 
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password);
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id : this._id,
        username : this.username,
        email : this.email,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
 )
}
