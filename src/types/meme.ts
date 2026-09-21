export interface MemeItem {
  id: string;
  title: string;
  imageUrl: string;
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
}
