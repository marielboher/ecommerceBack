import { Router } from "express";
import { sendSMS } from "../controllers/sms.controller.js";

const smsRouter = Router();

smsRouter.get("/", sendSMS);

export default smsRouter;
