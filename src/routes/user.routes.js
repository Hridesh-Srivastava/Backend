import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { Router } from "express";

const router = Router();
router.route("/register").post(registerUser);

export default router;