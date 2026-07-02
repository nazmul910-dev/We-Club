import sendCustomMail from './sendCustomMail';

type SendDiscountCodeMailPayload = {
  email: string;
  code: string;
  discountPercent: number;
  expiresAt?: Date | undefined;
};

export const sendDiscountCodeMail = async ({
  email,
  code,
  discountPercent,
  expiresAt,
}: SendDiscountCodeMailPayload) => {
  const expiryText = expiresAt
    ? `This code will expire on ${expiresAt.toDateString()}.`
    : 'This code is valid while the offer is active.';

  await sendCustomMail({
    to: email,
    subject: 'Your World Elite Discount Code',
    text: `Your World Elite discount code is ${code}. Discount: ${discountPercent}%. ${expiryText}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:12px;">
          <h2 style="margin:0 0 15px; color:#111827;">Your World Elite Discount Code</h2>

          <p style="font-size:15px; color:#374151;">
            Use this discount code during registration or subscription upgrade.
          </p>

          <div style="margin:25px 0; padding:18px; background:#111827; color:#ffffff; text-align:center; border-radius:10px;">
            <p style="margin:0 0 8px; font-size:13px;">Discount Code</p>
            <h1 style="margin:0; letter-spacing:2px;">${code}</h1>
          </div>

          <p style="font-size:16px; color:#111827;">
            Discount: <strong>${discountPercent}%</strong>
          </p>

          <p style="font-size:14px; color:#6b7280;">
            ${expiryText}
          </p>

          <p style="font-size:14px; color:#6b7280; margin-top:25px;">
            Thank you,<br />
            World Elite Team
          </p>
        </div>
      </div>
    `,
  });
};