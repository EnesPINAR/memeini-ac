const { PrismaClient, RequestStatus, ReportStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enes = await prisma.user.findUnique({ where: { username: 'enes' } });
  const memes = await prisma.meme.findMany({ take: 6 });

  if (!enes || memes.length === 0) {
    console.log('User or memes missing');
    return;
  }

  // Clear existing requests/reports
  await prisma.memeDeleteRequest.deleteMany({});
  await prisma.suggestedTag.deleteMany({});
  await prisma.report.deleteMany({});

  // 1. Meme Delete Request (Pending)
  await prisma.memeDeleteRequest.create({
    data: {
      memeId: memes[1].id,
      userId: enes.id,
      reason: 'Yanlış görsel veya hatalı etiket yükledim',
      note: 'Daha yüksek çözünürlüklü halini hazırladım, eskisinin silinmesini rica ediyorum.',
      status: RequestStatus.PENDING,
    },
  });

  // 2. Meme Delete Request (Approved - History)
  await prisma.memeDeleteRequest.create({
    data: {
      memeId: memes[2].id,
      userId: enes.id,
      reason: 'Tekrarlanan (kopya) yükleme yaptım',
      note: 'Aynı görselden iki defa yüklemiştim.',
      status: RequestStatus.APPROVED,
    },
  });

  // 3. Suggested Tags (Pending)
  await prisma.suggestedTag.create({
    data: {
      memeId: memes[0].id,
      userId: enes.id,
      tagName: 'sevimli-kemirgenler',
      status: RequestStatus.PENDING,
    },
  });
  await prisma.suggestedTag.create({
    data: {
      memeId: memes[1].id,
      userId: enes.id,
      tagName: 'senior-developer',
      status: RequestStatus.PENDING,
    },
  });

  // 4. Suggested Tag (Approved - History)
  await prisma.suggestedTag.create({
    data: {
      memeId: memes[3].id,
      userId: enes.id,
      tagName: 'kripto-mizah',
      status: RequestStatus.APPROVED,
    },
  });

  // 5. Reports (Pending)
  await prisma.report.create({
    data: {
      memeId: memes[4].id,
      reporterId: enes.id,
      reason: 'Yanlış / Alakasız Etiketler',
      description: 'Etiketlerde alakasız kelimeler var, aramalarda yanlış çıkıyor.',
      status: ReportStatus.PENDING,
    },
  });

  // 6. Reports (Resolved - History)
  await prisma.report.create({
    data: {
      memeId: memes[0].id,
      reporterId: enes.id,
      reason: 'Telif Hakkı / Çalıntı İçerik',
      description: 'Kaynak belirtilmemişti, incelendi ve çözüldü.',
      status: ReportStatus.RESOLVED,
    },
  });

  console.log('✅ Admin test verileri başarıyla oluşturuldu!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
