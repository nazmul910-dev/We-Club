import { Buffer } from 'node:buffer';
import axios from 'axios';
import PDFDocument from 'pdfkit';

type ListingForAssetPdf = {
  title: string;
  ref_code: string;
  location: {
    city: string;
    region: string;
    country: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  bedrooms: number;
  bathrooms: number;
  area_sqm: {
    value: number;
    unit:string
  };
  referral_commission: {
    offered_amount: number;
    confirmed_amount?: number | undefined;
  };
};

export type DownloadedImageFile = {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
};

export const sanitizeFileName = (value: string): string => {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return sanitized || 'listing-assets';
};

const isHttpUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const getImageExtension = (mimeType: string, fallbackUrl: string): string => {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes('jpeg') || normalizedMimeType.includes('jpg')) {
    return 'jpg';
  }

  if (normalizedMimeType.includes('png')) {
    return 'png';
  }

  if (normalizedMimeType.includes('webp')) {
    return 'webp';
  }

  try {
    const pathname = new URL(fallbackUrl).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();

    if (extension && ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
  } catch {
    return 'jpg';
  }

  return 'jpg';
};

export const downloadImageFromUrl = async (
  imageUrl: string,
  fileNamePrefix: string
): Promise<DownloadedImageFile | null> => {
  if (!imageUrl || !isHttpUrl(imageUrl)) {
    return null;
  }

  try {
    const response = await axios.get<ArrayBuffer>(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 20 * 1024 * 1024,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();

    if (!contentType.startsWith('image/')) {
      return null;
    }

    const extension = getImageExtension(contentType, imageUrl);

    return {
      fileName: `${fileNamePrefix}.${extension}`,
      buffer: Buffer.from(response.data),
      mimeType: contentType,
    };
  } catch {
    return null;
  }
};

export const generateListingCaptions = (
  listing: ListingForAssetPdf
): string[] => {
  const locationText = `${listing.location.city}, ${listing.location.region}, ${listing.location.country}`;

  return [
    `${listing.title} is now available in ${locationText}. Reference: ${listing.ref_code}.`,
    `Explore this World Elite property opportunity in ${locationText}.`,
    `For private details about ${listing.title}, please contact the listing representative. Reference: ${listing.ref_code}.`,
  ];
};

export const generateCaptionsTextFile = (captions: string[]): string => {
  return captions
    .map((caption, index) => `${index + 1}. ${caption}`)
    .join('\n\n');
};

const formatPrice = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

const canEmbedInPdf = (image: DownloadedImageFile): boolean => {
  return (
    image.mimeType.includes('jpeg') ||
    image.mimeType.includes('jpg') ||
    image.mimeType.includes('png')
  );
};

export const generateListingOnePagerPdf = async (
  listing: ListingForAssetPdf,
  images: DownloadedImageFile[],
  captions: string[]
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);

    doc
      .fontSize(22)
      .fillColor('#111111')
      .text('WORLD ELITE', {
        align: 'center',
      });

    doc.moveDown(0.4);

    doc
      .fontSize(16)
      .fillColor('#333333')
      .text('Property One-Pager', {
        align: 'center',
      });

    doc.moveDown(1);

    const coverImage = images.find(canEmbedInPdf);

    if (coverImage) {
      try {
        doc.image(coverImage.buffer, {
          fit: [500, 260],
          align: 'center',
        });

        doc.moveDown(1);
      } catch {
        doc
          .fontSize(10)
          .fillColor('#555555')
          .text('Cover image could not be embedded in the PDF.');

        doc.moveDown(1);
      }
    }

    doc
      .fontSize(18)
      .fillColor('#111111')
      .text(listing.title);

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor('#222222')
      .text(`Reference Code: ${listing.ref_code}`)
      .text(
        `Location: ${listing.location.city}, ${listing.location.region}, ${listing.location.country}`
      )
      .text(`Price: ${formatPrice(listing.price.amount, listing.price.currency)}`)
      .text(`Bedrooms: ${listing.bedrooms}`)
      .text(`Bathrooms: ${listing.bathrooms}`)
      .text(`Area: ${listing.area_sqm.value} - ${listing.area_sqm.unit}`)
      .text(`Referral Commission Offered: ${listing.referral_commission.offered_amount}%`);

    doc.moveDown(1);

    doc
      .fontSize(14)
      .fillColor('#111111')
      .text('Suggested Captions');

    doc.moveDown(0.5);

    captions.forEach((caption, index) => {
      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`${index + 1}. ${caption}`);

      doc.moveDown(0.4);
    });

    doc.moveDown(1);

    doc
      .fontSize(9)
      .fillColor('#555555')
      .text(
        'This asset package is provided for approved World Elite listing promotion use only.',
        {
          align: 'center',
        }
      );

    doc.end();
  });
};