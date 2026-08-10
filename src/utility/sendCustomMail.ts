import nodemailer from 'nodemailer';
import config from '../config';

type SendCustomMailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string | undefined;
};

const sendCustomMail = async ({
  to,
  subject,
  html,
  text,
}: SendCustomMailPayload) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4, 
    auth: {
      user: config.SMTP_AUTH_USER,
      pass: config.SMTP_AUTH_PASS,
    },
  } as any);

  await transporter.sendMail({
    from: `${config.MAIL_FROM_NAME} <${config.SMTP_AUTH_USER}>`,
    to,
    subject,
    text: text || '',
    html,
  });
};

export default sendCustomMail;