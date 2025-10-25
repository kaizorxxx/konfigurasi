import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.hyroxyzv@gmail.com,
        pass: process.env.cX1b3irLb$9!6na
    }
});

export async function sendEmail(to, name, reply, original) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Terima kasih',
        html: `<p>Halo ${name},</p><p>${reply}</p>`
    });
