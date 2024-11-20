import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
   //    message : "OK",
   // });
  const { fullname, username, email, password } = req.body;
    //arr.some() takes upto 3 params and return true/false based on any condition setted for it.
  if ([fullname, username, email, password].some((field) => {
    return field?.trim() === "" //optional chain karke trim kardia
  })
  ) { 
    throw new ApiError(400, "All fields are required!");
  }

  const existedUser = await User.findOne({  //if user exists
    $or: [{ email }, { username }] //$or check karega first document related to user's email and pass. and simply return kardega
  });

  if (existedUser) {
    throw new ApiError(409, "User with same email or username already exists.");
  }

  //declaring local paths of coverImage and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path; //original path jo multer ne upload kra
  console.log("Avatar Local Path:", avatarLocalPath);

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
    console.log("CoverImage Local Path:", coverImageLocalPath);
  } else {
    console.log("No cover image file received");
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  //uploading to cloudinary
  try {
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
      throw new ApiError(500, "Error uploading avatar to Cloudinary");
    }
    //☝🏻👇🏻await coz jabtak image upload nhi ho jayegi tabtak aage ka code run nhi karega
    let coverImageUrl = "";
    if (coverImageLocalPath) {
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      coverImageUrl = coverImage?.url || "";
    }

    //sign up
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImageUrl
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
//.select() krke jo cheez nhi chahiye
//mongodb apne aap har ek entry k sath usme `_id` name ki field add kr deta hai

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user.");
    }

    return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully.")
    );
  } catch (error) {
    console.error("Error in user registration:", error);
    if (error.message.includes("Must supply api_key")) {
      throw new ApiError(500, "Cloudinary configuration error. Please check your environment variables.");
    }
    throw new ApiError(500, `Error in user registration: ${error.message}`);
  }
});

//generating access and refresh tokens
  const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken
      await user.save({validateBeforeSave : false}) //validate mat karo/lagao seedha save kardo

      return { accessToken , refreshToken }

    } catch (error) {
      throw new ApiError(500, "Something went wrong in generating access and refresh tokens.")
    }
  }

//sign in
const loginUser = asyncHandler(async (req , res) => {
  const { email, password } = req.body;
  /*
  so as we know we create/declare new variables inside destructure, but we've maken mistake that not declared username inside destructure, but used 
  inside $or so obviously its undeclared but used , throws an error, so make sure that to use vars. in $or here first declare it during destruture.
  */
  console.log(email);
    
  if(!(email || password)){
    throw new ApiError(400, "email or password is required.")
  }

  const user = await User.findOne({
    $or : [{email} , {password}]
    // $or find karega koi sa bhi ek either username or password jo mil jaye uss user se related and simply return kardega
  });

  if(!user){
    throw new ApiError(404, "User not found!")
  }
  
/*
method banane k liye yaha pe ham User ka use nahi karenge coz ye User from mongodb k mongoose ka ek object hai, joki hamne methods banene me like aise
use kia tha e.g. findById, findOne etc.. But hamne to methods k liye ek apna user create kia tha for isPasswordCorrect etc. to ham yaha pe methods k liye
bhi yahi custom wala small user hi use karenge for validation 
*/
//sign in validation
const isPasswordValid = await user.isPasswordCorrect(password);

if(!isPasswordValid){
  throw new ApiError(401 , "Invalid user credentials!")
}

  const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  //cookies declare
  //waise to cookies frontend k through declare or set ho jati hai par iss case me hamne ye options yaha declare krdiye to ab ye
  //server se hi operate honge , and not from frontend now.
  const options = {
    httpOnly : true,
    secure : true
  }

  return res.status(200).cookie(
    "access token: " , accessToken , options
  )
  .cookie(
    "refresh token: " , refreshToken , options
  ).json(
    new ApiResponse(200,
      {
        user : loggedInUser , accessToken , refreshToken
      },
      "User logged in successfully."
    )
  )

});

