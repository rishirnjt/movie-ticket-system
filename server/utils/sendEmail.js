const transporter = require("../config/email");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

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
  doc.fontSize(22).text("🎟️ Cinemax E-Ticket", { align: "center" });
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

  // ===== QR CODE =====
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

module.exports = { sendPurchaseEmail };
