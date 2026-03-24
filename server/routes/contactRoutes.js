const express = require("express");
const router = express.Router();
const {
    submitContactForm,
    getAllContactMessages,
} = require("../controllers/contactController");

router.post("/", submitContactForm);
router.get("/", getAllContactMessages);

module.exports = router;