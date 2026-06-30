import { Schema, model } from 'mongoose';
import { USER_ROLES } from '../users/user.interface';
import { IListingAssetDownload } from './listing.assets.interface';

const ListingAssetDownloadSchema = new Schema<IListingAssetDownload>(
  {
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },

    downloaded_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    promotion_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'PromoteRequest',
    },

    user_role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },

    assets_snapshot: {
      package_type: {
        type: String,
        enum: ['zip'],
        default: 'zip',
      },

      image_count: {
        type: Number,
        default: 0,
        min: 0,
      },

      file_names: {
        type: [String],
        default: [],
      },

      captions: {
        type: [String],
        default: [],
      },

      one_pager_file_name: {
        type: String,
        default: 'one-pager.pdf',
      },
    },

    ip_address: {
      type: String,
      trim: true,
    },

    user_agent: {
      type: String,
      trim: true,
    },

    downloaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

ListingAssetDownloadSchema.index({
  listing_id: 1,
  downloaded_by: 1,
  downloaded_at: -1,
});

export const ListingAssetDownload = model<IListingAssetDownload>(
  'ListingAssetDownload',
  ListingAssetDownloadSchema
);