import { Router } from "express";
import ProductManager from "../dao/ProductManager.js";
import ProductService from "../services/productService.js";
import productController from "../controllers/productControllers.js";
import { authorization, passportCall } from "../../utils.js";
import errorHandler from "../middlewares/errorHandler.js";

const productsRouter = Router();
const PM = new ProductManager();
const productService = new ProductService();

productsRouter.get("/", productController.getProducts.bind(productController));
productsRouter.get(
  "/:pid",
  productController.getProductById.bind(productController)
);
productsRouter.post(
  "/",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  productController.addProduct.bind(productController)
);
productsRouter.put(
  "/:pid",
  passportCall("jwt"),
  authorization(["admin"]),
  productController.updateProduct.bind(productController)
);
productsRouter.delete(
  "/:pid",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  productController.deleteProduct.bind(productController)
);

productsRouter.use(errorHandler);
export default productsRouter;
