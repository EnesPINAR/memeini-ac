import { MemeItem, SearchResultData } from '../types/meme';

export const MOCK_MEMES: MemeItem[] = [
  {
    id: '1',
    title: 'Gökkuşağı Hamster Ordusu',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=860&auto=format&fit=crop&q=80',
    aspectRatio: 0.7, // Uzun dikey görsel (Tall Portrait)
    tags: ['hamster', 'unicorn', 'gökkuşağı', 'tatlı', 'komik'],
    uploaderNickname: 'hamster_lord',
    rating: 4.8,
    ratingCount: 142,
    description: 'Tek boynuzlu ata binen çılgın hamsterlar!',
  },
  {
    id: '2',
    title: 'Cuma Akşamı Kod Pushlayınca',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=480&auto=format&fit=crop&q=80',
    aspectRatio: 1.25, // Kısa yatay görsel (Compact Landscape)
    tags: ['yazılımcı', 'kod', 'bug', 'developer', 'cuma', 'prod'],
    uploaderNickname: 'enes',
    rating: 4.5,
    ratingCount: 89,
    description: 'Production çöktüğünde geliştiricinin sakin kalmaya çalışması.',
  },
  {
    id: '3',
    title: 'Şaşıran Kedi ve Matematik',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&auto=format&fit=crop&q=80',
    aspectRatio: 1.0, // Kare görsel (Square)
    tags: ['kedi', 'sınav', 'matematik', 'şaşkın', 'üniversite'],
    uploaderNickname: 'pati_sever',
    rating: 4.9,
    ratingCount: 230,
    description: 'Sınav kağıdındaki ilk soruyu görünce gelen aydınlanma.',
  },
  {
    id: '4',
    title: 'Doge: Çok Havlı, Çok Zengin',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=920&auto=format&fit=crop&q=80',
    aspectRatio: 0.65, // Çok uzun dikey görsel (Extra Tall Pin)
    tags: ['doge', 'shiba', 'köpek', 'kripto', 'wow'],
    uploaderNickname: 'shiba_fan',
    rating: 4.3,
    ratingCount: 65,
    description: 'Much wow, very meme!',
  },
  {
    id: '5',
    title: 'Pazartesi Sabahı Alarm Çalınca',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=780&auto=format&fit=crop&q=80',
    aspectRatio: 0.77, // Orta-uzun dikey görsel (Medium Portrait)
    tags: ['pazartesi', 'alarm', 'uyku', 'iş', 'okul', 'sabah'],
    uploaderNickname: 'enes',
    rating: 4.7,
    ratingCount: 312,
    description: 'Yataktan kalkmaya çalışan ben temsili değil birebir.',
  },
  {
    id: '6',
    title: 'Diyetin 1. Günü ve Baklava',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=520&auto=format&fit=crop&q=80',
    aspectRatio: 1.15, // Yatay/karemsi görsel
    tags: ['diyet', 'yemek', 'tatlı', 'baklava', 'spor'],
    uploaderNickname: 'gurme_meme',
    rating: 4.4,
    ratingCount: 178,
    description: 'Pazartesi başlanan diyetin 2. saatinde gelen irade testi.',
  },
  {
    id: '7',
    title: 'Kahve İçmeden Önce / Sonra',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=900&auto=format&fit=crop&q=80',
    aspectRatio: 0.66, // Uzun dikey görsel (Tall Pin)
    tags: ['kahve', 'sabah', 'enerji', 'ofis'],
    uploaderNickname: 'espresso_mert',
    rating: 4.6,
    ratingCount: 94,
    description: 'Tek yudumla hayata dönüş hikayesi.',
  },
  {
    id: '8',
    title: 'Sınava Son Gece Çalışan Öğrenci',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=460&auto=format&fit=crop&q=80',
    aspectRatio: 1.3, // Kısa geniş görsel
    tags: ['sınav', 'öğrenci', 'vize', 'final', 'ders'],
    uploaderNickname: 'vizeler_geldi',
    rating: 4.2,
    ratingCount: 204,
    description: '8 haftalık slaytı 3 saatte bitirebileceğine inanan o masum öğrenci.',
  },
  {
    id: '9',
    title: 'Toplantı E-postayla Bitirilebilirdi Bakışı',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=840&auto=format&fit=crop&q=80',
    aspectRatio: 0.71, // Uzun dikey görsel
    tags: ['ofis', 'yazılımcı', 'köpek', 'komik', 'iş'],
    uploaderNickname: 'kurumsal_mizah',
    rating: 4.9,
    ratingCount: 156,
    description: '2 saatlik toplantının sonunda tek cümlelik karar çıkınca.',
  },
  {
    id: '10',
    title: 'Gece 3’te Buzdolabıyla Göz Göze Gelince',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=620&auto=format&fit=crop&q=80',
    aspectRatio: 0.96, // Kareye yakın görsel
    tags: ['kedi', 'yemek', 'diyet', 'gece', 'şaşkın'],
    uploaderNickname: 'gece_atistirmasi',
    rating: 4.5,
    ratingCount: 189,
    description: 'Diyetin sadece gündüz saatlerinde geçerli olduğunu savunan kedi.',
  },
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

  // Fallback if no exact match: mark noExactMatch true and provide alternatives
  return {
    query,
    noExactMatch: true,
    bestMatch: {
      ...MOCK_MEMES[0],
      title: `"${query}" ile Eşleşen Meme`,
    },
    alternatives: MOCK_MEMES.slice(1, 5),
  };
}
