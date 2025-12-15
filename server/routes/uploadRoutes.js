// const express = require('express');
// const multer = require('multer');
// const router = express.Router();
// const path = require('path');

// // Storage config for multer
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function(req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });


// // Upload endpoint
// router.post('/', upload.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }
//   res.status(200).json({ url: `uploads/${req.file.filename}`});
// });

// module.exports = router;


const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // folder must exist
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  console.log("File received:", req.file);
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const url = `/uploads/${req.file.filename}`;
  console.log("File URL returned:", url);
  
  res.status(200).json({ url });
});

module.exports = router;
