import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  const avatarLocalPath = req.files?.avatar?.[0]?.path; //original path jo multer ne upload kra
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

export { registerUser };