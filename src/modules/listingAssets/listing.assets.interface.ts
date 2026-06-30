import { Types } from 'mongoose';
import { UserRole } from '../users/user.interface';

export interface IListingAssetSnapshot {
  package_type: 'zip';
  image_count: number;
  file_names: string[];
  captions: string[];
  one_pager_file_name: string;
}

export interface IListingAssetDownload {
  listing_id: Types.ObjectId;
  downloaded_by: Types.ObjectId;
  promotion_request_id?: Types.ObjectId;

  user_role: UserRole;

  assets_snapshot: IListingAssetSnapshot;

  ip_address?: string;
  user_agent?: string;

  downloaded_at: Date;
}