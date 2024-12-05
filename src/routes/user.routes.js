import { Router } from "express";
import { registerUser , loginUser , logOutUser , refreshAccessToken , changeCurrentPassword , checkCurrentUser , updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile , getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post( 
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ])
    , registerUser);

    router.route("/login").post(loginUser);

    //secured routes
    router.route("/logout").post(verifyJWT , logOutUser);

    router.route("/refresh-token").post(refreshAccessToken);
    
    router.route("/change-password").post(verifyJWT , changeCurrentPassword);

    router.route("/check-user").get(verifyJWT , checkCurrentUser);

    router.route("/update-details").patch(verifyJWT , updateAccountDetails);
    //saari details update na hojaye post krne pe ya put krne pe entire resource isliye hamne
    //patch kia for minor patch updates in resources and not change entire resource.
    router.route("/update-avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar);
    //upload.single means ki ek single avatar or coverImage ki file hi upload ho payegi
    router.route("/update-coverImage").patch(verifyJWT , upload.single("coverImage") , updateUserCoverImage);

    router.route("/c:/username").get(verifyJWT , getUserChannelProfile);

    router.route("/watch-history").get(verifyJWT , getWatchHistory);

export default router;