import  {Router} from "express";
import {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const routes=Router();


routes.route("/register").post(
    upload.fields([
        { 
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),
    registerUser
);
routes.route("/login").post(loginUser)


//secured routes

routes.route("/logout").post(verifyJWT,  logoutUser)
routes.route("/refresh-token").post(refreshAccessToken)
routes.route("/change-password").post(verifyJWT, changeCurrentPassword)
routes.route("/show-user-details").get(verifyJWT, getCurrentUser)
routes.route("/update-account-details").patch(verifyJWT, updateAccountDetails)

routes.route("/update-user-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
routes.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
routes.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
routes.route("/watch-history").get(verifyJWT,getWatchHistory)
export  default routes;