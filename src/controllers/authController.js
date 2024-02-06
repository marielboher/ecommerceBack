import jwt from "jsonwebtoken";
import { createHash, isValidPassword } from "../../utils.js";
import { userModel } from "../models/user.models.js";
import AuthService from "../services/authService.js";
import CustomError from "../services/errors/customError.js";
import EErrors from "../services/errors/errors-enum.js";
import { generateAuthenticationErrorInfo } from "../services/errors/messages/user-auth-error.js";
import sendResetPasswordEmail from "./resetPasawordController.js";
import { ENV_CONFIG } from "../config/config.js";

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await this.authService.login(email, password);
      req.logger.info("User data retrieved:", userData);

      userData.user.last_connection = new Date();
      console.log("last_conection +653626", userData.user.last_connection);

      await userData.user.save();

      if (!userData || !userData.user) {
        req.logger.error("Invalid credentials");
        const customError = new CustomError({
          name: "Authentication Error",
          message: "Invalid credentials",
          code: 401,
          cause: generateAuthenticationErrorInfo(email),
        });
        return next(customError);
      }

      if (userData && userData.user) {
        req.session.user = {
          id: userData.user.id || userData.user._id,
          email: userData.user.email,
          first_name: userData.user.firstName || userData.user.first_name,
          last_name: userData.user.lastName || userData.user.last_name,
          age: userData.user.age,
          token: userData.token,
          role: userData.user.role,
          cart: userData.user.cart,
        };
      }

      req.logger.info("Full user data object:", userData.user);

      res.cookie("coderCookieToken", userData.token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      return res.status(200).json({
        status: "success",
        user: userData.user,
        token: userData.token,
        redirect: "/products",
      });
    } catch (error) {
      req.logger.error("An error occurred:", error);
      return next(error);
    }
  }
  async githubCallback(req, res) {
    try {
      if (req.user) {
        req.session.user = req.user;
        req.session.loggedIn = true;
        return res.redirect("/products");
      } else {
        return res.redirect("/login");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return res.redirect("/login");
    }
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/profile");
      }
      return res.redirect("/login");
    });
  }

  async restorePassword(req, res) {
    const { email } = req.body;
    try {
      await sendResetPasswordEmail(email);
      res.send(
        "Se ha enviado un enlace de restablecimiento de contraseña a tu correo electrónico."
      );
    } catch (error) {
      console.error("Error in sendResetPasswordEmail:", error);
      res
        .status(500)
        .send(
          "Hubo un error al procesar tu solicitud de restablecimiento de contraseña. " +
            error.message
        );
    }
  }

  async resetPassword(req, res) {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send("Las contraseñas no coinciden.");
    }

    try {
      const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          message:
            "El token de restablecimiento de contraseña es inválido o ha expirado.",
          tokenExpired: true,
        });
      }

      const isSamePassword = isValidPassword(user, password);

      if (isSamePassword) {
        return res
          .status(400)
          .send(
            "La nueva contraseña debe ser diferente a la contraseña actual."
          );
      }

      user.password = createHash(password);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.send("Tu contraseña ha sido actualizada con éxito.");
    } catch (error) {
      console.error("Error al resetear la contraseña:", error);
      res
        .status(500)
        .send(
          "Error interno del servidor al intentar actualizar la contraseña."
        );
    }
  }

  async profile(req, res) {
    const userFound = await userModel.findById(req.user.id);
    if (!userFound) {
      res.status(404).send("user not found");
    }
    return res.status(200).json({
      email: userFound.email,
      firstName: userFound.first_name,
      lastName: userFound.last_name,
      age: userFound.age,
      role: userFound.role,
      cart: userFound.cart,
    });
  }

  async verifyToken(req, res) {
    const token = req.cookies.coderCookieToken;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    jwt.verify(token, ENV_CONFIG.jwtSecret, async (err, user) => {
      if (err) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      const userFound = await userModel.findById(user.id);
      if (!userFound) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      return res.status(200).json({
        username: userFound.username,
        email: userFound.email,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        age: userFound.age,
        role: userFound.role,
        cart: userFound.cart,
      });
    });
  }
}

export default AuthController;
