import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler(async (req ,res) => {
   // res.sendStatus(200).json({
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
});

export { registerUser }