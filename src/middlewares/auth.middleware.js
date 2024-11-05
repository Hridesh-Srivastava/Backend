import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

//to check from the server whether the user is verified/authorized user or not.
export const verifyJWT = asyncHandler(async(req , res , next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){ //if token was not received
            throw new ApiError(401 , "unauthorized request")
        }
        //if token was received
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        //if access token didn't matched
        if(!user){
            throw new ApiError(401 , "Invalid Access Token.")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Token.")
    }
});