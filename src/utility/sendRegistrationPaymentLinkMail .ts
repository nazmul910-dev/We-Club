import sendCustomMail from './sendCustomMail';
import { UserRole } from '../modules/users/user.interface';

type SendRegistrationPaymentLinkMailPayload = {
  fullName: string;
  email: string;
  role: UserRole;
  paymentLink: string;
};

export const sendRegistrationPaymentLinkMail = async ({
  fullName,
  email,
  role,
  paymentLink,
}: SendRegistrationPaymentLinkMailPayload) => {
  await sendCustomMail({
    to: email,
    subject: 'Complete Your World Elite Membership Payment',

    text: `Hello ${fullName},

Your World Elite registration has been reviewed.

Please complete your membership payment using the following link to activate your account:

${paymentLink}

Role: ${role}

Thank you,
World Elite Team`,

    html: `
      <div
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px 24px;
          "
        >
          <div
            style="
              background-color: #ffffff;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            "
          >
            <h2
              style="
                margin: 0 0 24px;
                font-size: 24px;
                line-height: 1.3;
                color: #111827;
                text-align: center;
              "
            >
              Complete Your Membership Payment
            </h2>

            <p
              style="
                margin: 0 0 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Hello ${fullName},
            </p>

            <p
              style="
                margin: 0 0 16px;
                font-size: 15px;
                line-height: 1.6;
                color: #374151;
              "
            >
              Your World Elite registration has been reviewed. Please complete
              your membership payment using the button below to activate your
              account.
            </p>

            <div
              style="
                margin: 22px 0;
                padding: 18px;
                background-color: #f3f4f6;
                border-radius: 10px;
              "
            >
              <p
                style="
                  margin: 0;
                  font-size: 15px;
                  color: #111827;
                "
              >
                <strong>Role:</strong> ${role}
              </p>
            </div>

            <div
              style="
                text-align: center;
                margin: 28px 0;
              "
            >
              <a
                href="${paymentLink}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  background-color: #111827;
                  color: #ffffff;
                  padding: 12px 28px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 15px;
                  font-weight: 600;
                  display: inline-block;
                "
              >
                Complete Payment
              </a>
            </div>

            <p
              style="
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: #6b7280;
                word-break: break-all;
              "
            >
              Or copy and paste this link into your browser:
              <br />
              <a
                href="${paymentLink}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  color: #2563eb;
                  text-decoration: underline;
                "
              >
                ${paymentLink}
              </a>
            </p>

            <p
              style="
                margin: 25px 0 0;
                font-size: 14px;
                line-height: 1.6;
                color: #6b7280;
              "
            >
              Thank you,
              <br />
              World Elite Team
            </p>
          </div>
        </div>
      </div>
    `,
  });
};