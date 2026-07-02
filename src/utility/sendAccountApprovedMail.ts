import sendCustomMail from './sendCustomMail';
import { AccessTo, UserRole } from '../modules/users/user.interface';

type SendAccountApprovedMailPayload = {
  fullName: string;
  email: string;
  role: UserRole;
  accessTo?: AccessTo | undefined;
};

const getAccessLabel = (accessTo?: AccessTo): string => {
  if (accessTo === 'we_command_center') {
    return 'WÉ Command Center';
  }

  if (accessTo === 'invictus') {
    return 'INVICTUS Academy';
  }

  if (accessTo === 'both') {
    return 'WÉ Command Center + INVICTUS Academy';
  }

  return 'your approved dashboard';
};

export const sendAccountApprovedMail = async ({
  fullName,
  email,
  role,
  accessTo,
}: SendAccountApprovedMailPayload) => {
  const accessLabel = getAccessLabel(accessTo);

  await sendCustomMail({
    to: email,
    subject: 'Your World Elite Account Has Been Approved',
    text: `Hello ${fullName}, your World Elite account has been approved. You can now log in and access ${accessLabel}.`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:12px;">
          <h2 style="margin:0 0 15px; color:#111827;">
            Your Account Has Been Approved
          </h2>

          <p style="font-size:15px; color:#374151;">
            Hello ${fullName},
          </p>

          <p style="font-size:15px; color:#374151;">
            Your World Elite account has been approved successfully.
          </p>

          <div style="margin:22px 0; padding:18px; background:#f3f4f6; border-radius:10px;">
            <p style="margin:0 0 8px; color:#111827;">
              <strong>Role:</strong> ${role}
            </p>
            <p style="margin:0; color:#111827;">
              <strong>Access:</strong> ${accessLabel}
            </p>
          </div>

          <p style="font-size:15px; color:#374151;">
            You can now log in to your account and access your approved dashboard.
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