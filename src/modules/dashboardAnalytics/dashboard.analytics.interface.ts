export interface IDashboardStats {
  total_listings: number;
  listing_value: number;
  listing_views: number;
  total_promoters: number;
  properties_shared_with_me: number;
  commission_pipeline: number;
  top_promoters: ITopPromoter[];
}

export interface ITopPromoter {
  user_id: string;
  fullName: string;
  profileImage?: string;
  city?: string;
  country?: string;
  totalViews: number;
}