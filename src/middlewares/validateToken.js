import jwt from "jsonwebtoken";
import { ENV_CONFIG } from "../config/config.js";

export const authRequired = (req, res, next) => {
  const { coderCookieToken } = req.cookies;

  if (!coderCookieToken)
    return res.status(401).json({
      message: "Unauthorized in verify",
    });

  jwt.verify(coderCookieToken, ENV_CONFIG.jwtSecret, (err, user) => {
    if (err) return res.status(401).json({ message: "invalid token" });

    req.user = user;

    next();
  });
};
