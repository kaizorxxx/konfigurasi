import nodemailer from 'nodemailer';

// Konfigurasi Gmail dengan App Password
const mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Pakai SSL
    auth: {
        user: process.env.hyroxyzv@gmail.com, // contoh: yourname@gmail.com
        pass: process.env.fkdthrbunsdrrjii  // App Password 16 digit (tanpa spasi)
    }
});

// Test koneksi
mailer.verify(function (err, success) {
    if (err) {
        console.log('Email setup failed:', err);
    } else {
        console.log('Email ready!');
    }
});

// Fungsi kirim email
async function sendEmail(toEmail, userName, replyText, originalMessage) {
    try {
        const info = await mailer.sendMail({
            from: `"Customer Service" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Terima kasih atas masukan Anda',
            html: `
                <div style="font-family:Arial;max-width:600px;margin:0 auto">
                    <h2>Halo ${userName}!</h2>
                    <p>${replyText}</p>
                    <hr>
                    <p><strong>Masukan Anda:</strong></p>
                    <p style="background:#f5f5f5;padding:15px;border-radius:5px">"${originalMessage}"</p>
                    <p>Salam,<br>Tim Customer Service</p>
                </div>
            `
        });
        
        console.log('Email sent:', info.messageId);
        return true;
    } catch (err) {
        console.log('Email failed:', err.message);
        return false;
    }
}

export { sendEmail };
