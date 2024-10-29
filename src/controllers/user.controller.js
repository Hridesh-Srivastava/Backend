import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req ,res) => {
   // res.status(200).json({
   //    message : "OK",
   // });

   const {fullname, username, email, password} = req.body;
//arr.some() takes upto 3 params and return true/false based on any condition setted for it.
   if([fullname, username, email, password].some((filter) => {
      return filter?.trim() === ""; //optional chain karke trim kardia
   })){
      throw new ApiError(400, "All fields are required!");
   }

   const existedUser = await User.findOne({ //if user exists 
      $or: [{email},{password}] //$or check karega first document related to user's email and pass. and simply return kardega
   });


if(existedUser){
   throw new ApiError(409, "User with same email or password already exists.")
}

//declaring localPath
const avatarLocalPath = req.files?.avatar[0]?.path; //original path jo multer ne upload kra

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
   coverImageLocalPath = req.files.coverImage[0].path;
}

if(!avatarLocalPath){
   throw new ApiError(400, "Avatar file is required.");
}

//upload avatar and coverImage to cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath);

//☝🏻👇🏻await coz jabtak image upload nhi ho jayegi tabtak aage ka code run nhi karega

const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
   throw new ApiError(400, "Avatar file is required.")
}

//sign up
const user = await User.create({
   username : username.toLowerCase(),
   fullname,
   email,
   password,
   avatar : avatar.url,
   coverImage : coverImage?.url || ""
});

const createdUser = await User.findById(user._id).select("-password -refreshToken"); //.select() krke jo cheez nhi chahiye
//mongodb apne aap har ek entry k sath usme `_id` name ki field add kr deta hai

if(!createdUser){
   throw new ApiError(500, "Something went wrong! Error while creating a user.")
}

return res.status(201).json(
   new ApiResponse(200, createdUser, "User created successfully.")   
);
});
export { registerUser }