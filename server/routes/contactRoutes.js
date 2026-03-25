const express = require("express");
const router = express.Router();
const {
    submitContactForm,
    getAllContactMessages,
    updateContactStatus,
} = require("../controllers/contactController");

router.post("/", submitContactForm);
router.get("/", getAllContactMessages);
router.patch("/:id/status", updateContactStatus);

module.exports = router;