//logging out (clearing all cookies here first)
const logOutUser = asyncHandler(async(req , res) => {
  await User.findByIdAndUpdate(req.user._id , {
    //$set object k andar me jaha bhi changes and update krna hai wo $set ko bata do wo un values me wo specific 
    //fields ko update kardega
    $set: {
      refreshToken : undefined
    }
  },
{
  new : true
});

  const options = {
    httpOnly : true,
    secure : true
  }
  return res.status(200).clearCookie("access token: " , options).clearCookie("refresh token: " , options)
  .json(
    new ApiResponse(200, {} , "User logged out successfully.")
  )
});

//refresh token DB me save rehta hai to jab chahe usse request kr sakte hai
//if access token expired ho jata hai to frontend wala wapas ek request bhej k specific endpoint k api me hit krne k baad
//uss token ko refresh kr sakta hai

//creating endpoint for access token
const refreshAccessToken = asyncHandler(async(req , res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    
    throw new ApiError(401 , "Unauthorized request.")
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError(401 , "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401 , "Refresh token is wrong or expired.")
    }

    const options = {
      httpOnly : true,
      secure : true
    }
    const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

    return res.status(200)
    .cookie("Access token: " , accessToken , options)
    .cookie("Refresh token: " , newRefreshToken , options)
    .json(
      new ApiResponse(200,
        {accessToken , refreshToken : newRefreshToken},
        "Access token updated successfully."
      )
    )
  } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid refresh token")
  }
});

//change `user` password
const changeCurrentPassword = asyncHandler(async(req , res) => {
  const {oldPassword , newPassword , confirmPassword} = req.body;
  if(newPassword !== confirmPassword){
    throw new ApiError(400, "confirm password is incorrect.")
  }
  const user = await User.findById(req.user?._id);
  //check whether the old password is correct or not
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(400, "Old password is not correct.")
  }
  user.password = newPassword
  await user.save({validateBeforeSave : false});

  return res.status(200).json(
    new ApiResponse(200, {} , "Password changed successfully.")
  )
});

//if user is logged in currently then we can instantly check the current session of that user
const checkCurrentUser = asyncHandler(async(req , res) => {
  return res.status(200).json(
    new ApiResponse(200 , req.user , "User fetched successfully.")
  )
});

//update user details
const updateAccountDetails = asyncHandler(async(req , res) => {
  const {fullname , email} = req.body;
  if(!fullname || !email){
    throw new ApiError(400 , "All fields are required.")
  }
  const user = await User.findByIdAndUpdate(req.user?._id , {
    $set : {
      fullname,
      email : email
    }
  },
    {
      new : true
    }).select("-password");

  return res.status(200).json(
    new ApiResponse(200 , user , "Account details updated successfully.")
  )
});

//update avatar
const updateUserAvatar = asyncHandler(async(req,res) => {
  const avatarLocalPath = req.file?.path;

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is missing.");
  }
  //upload on cloud
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(400 , "Error while uploading the avatar file.")
  }

  const user = await User.findByIdAndUpdate(req.user?._id , {
    $set : {
      avatar : avatar.url
    }
  },
    {
      new : true
    });

    return res.status(200).json(
      new ApiResponse(200 ,  user , "Avatar image updated successfully.")
    )
    });

    //update coverImage
    const updateUserCoverImage = asyncHandler(async(req , res) => {
      const coverImageLocalPath = req.file?.path;
      if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover Image file is missing.")
      }

      //upload on cloud
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading cover image.")
      }

      const user = await User.findByIdAndUpdate(req.user?._id , {
        $set : {
          coverImage : coverImage.url
        }
      }, {
        new : true
      });

      return res.status(200).json(
        new ApiResponse(200, user , "Cover Image updated successfully.")
      )
    });

 const getUserChannelProfile = asyncHandler(async(req , res) => {
  const { username } = req.params;
  if(!username?.trim()){
    throw new ApiError(400 , "Username is missing.")
  }

  const channel = await User.aggregate([
    { //1st pipeline
      $match : {
        username : username?.toLowerCase()
      }
    },
    { //2nd pipeline
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "channel",
        as : "subscribers"
      }
    },
    { //3rd pipeline

    }
  ])
 })

export { registerUser , loginUser , logOutUser , refreshAccessToken , changeCurrentPassword , checkCurrentUser , updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile };