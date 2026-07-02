import nodemailer from "nodemailer";
import config from "../../config";

const TIER_DETAILS: Record<
  "tier_1" | "tier_2" | "tier_3",
  { label: string; description: string; features: string[] }
> = {
  tier_1: {
    label: "Tier 1: Full Marketing + Website",
    description: "Maximum reach. Full address and visuals exposed.",
    features: [
      "Full address & geolocation revealed",
      "All photography (interior + exterior)",
      "Promoter may publish to their own website",
      "Listing appears in network newsletter",
    ],
  },
  tier_2: {
    label: "Tier 2: Full Marketing",
    description: "Distribution to qualified buyers only — no public listing.",
    features: [
      "Full address shared with vetted prospects",
      "All photography (interior + exterior)",
      "No public web publication permitted",
      "Print collateral & private decks allowed",
    ],
  },
  tier_3: {
    label: "Tier 3: Discreet Marketing",
    description: "Off-market. Whispered, never broadcast.",
    features: [
      "Address withheld until NDA signed",
      "Exterior photography only",
      "1:1 introductions only — no decks",
      "All inquiries routed through Associate",
    ],
  },
};

const TIER_COLORS: Record<"tier_1" | "tier_2" | "tier_3", string> = {
  tier_1: "#16a34a",
  tier_2: "#2563eb",
  tier_3: "#7c3aed",
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const getPromotionApprovalEmailHtml = (
  promoterName: string,
  listingTitle: string,
  listingId: string,
  tier: "tier_1" | "tier_2" | "tier_3",
  confirmedCommissionPct: number
): string => {
  const tierInfo = TIER_DETAILS[tier];
  const tierColor = TIER_COLORS[tier];

  const featureRows = tierInfo.features
    .map(
      (f) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#374151;">
          <span style="color:${tierColor};font-weight:bold;margin-right:8px;">✓</span>
          ${escapeHtml(f)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;">
      <div style="max-width:620px;margin:auto;background:#fff;padding:28px;border-radius:12px;">

        <h2 style="margin:0 0 16px;color:#111827;">
          Your Promotion Request Has Been Approved
        </h2>

        <p>Hello ${escapeHtml(promoterName)},</p>

        <p>
          Congratulations! Your request to promote
          <strong>${escapeHtml(listingTitle)}</strong> has been approved.
        </p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
          <strong>Listing:</strong> ${escapeHtml(listingTitle)}<br>
          <strong>ID:</strong> ${escapeHtml(listingId)}
        </div>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
          <strong>Confirmed Commission:</strong>
          <span style="font-size:22px;font-weight:bold;">
            ${confirmedCommissionPct}%
          </span>
        </div>

        <div style="border-left:4px solid ${tierColor};background:#f9fafb;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0;color:${tierColor};">
            ${escapeHtml(tierInfo.label)}
          </h3>

          <p>${escapeHtml(tierInfo.description)}</p>

          <table style="width:100%;border-collapse:collapse;">
            ${featureRows}
          </table>
        </div>

        <p style="margin-top:20px;">
          Please ensure all promotion activities remain within the permissions
          granted by your tier.
        </p>

        <p>
          Regards,<br>
          <strong>NEWAZA Team</strong>
        </p>

      </div>
    </div>
  `;
};

export const sendPromotionApprovalEmail = async ({
  toEmail,
  promoterName,
  listingTitle,
  listingId,
  tier,
  confirmedCommissionPct,
}: {
  toEmail: string;
  promoterName: string;
  listingTitle: string;
  listingId: string;
  tier: "tier_1" | "tier_2" | "tier_3";
  confirmedCommissionPct: number;
}): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.SMTP_AUTH_USER,
      pass: config.SMTP_AUTH_PASS,
    },
  });

  await transporter.sendMail({
    from: config.SMTP_AUTH_USER,
    to: toEmail,
    subject: `You've been approved to promote: ${listingTitle}`,
    text: `Hello ${promoterName}, your request to promote "${listingTitle}" has been approved under ${tier.replace(
      "_",
      " "
    ).toUpperCase()} with a confirmed commission of ${confirmedCommissionPct}%.`,
    html: getPromotionApprovalEmailHtml(
      promoterName,
      listingTitle,
      listingId,
      tier,
      confirmedCommissionPct
    ),
  });
};