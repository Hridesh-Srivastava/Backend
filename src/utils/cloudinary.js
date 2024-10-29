import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
/*
ham multer ka use krke simply user se input leke files ko local storage me temporary rakh denge uske baad
cloudinary ka use krke unn temporary files jo rakkhi thi wo local storage se cloudinary server or cloud pe
deploy kr denge.
*/
dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables are missing!");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

//fsPromise.unlink(path) ;
//if path represents the symbolic link then the files or dir can be unlinked referring to this path

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided for Cloudinary upload");
      return null;
    }

    if (!fs.existsSync(localFilePath)) {
      console.log(`File does not exist at path: ${localFilePath}`);
      return null;
    }

    console.log(`Attempting to upload file: ${localFilePath}`);
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully to Cloudinary:", result.url);
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error; // Propagate the error instead of returning null
  }
};

export { uploadOnCloudinary };