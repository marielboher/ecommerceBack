import UserManager from "../dao/UserManager.js";
import { ENV_CONFIG } from "../config/config.js";
import CartManager from "../dao/cartManager.js";

class UserService {
  constructor() {
    this.userManager = new UserManager();
    this.CartManager = new CartManager();
  }

  async registerUser({
    first_name,
    last_name,
    email,
    age,
    password,
    role,
    last_connection,
  }) {
    try {
      const cartResponse = await this.CartManager.newCart();
      console.log("Cart response:", cartResponse);
      if (cartResponse.status !== "ok") {
        return { status: "error", message: "Error creating cart" };
      }

      const role =
        email === ENV_CONFIG.adminEmail && password === ENV_CONFIG.adminPassword
          ? "admin"
          : email === ENV_CONFIG.premiumEmail &&
            password === ENV_CONFIG.premiumPassword
          ? "premium"
          : "user";

      const cartId = cartResponse.id;
      console.log("Cart ID:", cartId);

      const user = await this.userManager.addUser({
        first_name,
        last_name,
        email,
        age,
        password,
        role,
        cart: cartId,
        last_connection,
      });

      if (user) {
        return { status: "success", user, redirect: "/login" };
      } else {
        return { status: "error", message: "User already exists" };
      }
    } catch (error) {
      return { status: "error", message: "Internal Server Error" };
    }
  }

  async restorePassword(user, hashedPassword) {
    return await this.userManager.restorePassword(user, hashedPassword);
  }
}

export default UserService;
