const transporter = require("../config/email");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

//Reservation Email
const sendReservationEmail = async (userEmail, data) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Seats Reserved - Cinemax",
    html: `
      <h2>Your Seats Are Reserved 🎬</h2>
      <p><strong>Movie:</strong> ${data.movie}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Seats:</strong> ${data.seats}</p>
      <p><strong>Total:</strong> Rs ${data.total}</p>
      <p>Please complete payment before expiry.</p>
      <p>- Cinemax Team</p>
    `
  });

  console.log("Reservation email sent");
};


// Purchase email (with PDF e-ticket + QR)
const sendPurchaseEmail = async (
  userEmail,
  { movie, date, time, seats, foods, totalPaid, ticketId }
) => {
  // Generate QR code 
  const qrData = JSON.stringify({
    ticketId,
    movie,
    seats,
    date,
    time
  });
  const qrImage = await QRCode.toBuffer(qrData);

  // Create PDF
  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));
  const pdfEnd = new Promise(resolve => doc.on("end", resolve));

  // ===== PDF DESIGN =====
  doc.fontSize(22).text(" Cinemax E-Ticket", { align: "center" });
  doc.moveDown();

  doc.fontSize(14).text(`Movie: ${movie}`);
  doc.text(`Date: ${date}`);
  doc.text(`Time: ${time}`);
  doc.text(`Seats: ${seats}`);
  doc.text(`Ticket ID: ${ticketId}`);

  doc.moveDown();

  // Foods
  if (foods && foods.length > 0) {
    doc.text("Foods Ordered:", { underline: true });
    foods.forEach(f => {
      doc.text(`${f.name} x${f.quantity} - Rs ${f.price * f.quantity}`);
    });
  } else {
    doc.text("Foods Ordered: None");
  }

  doc.moveDown();
  doc.text(`Total Paid: Rs ${totalPaid}`, { bold: true });

  doc.moveDown();

  // QR CODE 
  doc.text("Scan at Entrance", { align: "center" });
  doc.moveDown();

  doc.image(qrImage, {
    fit: [150, 150],
    align: "center",
    valign: "center"
  });

  doc.moveDown();
  doc.text("Enjoy your movie! - Cinemax Team", { align: "center" });

  doc.end();
  await pdfEnd;

  const pdfBuffer = Buffer.concat(buffers);

  // Send email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your Cinemax E-Ticket",
    html: `
      <h2>Purchase Confirmed - Cinemax</h2>
      <p>Your seats have been successfully booked!</p>
      <p>Please find your e-ticket attached for entry.</p>
      <p>Show this QR code at the cinema entrance.</p>
      <p>- Cinemax Team</p>
    `,
    attachments: [
      {
        filename: `e-ticket-${ticketId}.pdf`,
        content: pdfBuffer
      }
    ]
  });

  console.log("Purchase email sent with QR e-ticket");
};

//Password Reset OTP Email
const sendResetOtpEmail = async (userEmail, firstName, otp) => {
  await transporter.sendMail({
    from : process.env.EMAIL_USER,
    to: userEmail,
    subject: "Password Reset OTP - Cinemax",
     html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #222;">
        <h2 style="color: #e50914; margin-bottom: 10px;">Password Reset Request</h2>
        
        <p>Hello ${firstName || "User"},</p>
        
        <p>We received a request to reset your Cinemax account password.</p>
        
        <p>Please use the OTP below to continue:</p>

        <div style="
          margin: 20px 0;
          padding: 15px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 8px;
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
          color: #e50914;
        ">
          ${otp}
        </div>

        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>

        <p style="margin-top: 30px;">- Cinemax Team</p>
      </div>
    `,
  });

  console.log("Password reset OTP email sent");
};

// Password Reset Email
// const sendResetPasswordEmail = async (userEmail, resetUrl) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: userEmail,
//     subject: "Password Reset Request - Cinemax",
//     html: `
//       <h2>Password Reset</h2>
//       <p>You requested to reset your password.</p>
//       <p>Click the link below to set a new password:</p>

//       <a href="${resetUrl}" 
//          style="display:inline-block;
//                 padding:10px 20px;
//                 background:#e50914;
//                 color:white;
//                 text-decoration:none;
//                 border-radius:5px;">
//         Reset Password
//       </a>

//       <p>This link will expire in 10 minutes.</p>
//       <p>If you did not request this, please ignore this email.</p>

//       <p>- Cinemax Team</p>
//     `
//   });

//   console.log("Password reset email sent");
// };

module.exports = { sendReservationEmail, sendPurchaseEmail, sendResetOtpEmail };
