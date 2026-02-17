const transporter = require("../config/email");

const sendBookingEmail = async (userEmail, booking) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Booking Confirmed - Cinemax",

            html: `
            <h2>Booking Confirmed -Cinemax</h2>
            <p> Your seats have been booked successfully.</p>

            <h3>Booking Details:</h3>
            <p><strong>Movie:</strong> ${booking.movie}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
           <p><strong>Time:</strong> ${booking.time}</p>
           <p><strong>Seats:</strong> ${booking.seats}</p>

           <br/>
           <p>Enjoy your movie</p>
           <p> -Cinemax Team </p>
            `,
        });
        console.log("Booking email sent");
    } catch (error){
        console.error("Email error", error);
    }
};

module.exports = sendBookingEmail;