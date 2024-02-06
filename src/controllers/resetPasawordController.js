import nodemailer from "nodemailer";
import { userModel } from "../models/user.models.js";
import crypto from "crypto";
import { ENV_CONFIG } from "../config/config.js";

const sendResetPasswordEmail = async (userEmail) => {
  const user = await userModel.findOne({ email: userEmail });
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; 
  await user.save();

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV_CONFIG.emailUser,
      pass: ENV_CONFIG.emailPassword,
    },
  });

  const resetUrl = `http://localhost:8000/reset-password/${resetToken}`;
  let mailOptions = {
    from: "tuemail@example.com",
    to: userEmail,
    subject: "Link de restablecimiento de contraseña",
    text: `Por favor, para restablecer tu contraseña haz clic en el siguiente enlace: ${resetUrl}`,
    html: `<p>Por favor, para restablecer tu contraseña haz clic en el siguiente enlace: <a href="${resetUrl}">restablecer contraseña</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendResetPasswordEmail;
