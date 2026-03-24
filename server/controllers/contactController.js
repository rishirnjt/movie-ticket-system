const ContactMessage = require("../models/ContactMessage");

exports.submitContactForm = async (req, res) => {
    try{
        const { name, email, subject, message } = req.body;
        
        if(!name || !email || !subject || !message) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const newMessage = await ContactMessage.create({
            name,
            email,
            subject,
            message,
        });

        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (err) {
        console.error("Contact form submit error:",err);
        res.status(500).json({
            message: "Failed to send message",
        });
    }
};

exports.getAllContactMessages = async (req, res) =>{
    try{
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 })
            .lean();
            
        res.json(messages);
    } catch (err){
        console.error("Get contact messages error:", err);
        res.status(500).json({
            message: "Failed to fetch contact messages",
        });
    }
};