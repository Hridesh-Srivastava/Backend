import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createUser = asyncHandler(async (req , res) => {
    const {name, email, password } = req.body;

    if(!name){
        throw ApiError(403,message="name is required")
    }
    
    else{

    }
})