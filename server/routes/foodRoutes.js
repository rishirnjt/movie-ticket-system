// // /routes/foodRoutes.js
// const express = require("express");
// const Food = require("../models/Food");

// const router = express.Router();

// // Add food
// router.post("/add", async (req, res) => {
//   try {
//     const { name, price, category, image } = req.body;
    
//     const food = await Food.create({
//       name,
//       price,
//       category,
//       image,
//       available: true,
//     });

//     res.json({ success: true, food });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // Get foods
// router.get("/", async (req, res) => {
//   try {
//     const foods = await Food.find();
//     res.json(foods);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // Delete food
// router.delete("/:id", async (req, res) => {
//   try {
//     await Food.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const Food = require("../models/Food");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1699999999999.jpg
  },
});

const upload = multer({ storage });

// Add food with image
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const food = await Food.create({
      name,
      price,
      category,
      image: imageUrl,
      available: true,
    });

    res.json({ success: true, food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get foods
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete food
router.delete("/:id", async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

