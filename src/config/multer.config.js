import multer from "multer";
import fs from "fs";
import path from "path";
import __dirname from "../../utils.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder;

    if (file.fieldname === "profileImage") {
      folder = path.join(__dirname, "/uploads/profiles");
    } else if (file.fieldname === "productImage") {
      folder = path.join(__dirname, "/uploads/products");
    } else {
      folder = path.join(__dirname, "/uploads/documents");
    }

    // Crear el directorio si no existe
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const uploadConfig = multer({ storage });

export default uploadConfig;
