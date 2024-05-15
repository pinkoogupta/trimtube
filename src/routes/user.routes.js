import  {Router} from "express";
import {loginUser,registerUser,logoutUser,refreshAccessToken, changeCurrentPassword ,getCurrentUser,updateAccountDetails} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {logoutUser} from "../controllers/user.controller.js";
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

routes.route("/logout").post(verifyJWT,logoutUser);
routes.route("/refresh-token").post(refreshAccessToken);


export  default routes;