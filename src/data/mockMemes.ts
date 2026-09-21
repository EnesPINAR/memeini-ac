import { MemeItem, SearchResultData } from '../types/meme';

export const MOCK_MEMES: MemeItem[] = [
  {
    id: '1',
    title: 'Gökkuşağı Hamster Ordusu',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
    tags: ['hamster', 'unicorn', 'gökkuşağı', 'tatlı', 'komik'],
    uploaderNickname: 'hamster_lord',
    rating: 5,
    ratingCount: 142,
    description: 'Tek boynuzlu ata binen çılgın hamsterlar!',
  },
  {
    id: '2',
    title: 'Cuma Akşamı Kod Pushlayınca',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    tags: ['yazılımcı', 'kod', 'bug', 'developer', 'cuma', 'prod'],
    uploaderNickname: 'coder_batu',
    rating: 4,
    ratingCount: 89,
    description: 'Production çöktüğünde geliştiricinin sakin kalmaya çalışması.',
  },
  {
    id: '3',
    title: 'Şaşıran Kedi ve Matematik',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    tags: ['kedi', 'sınav', 'matematik', 'şaşkın', 'üniversite'],
    uploaderNickname: 'pati_sever',
    rating: 5,
    ratingCount: 230,
    description: 'Sınav kağıdındaki ilk soruyu görünce gelen aydınlanma.',
  },
  {
    id: '4',
    title: 'Doge: Çok Havlı, Çok Zengin',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    tags: ['doge', 'shiba', 'köpek', 'kripto', 'wow'],
    uploaderNickname: 'shiba_fan',
    rating: 4,
    ratingCount: 65,
    description: 'Much wow, very meme!',
  },
  {
    id: '5',
    title: 'Pazartesi Sabahı Alarm Çalınca',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    tags: ['pazartesi', 'alarm', 'uyku', 'iş', 'okul', 'sabah'],
    uploaderNickname: 'kahvesiz_asla',
    rating: 5,
    ratingCount: 312,
    description: 'Yataktan kalkmaya çalışan ben temsili değil birebir.',
  },
  {
    id: '6',
    title: 'Diyetin 1. Günü ve Baklava',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    tags: ['diyet', 'yemek', 'tatlı', 'baklava', 'spor'],
    uploaderNickname: 'gurme_meme',
    rating: 4,
    ratingCount: 178,
    description: 'Pazartesi başlanan diyetin 2. saatinde gelen irade testi.',
  },
  {
    id: '7',
    title: 'Kahve İçmeden Önce / Sonra',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    tags: ['kahve', 'sabah', 'enerji', 'ofis'],
    uploaderNickname: 'espresso_mert',
    rating: 5,
    ratingCount: 94,
    description: 'Tek yudumla hayata dönüş hikayesi.',
  },
  {
    id: '8',
    title: 'Sınava Son Gece Çalışan Öğrenci',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    tags: ['sınav', 'öğrenci', 'vize', 'final', 'ders'],
    uploaderNickname: 'vizeler_geldi',
    rating: 4,
    ratingCount: 204,
    description: '8 haftalık slaytı 3 saatte bitirebileceğine inanan o masum öğrenci.',
  }
];

export function searchMemes(query: string): SearchResultData {
  const cleanQuery = (query || '').trim().toLowerCase();

  if (!cleanQuery) {
    return {
      query: 'Trend Memeler',
      bestMatch: MOCK_MEMES[0],
      alternatives: MOCK_MEMES.slice(1, 5),
    };
  }

  // Filter matching memes by title or tags
  const matched = MOCK_MEMES.filter((m) =>
    m.title.toLowerCase().includes(cleanQuery) ||
    m.tags.some((t) => t.toLowerCase().includes(cleanQuery)) ||
    m.uploaderNickname.toLowerCase().includes(cleanQuery)
  );

  if (matched.length > 0) {
    const bestMatch = matched[0];
    // Remaining alternatives or fill from rest of the mock list
    const otherMatches = matched.slice(1);
    const fillers = MOCK_MEMES.filter((m) => m.id !== bestMatch.id && !otherMatches.some(om => om.id === m.id));
    const alternatives = [...otherMatches, ...fillers].slice(0, 4);

    return {
      query,
      bestMatch,
      alternatives,
    };
  }

  // Fallback if no exact match: use first as best match, next 4 as alternatives
  return {
    query,
    bestMatch: {
      ...MOCK_MEMES[0],
      title: `"${query}" ile Eşleşen Meme`,
    },
    alternatives: MOCK_MEMES.slice(1, 5),
  };
}
