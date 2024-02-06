import passport from "passport";
import jwt from "passport-jwt";
import local from "passport-local";
import { userModel } from "../models/user.models.js";
import { createHash, isValidPassword } from "../../utils.js";
import GitHubStrategy from "passport-github2";
import AuthService from "../services/authService.js";
import { ENV_CONFIG } from "../config/config.js";

const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;
const LocalStrategy = local.Strategy;

const initializePassport = () => {
  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;

        try {
          let user = await userModel.findOne({ email: username });

          if (user) {
            console.log("El usuario " + email + " ya se encuentra registrado!");
            return done(null, false);
          }

          user = {
            first_name,
            last_name,
            email,
            age,
            password: createHash(password),
          };

          if (
            user.email == ENV_CONFIG.adminEmail &&
            password === ENV_CONFIG.adminPassword
          ) {
            req.logger.info("Asignando role de admin");
            user.role = "admin";
          } else if (
            user.email == ENV_CONFIG.premiumEmail &&
            password === ENV_CONFIG.premiumPassword
          ) {
            req.logger.info("Asignando role de premium");
            user.role = "premium";
          } else {
            req.logger.info("Asignando role de usuario");
            user.role = "user";
          }

          let result = await userModel.create(user);
          if (result) {
            return done(null, result);
          }
        } catch (error) {
          req.logger.error("Error durante el proceso de registro:", error);
          return done(error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (username, password, done) => {
        try {
          let user = await userModel.findOne({ email: username });

          if (!user) {
            return done(null, false, { message: "Usuario incorrecto." });
          }
          if (!isValidPassword(user, password)) {
            return done(null, false, { message: "Contraseña incorrecta." });
          }

          await user.save();

          return done(null, user);
        } catch (error) {
          console.log("last_conection", user.last_connection);
          return done(error);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: ENV_CONFIG.jwtSecret,
      },
      async (jwt_payload, done) => {
        console.log("JWT Payload:", jwt_payload);
        try {
          const user = await userModel.findOne({ email: jwt_payload.email });
          if (!user) {
            return done(null, false, { message: "Usuario no encontrado." });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

passport.use(
  "github",
  new GitHubStrategy(
    {
      clientID: ENV_CONFIG.clientIdGithub,
      clientSecret: ENV_CONFIG.clientSecretGithub,
      callbackURL: "http://localhost:8000/api/sessions/githubcallback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const authService = new AuthService();
        console.log("Profile:", JSON.stringify(profile, null, 2));
        const user = await authService.githubCallback(profile);

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  let user = await userModel.findById(id);
  done(null, user);
});
export default initializePassport;

const cookieExtractor = (req) => {
  let token = null;

  if (req && req.cookies) {
    req.logger.info("Cookies:", req.cookies);
    token = req.cookies["coderCookieToken"];
    console.log("Token in cookie extractor:", token);
  }

  req.logger.info("Token Extracted:", token);
  return token;
};
