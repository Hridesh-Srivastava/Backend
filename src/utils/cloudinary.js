import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
/*
ham multer ka use krke simply user se input leke files ko local storage me temporary rakh denge uske baad
cloudinary ka use krke unn temporary files jo rakkhi thi wo local storage se cloudinary server or cloud pe
deploy kr denge.
*/
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});
//fsPromise.unlink(path) ;
//if path represents the symbolic link then the files or dir can be unlinked referring to this path
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

            const res = await cloudinary.uploader.upload(localFilePath , {
                resource_type : "auto",
            });
            // console.log("uploaded on cloudinary" , res.url);
            fs.unlinkSync(localFilePath);
            
            return res;
    } catch (error) {
        fs.unlinkSync(localFilePath);

        return null;
    }
}

export { uploadOnCloudinary }
