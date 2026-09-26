export interface MemeItem {
  id: string;
  title: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  aspectRatio?: number; // width / height (e.g. 0.68 for tall pin, 1.0 for square, 1.3 for wide)
  tags: string[];
  uploaderNickname: string;
  uploaderAvatar?: string;
  rating: number; // 1 to 5
  ratingCount: number;
  description?: string;
}

export interface SearchResultData {
  query: string;
  bestMatch: MemeItem;
  alternatives: MemeItem[];
  noExactMatch?: boolean;
}
