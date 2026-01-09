// const Admin = require('../models/Admin');
// const jwt = require('jsonwebtoken');

// exports.loginUser = async (req, res) => {
//     const{email, password } = req.body;

//     try{
//         const admin = await Admin.findOne({ email });

//         if(!admin) {
//             return res.status(400).json({ message: 'Invalid email or password '});
//         }

//         if(admin.password !== password){
//             return res.status(400).json({ message: 'Invalid email or password '});
//         }

//         const token = jwt.sign(
//             {id: admin_id, isAdmin: admin.isAdmin },
//             process.env.JWT_SECRET,
//             { expiresIn: '2h' }
//         );

//         res.json({
//             token,
//             user: {
//                 id: admin_id,
//                 name: admin.name,
//                 isAdmin: admin.isAdmin,
//                 email: admin.email,
//             },
//         });
//     }catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };