import nodemailer  from "nodemailer";
import config from "../config";
import { Resend } from "resend";


const resend = new Resend(config.RESEND_API_KEY);

// const sendMail = async(to:string,html:string) =>{

//   const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false ,   //config.NODE_ENV == 'production'
//   auth: {
//     user: config.SMTP_AUTH_USER,
//     pass: config.SMTP_AUTH_PASS,
//   },
// });

//    await transporter.sendMail({
//     from:  config.SMTP_AUTH_USER,
//     to,
//     subject: "Change Password",
//     text:"Reset your Password within 10 minutes",
//     html
//   });

// }

// export default sendMail

const sendMail = async (to: string, html: string) => {
  const fromEmail = config.MAIL_FROM_NAME
    ? `${config.MAIL_FROM_NAME} <onboarding@resend.dev>`
    : "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Change Password",
    text: "Reset your Password within 10 minutes",
    html,
  });

  if (error) {
    console.error("Resend email send failed:", error);
    throw new Error(error.message || "Failed to send email");
  }
};

export default sendMail;