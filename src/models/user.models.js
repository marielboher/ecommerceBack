import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  age: Number,
  password: String,
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "carts" },
  role: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  last_connection: Date,
  documents: [
    {
      name: String,
      reference: String,
      status: {
        type: String,
        default: "Pending",
      },
    },
  ],
});

export const userModel = mongoose.model("users", userSchema);
