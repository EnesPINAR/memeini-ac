import { PrismaClient, Role, MediaType, MemeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_MEMES = [
  {
    title: 'Gökkuşağı Hamster Ordusu',
    mediaUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=860&auto=format&fit=crop&q=80',
    aspectRatio: 0.7,
    tags: ['hamster', 'unicorn', 'gökkuşağı', 'tatlı', 'komik'],
    rating: 4.8,
    ratingCount: 142,
    uploaderUsername: 'hamster_lord',
  },
  {
    title: 'Cuma Akşamı Kod Pushlayınca',
    mediaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=480&auto=format&fit=crop&q=80',
    aspectRatio: 1.25,
    tags: ['yazılımcı', 'kod', 'bug', 'developer', 'cuma', 'prod'],
    rating: 4.5,
    ratingCount: 89,
    uploaderUsername: 'enes',
  },
  {
    title: 'Şaşıran Kedi ve Matematik',
    mediaUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&auto=format&fit=crop&q=80',
    aspectRatio: 1.0,
    tags: ['kedi', 'sınav', 'matematik', 'şaşkın', 'üniversite'],
    rating: 4.9,
    ratingCount: 230,
    uploaderUsername: 'enes',
  },
  {
    title: 'Doge: Çok Havlı, Çok Zengin',
    mediaUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=920&auto=format&fit=crop&q=80',
    aspectRatio: 0.65,
    tags: ['doge', 'shiba', 'köpek', 'kripto', 'wow'],
    rating: 4.3,
    ratingCount: 65,
    uploaderUsername: 'hamster_lord',
  },
  {
    title: 'Pazartesi Sabahı Alarm Çalınca',
    mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=780&auto=format&fit=crop&q=80',
    aspectRatio: 0.77,
    tags: ['pazartesi', 'alarm', 'uyku', 'iş', 'okul', 'sabah'],
    rating: 4.7,
    ratingCount: 312,
    uploaderUsername: 'enes',
  },
  {
    title: 'Diyetin 1. Günü ve Baklava',
    mediaUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=520&auto=format&fit=crop&q=80',
    aspectRatio: 1.15,
    tags: ['diyet', 'yemek', 'tatlı', 'baklava', 'spor'],
    rating: 4.4,
    ratingCount: 178,
    uploaderUsername: 'enes',
  },
  {
    title: 'Kahve İçmeden Önce / Sonra',
    mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=900&auto=format&fit=crop&q=80',
    aspectRatio: 0.66,
    tags: ['kahve', 'sabah', 'enerji', 'ofis'],
    rating: 4.6,
    ratingCount: 94,
    uploaderUsername: 'hamster_lord',
  },
  {
    title: 'Sınava Son Gece Çalışan Öğrenci',
    mediaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=460&auto=format&fit=crop&q=80',
    aspectRatio: 1.3,
    tags: ['sınav', 'öğrenci', 'vize', 'final', 'ders'],
    rating: 4.2,
    ratingCount: 204,
    uploaderUsername: 'enes',
  },
  {
    title: 'Toplantı E-postayla Bitirilebilirdi Bakışı',
    mediaUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=840&auto=format&fit=crop&q=80',
    aspectRatio: 0.71,
    tags: ['ofis', 'yazılımcı', 'köpek', 'komik', 'iş'],
    rating: 4.9,
    ratingCount: 156,
    uploaderUsername: 'hamster_lord',
  },
  {
    title: 'Gece 3’te Buzdolabıyla Göz Göze Gelince',
    mediaUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=620&auto=format&fit=crop&q=80',
    aspectRatio: 0.96,
    tags: ['kedi', 'yemek', 'diyet', 'gece', 'şaşkın'],
    rating: 4.5,
    ratingCount: 189,
    uploaderUsername: 'enes',
  },
];

async function main() {
  console.log('🌱 Veritabanı tohumlama (seed) başlatılıyor...');

  const passwordHash = await bcrypt.hash('User123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // 1. Create or update Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@memeinibul.com' },
    update: {},
    create: {
      email: 'admin@memeinibul.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      displayName: "Meme'ini Bul Moderatör",
      bio: 'Sistem yöneticisi ve moderasyon sorumlusu 🛡️',
      avatarEmoji: '🤖',
      avatarBg: '#EC4899',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin oluşturuldu: ${admin.email}`);

  // 2. Create demo user 'enes'
  const userEnes = await prisma.user.upsert({
    where: { email: 'enes@memeinibul.com' },
    update: {},
    create: {
      email: 'enes@memeinibul.com',
      username: 'enes',
      passwordHash,
      displayName: 'Enes Pınar',
      bio: 'Her duruma uygun bir meme mutlaka vardır 🎯',
      avatarEmoji: '🐹',
      avatarBg: '#FFE600',
      role: Role.USER,
    },
  });
  console.log(`✅ Kullanıcı oluşturuldu: ${userEnes.username}`);

  // 3. Create demo user 'hamster_lord'
  const userHamster = await prisma.user.upsert({
    where: { email: 'hamster_lord@memeinibul.com' },
    update: {},
    create: {
      email: 'hamster_lord@memeinibul.com',
      username: 'hamster_lord',
      passwordHash,
      displayName: 'Hamster Lord',
      bio: 'Gökkuşakları ve fıstıklar 🌈🥜',
      avatarEmoji: '🐹',
      avatarBg: '#10B981',
      role: Role.USER,
    },
  });
  console.log(`✅ Kullanıcı oluşturuldu: ${userHamster.username}`);

  // 4. Create Memes and Tags
  const createdMemes = [];
  for (const item of SEED_MEMES) {
    const uploader = item.uploaderUsername === 'enes' ? userEnes : userHamster;

    // Create or find tags
    const tagIds = [];
    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      tagIds.push(tag.id);
    }

    // Check if meme already exists
    let meme = await prisma.meme.findFirst({
      where: { title: item.title },
    });

    if (!meme) {
      meme = await prisma.meme.create({
        data: {
          title: item.title,
          mediaUrl: item.mediaUrl,
          mediaType: MediaType.IMAGE,
          aspectRatio: item.aspectRatio,
          uploaderId: uploader.id,
          rating: item.rating,
          ratingCount: item.ratingCount,
          status: MemeStatus.ACTIVE,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
      });
      console.log(`  ➕ Meme eklendi: "${meme.title}"`);
    }
    createdMemes.push(meme);
  }

  // 5. Seed some initial saved memes & ratings for 'enes'
  if (createdMemes.length >= 4) {
    // Save memes 1 and 3
    await prisma.savedMeme.upsert({
      where: {
        userId_memeId: {
          userId: userEnes.id,
          memeId: createdMemes[0].id,
        },
      },
      update: {},
      create: {
        userId: userEnes.id,
        memeId: createdMemes[0].id,
      },
    });

    await prisma.savedMeme.upsert({
      where: {
        userId_memeId: {
          userId: userEnes.id,
          memeId: createdMemes[3].id,
        },
      },
      update: {},
      create: {
        userId: userEnes.id,
        memeId: createdMemes[3].id,
      },
    });

    // Rate memes
    await prisma.rating.upsert({
      where: {
        userId_memeId: {
          userId: userEnes.id,
          memeId: createdMemes[0].id,
        },
      },
      update: {},
      create: {
        userId: userEnes.id,
        memeId: createdMemes[0].id,
        score: 5,
      },
    });

    await prisma.rating.upsert({
      where: {
        userId_memeId: {
          userId: userEnes.id,
          memeId: createdMemes[3].id,
        },
      },
      update: {},
      create: {
        userId: userEnes.id,
        memeId: createdMemes[3].id,
        score: 4,
      },
    });

    console.log('✅ Örnek kaydedilenler ve yıldızlamalar eklendi');
  }

  console.log('\n🎉 Veritabanı başarıyla tohumlandı!');
  console.log('--------------------------------------------------');
  console.log('Giriş Bilgileri:');
  console.log('👤 Demo Kullanıcı: enes / User123!');
  console.log('🛡️ Yönetici: admin / Admin123!');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
