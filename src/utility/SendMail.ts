import nodemailer  from "nodemailer";
import config from "../config";


const sendMail = async(to:string,html:string) =>{

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false ,   //config.NODE_ENV == 'production'
  auth: {
    user: config.SMTP_AUTH_USER,
    pass: config.SMTP_AUTH_PASS,
  },
});

   await transporter.sendMail({
    from:  config.SMTP_AUTH_USER,
    to,
    subject: "Change Password",
    text:"Reset your Password within 10 minutes",
    html
  });

}

export default sendMail