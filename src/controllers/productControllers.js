import ProductService from "../services/productService.js";
import { socketServer } from "../../app.js";
import mongoose from "mongoose";
import CustomError from "../services/errors/customError.js";
import { generateProductErrorInfo } from "../services/errors/messages/product-error.js";
import { transporter } from "./email.controller.js";
import { userModel } from "../models/user.models.js";

class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  async getProducts(req, res) {
    try {
      const products = await this.productService.getProducts(req.query);
      res.send(products);
    } catch (error) {
      const productError = new CustomError({
        name: "Product Fetch Error",
        message: "Error fetching products.",
        code: 500,
        cause: error.message,
      });
      console.error(productError);
      res.status(productError.code).send({
        status: "error",
        message: "Error fetching products.",
      });
    }
  }

  async getProductById(req, res, next) {
    try {
      const pid = req.params.pid;
      req.logger.info("Product ID:", pid);

      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new CustomError({
          name: "Invalid ID Error",
          message: "El ID del producto proporcionado no es válido",
          code: 400,
          cause: generateProductErrorInfo(pid),
        });
      }

      const product = await this.productService.getProductById(pid);

      if (!product) {
        throw new CustomError({
          name: "Product Not Found Error",
          message: generateProductErrorInfo(pid),
          code: 404,
        });
      }

      res.status(200).json({
        status: "success",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
  async getCategories(req, res) {
    try {
      const categories = await this.productService.getCategories();
      res.json({
        status: "success",
        categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).send({ status: "error", message: "Error fetching categories." });
    }
  }
  async getProductsByCategory(req, res) {
    try {
      const category = req.params.category;
      const products = await this.productService.getProductsByCategory(category);
      res.json({
        status: "success",
        data: products,
      });
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).send({ status: "error", message: "Error fetching products by category." });
    }
  }
  async addProduct(req, res) {
    let {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    } = req.body;

    const owner = req.user._id;

    if (!title) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Title!",
      });
      return false;
    }

    if (!description) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Description!",
      });
      return false;
    }

    if (!code) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Code!",
      });
      return false;
    }

    if (!price) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Price!",
      });
      return false;
    }

    status = !status && true;

    if (!stock) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Stock!",
      });
      return false;
    }

    if (!category) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Category!",
      });
      return false;
    }

    if (!thumbnails) {
      res.status(400).send({
        status: "error",
        message: "Error! No se cargó el campo Thumbnails!",
      });
      return false;
    }
    try {
      const wasAdded = await this.productService.addProduct({
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails,
        owner,
      });

      if (wasAdded && wasAdded._id) {
        req.logger.info("Producto añadido correctamente:", wasAdded);
        res.send({
          status: "ok",
          message: "El Producto se agregó correctamente!",
          productId: wasAdded._id,
        });
        socketServer.emit("product_created", {
          _id: wasAdded._id,
          title,
          description,
          code,
          price,
          status,
          stock,
          category,
          thumbnails,
          owner,
        });
        return;
      } else {
        req.logger.error("Error al añadir producto, wasAdded:", wasAdded);
        res.status(500).send({
          status: "error",
          message: "Error! No se pudo agregar el Producto!",
        });
        return;
      }
    } catch (error) {
      req.logger.error("Error en addProduct:", error, "Stack:", error.stack);
      res
        .status(500)
        .send({ status: "error", message: "Internal server error." });
      return;
    }
  }

  async updateProduct(req, res) {
    try {
      const {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails,
      } = req.body;
      const pid = req.params.pid;

      const wasUpdated = await this.productService.updateProduct(pid, {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails,
      });

      if (wasUpdated) {
        res.send({
          status: "ok",
          message: "El Producto se actualizó correctamente!",
        });
        socketServer.emit("product_updated");
      } else {
        res.status(500).send({
          status: "error",
          message: "Error! No se pudo actualizar el Producto!",
        });
      }
    } catch (error) {
      req.logger.error(error);
      res
        .status(500)
        .send({ status: "error", message: "Internal server error." });
    }
  }

  async deleteProduct(req, res) {
    try {
      const pid = req.params.pid;

      if (!mongoose.Types.ObjectId.isValid(pid)) {
        req.logger.error("ID del producto no válido");
        res.status(400).send({
          status: "error",
          message: "ID del producto no válido",
        });
        return;
      }

      const product = await this.productService.getProductById(pid);

      if (!product) {
        req.logger.error("Producto no encontrado");
        res.status(404).send({
          status: "error",
          message: "Producto no encontrado",
        });
        return;
      }
      const owner = await userModel.findById(product.owner);
      if (owner && owner.role == "premium") {
        const mailOptions = {
          from: "tu-email@example.com",
          to: owner.email,
          subject: "Tu Producto ha sido Eliminado",
          text: `Lamentamos informarte que tu producto ${product.title} ha sido eliminado.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error al enviar correo:", error);
          } else {
            console.log("Correo enviado: " + info.response);
          }
        });
      }
      if (
        !req.user ||
        (req.user.role !== "admin" &&
          (!product.owner ||
            req.user._id.toString() !== product.owner.toString()))
      ) {
        req.logger.error(
          "Operación no permitida: el usuario no tiene derechos para eliminar este producto o el producto no tiene propietario definido."
        );
        res.status(403).send({
          status: "error",
          message:
            "No tiene permiso para eliminar este producto o producto no tiene propietario.",
        });
        return;
      }

      const wasDeleted = await this.productService.deleteProduct(pid);

      if (wasDeleted) {
        req.logger.info("Producto eliminado exitosamente");
        res.send({
          status: "ok",
          message: "Producto eliminado exitosamente",
        });
      } else {
        res.status(500).send({
          status: "error",
          message: "Error! No se pudo eliminar el Producto!",
        });
      }
    } catch (error) {
      req.logger.error("Error en deleteProduct:", error);
      res
        .status(500)
        .send({ status: "error", message: "Internal server error." });
    }
  }
}

export default new ProductController();
