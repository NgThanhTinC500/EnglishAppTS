import * as nodemailer from 'nodemailer';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
    const host = process.env.GMAIL_HOST;
    const port = Number(process.env.GMAIL_PORT);
    const user = process.env.GMAIL_USERNAME;
    const pass = process.env.GMAIL_PASSWORD;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Thanh Tin" <${user}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;
