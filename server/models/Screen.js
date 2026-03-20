const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ["2D", "3D"],
      default: "2D",
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

screenSchema.index({ name: 1 }, { unique: true });

module.exports =
  mongoose.models.Screen || mongoose.model("Screen", screenSchema);