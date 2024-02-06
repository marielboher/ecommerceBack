import express from "express";
import UserManager from "../dao/UserManager.js";
import passport from "passport";
import { passportCall, authorization } from "../../utils.js";
import UserController from "../controllers/userController.js";
import AuthController from "../controllers/authController.js";
import errorHandler from "../middlewares/errorHandler.js";
import bodyParser from "body-parser";
import { authRequired } from "../middlewares/validateToken.js";

const PRIVATE_KEY = "S3CR3T0";

const router = express.Router();
const UM = new UserManager();
const userController = new UserController();
const authController = new AuthController();

router.post("/login", (req, res, next) => authController.login(req, res, next));

router.post("/register", userController.register.bind(userController));

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
  async (req, res) => {}
);

router.get(
  "/githubcallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("GitHub Callback Route");
    authController.githubCallback(req, res);
  }
);
router.post("/logout", (req, res) => authController.logout(req, res));

router.get(
  "/current",
  passportCall("jwt"),
  authorization("user"),
  (req, res) => {
    userController.currentUser(req, res);
  }
);

router.use(bodyParser.urlencoded({ extended: true }));

router.post("/restore-password", async (req, res) =>
  authController.restorePassword(req, res)
);

router.post("/reset-password/:token", async (req, res) =>
  authController.resetPassword(req, res)
);

router.get("/profile", authRequired, authController.profile)

router.get("/verify", authController.verifyToken);


router.use(errorHandler);

export default router;
