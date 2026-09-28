import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
  Share,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import {
  Search,
  X,
  Share2,
  Maximize2,
  Flag,
  Check,
  Plus,
  Info,
  Shuffle,
  MoreHorizontal,
  Star,
  Bookmark,
} from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { StarRating } from '../components/StarRating';
import {
  CartoonCard,
  CartoonButton,
  CartoonSearchInput,
  CartoonBadge,
  CartoonCornerGloss,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { MemeItem } from '../types/meme';
import { MOCK_MEMES } from '../data/mockMemes';

interface ExploreScreenProps {
  onBackToHome: () => void;
  onSearchTagOrQuery: (query: string) => void;
  onOpenAddMeme: (tag?: string) => void;
  onTabPress: (tab: TabType) => void;
  savedMemeIds?: string[];
  onToggleSaveMeme?: (memeId: string) => void;
  isAdmin?: boolean;
}

interface SituationCategory {
  id: string;
  label: string;
  color: string;
  keywords: string[];
}

const SITUATION_CATEGORIES: SituationCategory[] = [
  {
    id: 'all',
    label: 'Tümü',
    color: CARTOON_COLORS.yellow,
    keywords: [],
  },
  {
    id: 'reaction',
    label: 'Anlık Tepki',
    color: CARTOON_COLORS.pastelPink,
    keywords: ['şaşkın', 'komik', 'wow', 'unicorn', 'tatlı'],
  },
  {
    id: 'dev_office',
    label: 'Yazılımcı & Ofis',
    color: CARTOON_COLORS.pastelBlue,
    keywords: ['yazılımcı', 'kod', 'bug', 'developer', 'cuma', 'prod', 'ofis', 'kahve', 'iş'],
  },
  {
    id: 'student',
    label: 'Sınav & Okul',
    color: CARTOON_COLORS.pastelPurple,
    keywords: ['sınav', 'matematik', 'üniversite', 'öğrenci', 'vize', 'final', 'ders', 'okul'],
  },
  {
    id: 'animals',
    label: 'Hayvanlar',
    color: CARTOON_COLORS.pastelGreen,
    keywords: ['hamster', 'kedi', 'doge', 'shiba', 'köpek'],
  },
  {
    id: 'daily',
    label: 'Pazartesi & Diyet',
    color: CARTOON_COLORS.pastelYellow,
    keywords: ['pazartesi', 'alarm', 'uyku', 'sabah', 'diyet', 'yemek', 'baklava', 'kahve', 'enerji', 'gece'],
  },
];

// Fallback deterministic varied ratios if an item has no aspectRatio yet
const FALLBACK_RATIOS = [0.68, 1.22, 0.95, 0.64, 0.78, 1.15, 0.66, 1.28];

const REPORT_REASONS = [
  'Uygunsuz / Müstehcen İçerik',
  'Spam veya Alakasız Meme',
  'Nefret Söylemi / Hakaret',
  'Telif Hakkı / Çalıntı İçerik',
  'Diğer',
];

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onBackToHome,
  onSearchTagOrQuery,
  onOpenAddMeme,
  onTabPress,
  savedMemeIds = [],
  onToggleSaveMeme,
  isAdmin = false,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const topInset =
    Platform.OS === 'web' && windowWidth > 500 ? 48 : Math.max(insets.top, 20);

  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Dynamic measured aspect ratios (width / height) for newly uploaded images
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, number>>(
    {}
  );

  // Local 5-star rating map (only star rating system, no likes/scores)
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const m of MOCK_MEMES) {
      initial[m.id] = m.rating;
    }
    return initial;
  });

  // Active meme for detail popup / fullscreen / report / tag suggest
  const [activeMeme, setActiveMeme] = useState<MemeItem>(() => MOCK_MEMES[0]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  // Report Modal State
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportError, setReportError] = useState<string | null>(null);

  // Tag Suggestion Modal State
  const [tagSuggestModalVisible, setTagSuggestModalVisible] = useState(false);
  const [suggestTagInput, setSuggestTagInput] = useState<string>('');
  const [suggestedTagsList, setSuggestedTagsList] = useState<string[]>([]);
  const [suggestTagError, setSuggestTagError] = useState<string | null>(null);

  // Measure real aspect ratio for any meme without an explicit aspectRatio
  useEffect(() => {
    MOCK_MEMES.forEach((meme) => {
      if (
        !meme.aspectRatio &&
        !measuredRatios[meme.id] &&
        meme.imageUrl &&
        meme.mediaType !== 'video'
      ) {
        Image.getSize(
          meme.imageUrl,
          (w, h) => {
            if (w > 0 && h > 0) {
              setMeasuredRatios((prev) => ({
                ...prev,
                [meme.id]: w / h,
              }));
            }
          },
          () => {
            // Ignore measurement error, fallback ratio is used
          }
        );
      }
    });
  }, [measuredRatios]);

  // Unique all tags across memes for quick discovery
  const allDiscoveryTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const meme of MOCK_MEMES) {
      for (const t of meme.tags || []) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet);
  }, []);

  // Keep selected tags at the very beginning of the discovery tag bar
  const orderedDiscoveryTags = useMemo(() => {
    if (selectedTags.length === 0) return allDiscoveryTags;
    const remaining = allDiscoveryTags.filter(
      (t) => !selectedTags.some((sel) => sel.toLowerCase() === t.toLowerCase())
    );
    return [...selectedTags, ...remaining];
  }, [allDiscoveryTags, selectedTags]);

  // Filtered memes according to category, multi-selected tags, and search input
  const filteredMemes = useMemo(() => {
    const activeCategory = SITUATION_CATEGORIES.find(
      (c) => c.id === selectedCategoryId
    );
    const searchTerms = filterQuery
      .trim()
      .toLowerCase()
      .split(/[\s,#]+/)
      .filter(Boolean);

    const baseFiltered = MOCK_MEMES.filter((meme) => {
      if (
        activeCategory &&
        activeCategory.id !== 'all' &&
        activeCategory.keywords.length > 0
      ) {
        const matchesCat =
          meme.tags.some((t) =>
            activeCategory.keywords.includes(t.toLowerCase())
          ) ||
          activeCategory.keywords.some((kw) =>
            meme.title.toLowerCase().includes(kw)
          );
        if (!matchesCat) return false;
      }

      if (searchTerms.length > 0) {
        const matchesAllTerms = searchTerms.every(
          (term) =>
            meme.title.toLowerCase().includes(term) ||
            meme.tags.some((t) => t.toLowerCase().includes(term)) ||
            meme.uploaderNickname.toLowerCase().includes(term)
        );
        if (!matchesAllTerms) return false;
      }

      return true;
    });

    if (selectedTags.length === 0) {
      return baseFiltered;
    }

    // Score each meme by how many of the selectedTags it contains
    const scored = baseFiltered
      .map((meme) => {
        const matchCount = selectedTags.filter((selTag) =>
          meme.tags.some((t) => t.toLowerCase() === selTag.toLowerCase())
        ).length;
        return { meme, matchCount };
      })
      .filter((item) => item.matchCount > 0);

    // If any memes match ALL selected tags, narrow down to them; otherwise show all matching memes sorted by match count
    const exactAllMatches = scored.filter(
      (item) => item.matchCount === selectedTags.length
    );
    const resultList = exactAllMatches.length > 0 ? exactAllMatches : scored;

    return resultList
      .sort((a, b) => b.matchCount - a.matchCount)
      .map((item) => item.meme);
  }, [selectedCategoryId, selectedTags, filterQuery]);

  // Calculate Pinterest-style 2-column staggered Masonry columns
  // Each column gets items based on shortest accumulated vertical height
  const { leftColumn, rightColumn } = useMemo(() => {
    const colWidth = 170;
    const left: { meme: MemeItem; cardHeight: number }[] = [];
    const right: { meme: MemeItem; cardHeight: number }[] = [];
    let leftTotalHeight = 0;
    let rightTotalHeight = 0;

    filteredMemes.forEach((meme, idx) => {
      const ratio =
        meme.aspectRatio ||
        measuredRatios[meme.id] ||
        FALLBACK_RATIOS[idx % FALLBACK_RATIOS.length];

      // Convert aspect ratio (w/h) into varied pixel heights (clamped between 125px and 265px)
      const rawHeight = Math.round(colWidth / ratio);
      const cardHeight = Math.max(125, Math.min(265, rawHeight));
      const totalPinHeight = cardHeight + 28; // image height + single-line Pinterest title row

      if (leftTotalHeight <= rightTotalHeight) {
        left.push({ meme, cardHeight });
        leftTotalHeight += totalPinHeight;
      } else {
        right.push({ meme, cardHeight });
        rightTotalHeight += totalPinHeight;
      }
    });

    return { leftColumn: left, rightColumn: right };
  }, [filteredMemes, measuredRatios]);

  const handleRateMeme = (memeId: string, newRating: number) => {
    const target = MOCK_MEMES.find((m) => m.id === memeId);
    const baseAvg = target ? target.rating : 4.5;
    const updatedAvg =
      newRating > 0
        ? Number(((baseAvg * 4 + newRating) / 5).toFixed(1))
        : baseAvg;

    setRatingsMap((prev) => ({
      ...prev,
      [memeId]: updatedAvg,
    }));
    if (target) {
      target.rating = updatedAvg;
    }
  };

  const handleOpenMemeDetail = (meme: MemeItem) => {
    setActiveMeme(meme);
    setDetailModalVisible(true);
  };

  const handleRandomMeme = () => {
    const pool = filteredMemes.length > 1 ? filteredMemes : MOCK_MEMES;
    const candidates = pool.filter((m) => m.id !== activeMeme.id);
    const nextMeme =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : pool[0];
    if (nextMeme) {
      setActiveMeme(nextMeme);
      setDetailModalVisible(true);
    }
  };

  const handleSearchSubmit = () => {
    if (filterQuery.trim()) {
      onSearchTagOrQuery(filterQuery.trim());
    }
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedTags([]);
  };

  const handleToggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      }
      return [...prev, tag];
    });
    setSelectedCategoryId('all');
  };

  const handleShareMeme = async (memeToShare: MemeItem = activeMeme) => {
    try {
      const tagText =
        memeToShare.tags && memeToShare.tags.length > 0
          ? memeToShare.tags.map((t) => `#${t}`).join(' ')
          : '';
      const shareCaption = `${memeToShare.title} 😂 ${tagText}`.trim();

      const isLocalFile =
        Platform.OS !== 'web' &&
        (memeToShare.imageUrl.startsWith('file://') ||
          memeToShare.imageUrl.startsWith('content://'));

      if (isLocalFile) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(memeToShare.imageUrl, {
            dialogTitle: `${memeToShare.title} - Paylaş`,
          });
          return;
        }
      }

      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share({
          title: memeToShare.title,
          text: shareCaption,
          url: memeToShare.imageUrl,
        });
        return;
      }

      await Share.share(
        {
          title: memeToShare.title,
          message:
            Platform.OS === 'ios'
              ? shareCaption
              : `${shareCaption}\n${memeToShare.imageUrl}`,
          url: memeToShare.imageUrl,
        },
        {
          dialogTitle: `${memeToShare.title} - Paylaş`,
          subject: memeToShare.title,
        }
      );
    } catch {
      Alert.alert('Paylaşım', 'Paylaşım ekranı açılamadı.');
    }
  };

  const handleOpenReportModal = (memeTarget: MemeItem = activeMeme) => {
    setActiveMeme(memeTarget);
    setSelectedReason('');
    setReportDescription('');
    setReportError(null);
    setDetailModalVisible(false);
    setReportModalVisible(true);
  };

  const handleSubmitReport = () => {
    if (!selectedReason) {
      setReportError('Lütfen bir rapor sebebi seçin.');
      return;
    }
    if (!reportDescription.trim()) {
      setReportError('Lütfen kısaca bir açıklama girin.');
      return;
    }

    setReportModalVisible(false);
    const msg = `"${activeMeme.title}" başlıklı meme "${selectedReason}" sebebiyle incelenmek üzere bildirildi. Teşekkürler! 🚩`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => window.alert(msg), 150);
    } else {
      Alert.alert('Rapor Gönderildi', msg);
    }
  };

  const handleOpenTagSuggestModal = (memeTarget: MemeItem = activeMeme) => {
    setActiveMeme(memeTarget);
    setSuggestTagInput('');
    setSuggestedTagsList([]);
    setSuggestTagError(null);
    setDetailModalVisible(false);
    setTagSuggestModalVisible(true);
  };

  const handleAddSuggestedTag = () => {
    const cleaned = suggestTagInput.replace(/#/g, '').trim();
    if (!cleaned) return;
    const parts = cleaned
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setSuggestedTagsList((prev) => {
      const next = [...prev];
      for (const part of parts) {
        const alreadyInMeme = (activeMeme.tags || []).some(
          (t) => t.toLowerCase() === part.toLowerCase()
        );
        const alreadyInSuggestions = next.some(
          (t) => t.toLowerCase() === part.toLowerCase()
        );
        if (!alreadyInMeme && !alreadyInSuggestions) {
          next.push(part);
        }
      }
      return next;
    });

    setSuggestTagInput('');
    setSuggestTagError(null);
  };

  const handleRemoveSuggestedTag = (tagToRemove: string) => {
    setSuggestedTagsList((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmitTagSuggestions = () => {
    const pending = suggestTagInput.replace(/#/g, '').trim();
    const finalTags = [...suggestedTagsList];

    if (pending) {
      const pendingParts = pending
        .split(/[\s,]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const part of pendingParts) {
        if (
          !finalTags.some((t) => t.toLowerCase() === part.toLowerCase()) &&
          !(activeMeme.tags || []).some(
            (t) => t.toLowerCase() === part.toLowerCase()
          )
        ) {
          finalTags.push(part);
        }
      }
    }

    if (finalTags.length === 0) {
      setSuggestTagError('Lütfen en az bir yeni etiket önerisi ekleyin.');
      return;
    }

    setTagSuggestModalVisible(false);
    const formattedTags = finalTags.map((t) => `#${t}`).join(', ');
    const msg = `Önerdiğiniz etiketler (${formattedTags}) incelenmek üzere gönderildi. Sistem tarafından onaylandığında meme'e dahil edilecektir! ✨`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => window.alert(msg), 150);
    } else {
      Alert.alert('Etiket Önerisi Alındı', msg);
    }
  };

  const uploaderHandle = `@${activeMeme.uploaderNickname || 'anonim'}`;
  const activeMemeRating = Math.round(
    ratingsMap[activeMeme.id] ?? activeMeme.rating
  );

  // Render a single Pinterest-style Pin card with its natural height
  const renderMasonryPin = (item: { meme: MemeItem; cardHeight: number }) => {
    const { meme, cardHeight } = item;
    const memeAvg = ratingsMap[meme.id] ?? meme.rating ?? 4.5;
    const formattedAvg = Number(memeAvg).toFixed(1).replace('.', ',');
    const itemUploader = `@${meme.uploaderNickname || 'anonim'}`;

    return (
      <View key={meme.id} style={styles.pinItemContainer}>
        <CartoonCard
          onPress={() => handleOpenMemeDetail(meme)}
          borderRadius={20}
          shadowOffset={4}
          showGloss={false}
          style={[styles.pinCardWrapper, { height: cardHeight }]}
          contentStyle={[styles.pinCardInner, { height: cardHeight }]}
        >
          {meme.imageUrl ? (
            <Image
              source={{ uri: meme.imageUrl }}
              style={[styles.pinCardImage, { height: cardHeight }]}
              resizeMode="cover"
            />
          ) : null}

          {/* Top Right Uploader Handle on Pin */}
          <View style={styles.pinTopRightUploader} pointerEvents="none">
            <Text
              numberOfLines={1}
              style={[styles.pinUploaderText, styles.pinUploaderStroke]}
            >
              {itemUploader}
            </Text>
            <Text numberOfLines={1} style={styles.pinUploaderText}>
              {itemUploader}
            </Text>
          </View>

          {/* Bottom Left Small Average Rating (e.g. "4,5 ★") without covering the meme */}
          <View style={styles.pinBottomLeftRating} pointerEvents="none">
            <View style={styles.pinRatingTextWrap}>
              <Text style={[styles.pinRatingText, styles.pinRatingStroke]}>
                {formattedAvg}
              </Text>
              <Text style={styles.pinRatingText}>{formattedAvg}</Text>
            </View>
            <Star
              size={11}
              color="#000000"
              fill={CARTOON_COLORS.yellow}
              strokeWidth={2.4}
            />
          </View>
        </CartoonCard>

        {/* Clean Single-Line Caption Footer (no three dots on the right) */}
        <View style={styles.pinFooterBlock}>
          <Pressable onPress={() => handleOpenMemeDetail(meme)}>
            <Text style={styles.pinTitleText} numberOfLines={1}>
              {meme.title}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compact Top Header: Title on Left + Search Toggle, Random Roll & Add Meme on Right */}
        <View style={styles.headerTopRow}>
          <Pressable onPress={onBackToHome} style={styles.titleContainer}>
            <ColorfulTitle fontSize={31} />
          </Pressable>

          <View style={styles.headerActionsRight}>
            <Pressable
              onPress={() => setSearchBarOpen((prev) => !prev)}
              style={[
                styles.headerCircleBtn,
                {
                  backgroundColor: searchBarOpen
                    ? CARTOON_COLORS.pastelPink
                    : CARTOON_COLORS.cyan,
                },
              ]}
            >
              <CartoonCornerGloss size="xs" top={2} left={2} />
              {searchBarOpen ? (
                <X size={17} color="#000000" strokeWidth={2.8} />
              ) : (
                <Search size={17} color="#000000" strokeWidth={2.8} />
              )}
            </Pressable>

            <Pressable
              onPress={handleRandomMeme}
              style={[
                styles.headerCircleBtn,
                { backgroundColor: CARTOON_COLORS.yellow },
              ]}
            >
              <CartoonCornerGloss size="xs" top={2} left={2} />
              <Shuffle size={17} color="#000000" strokeWidth={2.8} />
            </Pressable>

            <Pressable
              onPress={() =>
                onOpenAddMeme(selectedTags[0] || filterQuery || '')
              }
              style={[
                styles.headerCircleBtn,
                { backgroundColor: CARTOON_COLORS.green },
              ]}
            >
              <CartoonCornerGloss size="xs" top={2} left={2} />
              <Plus size={18} color="#000000" strokeWidth={3} />
            </Pressable>
          </View>
        </View>

        {/* Collapsible Cartoon Search Bar (when search icon is tapped) */}
        {searchBarOpen && (
          <View style={styles.searchBarRow}>
            <CartoonSearchInput
              value={filterQuery}
              onChangeText={setFilterQuery}
              placeholder="Birden fazla etiket veya kelime yaz..."
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              rightElement={
                <View style={styles.searchRight}>
                  {filterQuery.length > 0 && (
                    <Pressable
                      onPress={() => setFilterQuery('')}
                      style={styles.clearBtn}
                    >
                      <X size={16} color="#000000" strokeWidth={2.5} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleSearchSubmit}
                    style={styles.searchIconBtn}
                  >
                    <CartoonCornerGloss size="sm" top={2} left={3} />
                    <Search size={19} color="#000000" strokeWidth={2.8} />
                  </Pressable>
                </View>
              }
            />
          </View>
        )}

        {/* Pinterest-style Top Category Tabs Bar ("Tümü", "Anlık Tepki", "Yazılımcı & Ofis", etc.) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {SITUATION_CATEGORIES.map((cat) => {
            const isSelected =
              selectedCategoryId === cat.id && selectedTags.length === 0;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleSelectCategory(cat.id)}
                style={styles.categoryPillWrapper}
              >
                <View style={styles.categoryPillShadow} />
                <View
                  style={[
                    styles.categoryPillFace,
                    {
                      backgroundColor: isSelected ? cat.color : '#FFFFFF',
                      transform: isSelected
                        ? [{ translateX: 1.5 }, { translateY: 1.5 }]
                        : [],
                    },
                  ]}
                >
                  <CartoonCornerGloss size="xs" top={2} left={3} />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Multi-Select #Tag Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.memeTagsScroll}
          contentContainerStyle={styles.memeTagsContainer}
        >
          {selectedTags.length > 0 && (
            <Pressable
              onPress={() => setSelectedTags([])}
              style={styles.activeTagClearChip}
            >
              <Text style={styles.activeTagClearText}>
                Temizle ({selectedTags.length}) ✕
              </Text>
            </Pressable>
          )}
          {orderedDiscoveryTags.map((tag, idx) => {
            const isTagSelected = selectedTags.some(
              (t) => t.toLowerCase() === tag.toLowerCase()
            );
            return (
              <CartoonBadge
                key={`discover-tag-${tag}`}
                tag={tag}
                index={idx}
                selected={isTagSelected}
                onPress={() => handleToggleTagFilter(tag)}
              />
            );
          })}
        </ScrollView>

        {/* Pinterest Staggered 2-Column Masonry Feed */}
        {filteredMemes.length === 0 ? (
          <CartoonCard
            borderRadius={20}
            shadowOffset={4}
            bgColor={CARTOON_COLORS.pastelYellow}
            style={styles.emptyStateWrapper}
            contentStyle={styles.emptyStateCard}
          >
            <Text style={styles.emptyStateTitle}>
              Bu filtrede henüz meme yok!
            </Text>
            <Text style={styles.emptyStateDesc}>
              İlk ekleyen sen olmak ister misin?
            </Text>
            <CartoonButton
              label="Yeni Meme Ekle"
              onPress={() =>
                onOpenAddMeme(selectedTags[0] || filterQuery || '')
              }
              bgColor={CARTOON_COLORS.green}
              icon={<Plus size={16} color="#000000" strokeWidth={3} />}
              borderRadius={16}
              shadowSize={3}
              style={{ alignSelf: 'center', marginTop: 10, marginBottom: 6 }}
              faceStyle={{
                height: 40,
                paddingVertical: 0,
                paddingHorizontal: 16,
                borderWidth: 2.5,
              }}
            />
          </CartoonCard>
        ) : (
          <View style={styles.masonryContainer}>
            {/* Left Masonry Column */}
            <View style={styles.masonryColumn}>
              {leftColumn.map(renderMasonryPin)}
            </View>

            {/* Right Masonry Column */}
            <View style={styles.masonryColumn}>
              {rightColumn.map(renderMasonryPin)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Compact Cartoon Meme Detail Popup Modal (Opens when tapping any Pin or 3-dots) */}
      <Modal
        visible={detailModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.reportOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDetailModalVisible(false)}
          />
          <View style={styles.detailPopupWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.detailPopupBody}>
              {/* Header: Title, Report & Close */}
              <View style={styles.detailHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailModalTitle}>
                    {activeMeme.title}
                  </Text>
                  <Text style={styles.detailUploaderSub} numberOfLines={1}>
                    {uploaderHandle}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleOpenReportModal(activeMeme)}
                  style={[
                    styles.detailRandomMiniBtn,
                    { backgroundColor: '#EF4444' },
                  ]}
                >
                  <CartoonCornerGloss size="xs" top={2} left={2} />
                  <Flag size={15} color="#FFFFFF" strokeWidth={2.8} />
                </Pressable>

                <Pressable
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              {/* Meme Media Preview Card (Respects aspect ratio) */}
              <CartoonCard
                onPress={() => {
                  setDetailModalVisible(false);
                  setFullscreenVisible(true);
                }}
                borderRadius={18}
                shadowOffset={4}
                showGloss={false}
                style={styles.detailMediaCardWrap}
                contentStyle={styles.detailMediaCardInner}
              >
                <Image
                  source={{ uri: activeMeme.imageUrl }}
                  style={styles.detailMediaImage}
                  resizeMode="cover"
                />
                <View style={styles.expandHintIcon} pointerEvents="none">
                  <Maximize2 size={14} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              </CartoonCard>

              {/* ONLY 5-Star Rating + Save & Share Actions */}
              <View style={styles.detailActionsRow}>
                <StarRating
                  initialRating={activeMemeRating}
                  onRate={(r) => handleRateMeme(activeMeme.id, r)}
                  size={22}
                />

                <View style={styles.footerActionsGroup}>
                  <CartoonButton
                    onPress={() => onToggleSaveMeme && onToggleSaveMeme(activeMeme.id)}
                    bgColor={
                      savedMemeIds.includes(activeMeme.id)
                        ? CARTOON_COLORS.green
                        : CARTOON_COLORS.yellow
                    }
                    icon={
                      <Bookmark
                        size={15}
                        color="#000000"
                        fill={
                          savedMemeIds.includes(activeMeme.id)
                            ? '#000000'
                            : 'none'
                        }
                        strokeWidth={2.8}
                      />
                    }
                    borderRadius={14}
                    shadowSize={2.5}
                    style={styles.reportIconBtn}
                    faceStyle={styles.reportIconFace}
                  />

                  <CartoonButton
                    label="Paylaş"
                    onPress={() => handleShareMeme(activeMeme)}
                    bgColor={CARTOON_COLORS.cyan}
                    icon={<Share2 size={15} color="#000000" strokeWidth={2.8} />}
                    borderRadius={16}
                    shadowSize={2.5}
                    style={styles.shareCartoonBtn}
                    faceStyle={styles.shareCartoonFace}
                    textStyle={styles.shareCartoonBtnText}
                  />
                </View>
              </View>

              {/* Meme Tags + "+" Suggest Tag */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.detailTagsScroll}
                contentContainerStyle={styles.memeTagsContainer}
              >
                {(activeMeme.tags || []).map((tag, idx) => (
                  <CartoonBadge
                    key={`detail-${tag}`}
                    tag={tag}
                    index={idx}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleToggleTagFilter(tag);
                    }}
                  />
                ))}

                <CartoonButton
                  onPress={() => handleOpenTagSuggestModal(activeMeme)}
                  bgColor={CARTOON_COLORS.yellow}
                  icon={<Plus size={15} color="#000000" strokeWidth={3.2} />}
                  borderRadius={14}
                  shadowSize={2.5}
                  style={styles.suggestPlusCartoonBtn}
                  faceStyle={styles.suggestPlusCartoonFace}
                />
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Meme Lightbox Popup Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenBackdrop}>
          <View
            style={[
              styles.fullscreenTopBar,
              { paddingTop: Math.max(insets.top + 8, 24) },
            ]}
          >
            <View style={styles.fullscreenTitleBlock}>
              <Text style={styles.fullscreenTitleText}>
                {activeMeme.title}
              </Text>
              <Text style={styles.fullscreenSubText} numberOfLines={1}>
                {uploaderHandle}
              </Text>
            </View>

            <Pressable
              onPress={() => setFullscreenVisible(false)}
              style={styles.fullscreenCloseBtn}
            >
              <CartoonCornerGloss size="sm" top={2} left={3} />
              <X size={22} color="#000000" strokeWidth={3} />
            </Pressable>
          </View>

          <Pressable
            style={styles.fullscreenMediaArea}
            onPress={() => setFullscreenVisible(false)}
          >
            <Image
              source={{ uri: activeMeme.imageUrl }}
              style={[
                styles.fullscreenImage,
                { height: windowHeight * 0.68 },
              ]}
              resizeMode="contain"
            />
          </Pressable>

          <View
            style={[
              styles.fullscreenBottomBar,
              { paddingBottom: Math.max(insets.bottom + 18, 28) },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.fullscreenTagsScroll}
              contentContainerStyle={styles.fullscreenTagsRow}
            >
              {(activeMeme.tags || []).map((tag, idx) => (
                <CartoonBadge
                  key={`fs-${tag}`}
                  tag={tag}
                  index={idx}
                  onPress={() => {
                    setFullscreenVisible(false);
                    handleToggleTagFilter(tag);
                  }}
                />
              ))}

              <CartoonButton
                onPress={() => {
                  setFullscreenVisible(false);
                  handleOpenTagSuggestModal(activeMeme);
                }}
                bgColor={CARTOON_COLORS.yellow}
                icon={<Plus size={15} color="#000000" strokeWidth={3.2} />}
                borderRadius={14}
                shadowSize={2.5}
                style={styles.suggestPlusCartoonBtn}
                faceStyle={styles.suggestPlusCartoonFace}
              />
            </ScrollView>

            <View style={styles.fullscreenActionRow}>
              <CartoonButton
                onPress={() => onToggleSaveMeme && onToggleSaveMeme(activeMeme.id)}
                bgColor={
                  savedMemeIds.includes(activeMeme.id)
                    ? CARTOON_COLORS.green
                    : CARTOON_COLORS.yellow
                }
                icon={
                  <Bookmark
                    size={18}
                    color="#000000"
                    fill={
                      savedMemeIds.includes(activeMeme.id)
                        ? '#000000'
                        : 'none'
                    }
                    strokeWidth={2.8}
                  />
                }
                borderRadius={16}
                shadowSize={3}
                style={styles.fullscreenReportBtn}
                faceStyle={styles.fullscreenReportFace}
              />

              <CartoonButton
                onPress={() => {
                  setFullscreenVisible(false);
                  handleOpenReportModal(activeMeme);
                }}
                bgColor="#EF4444"
                icon={<Flag size={18} color="#FFFFFF" strokeWidth={2.6} />}
                borderRadius={16}
                shadowSize={3}
                style={styles.fullscreenReportBtn}
                faceStyle={styles.fullscreenReportFace}
              />

              <CartoonButton
                label="Bu Meme'i Paylaş"
                onPress={() => handleShareMeme(activeMeme)}
                bgColor={CARTOON_COLORS.cyan}
                icon={<Share2 size={18} color="#000000" strokeWidth={2.8} />}
                borderRadius={20}
                shadowSize={3.5}
                style={styles.fullscreenShareBtn}
                faceStyle={styles.fullscreenShareFace}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Meme Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[
            styles.reportOverlay,
            {
              paddingTop: Math.max(insets.top + 12, 20),
              paddingBottom: Math.max(insets.bottom + 12, 20),
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setReportModalVisible(false)}
          />
          <View style={styles.reportCardWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.reportCardBody}>
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View style={styles.reportBadgeIcon}>
                    <Flag size={16} color="#FFFFFF" strokeWidth={2.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>Meme'i Bildir</Text>
                    <Text style={styles.reportModalSubtitle} numberOfLines={1}>
                      {activeMeme.title}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setReportModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.reportSectionLabel}>Rapor Sebebi</Text>
                <View style={styles.reasonsList}>
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        onPress={() => {
                          setSelectedReason(reason);
                          setReportError(null);
                        }}
                        style={[
                          styles.reasonOptionRow,
                          isSelected && styles.reasonOptionSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.reasonRadioCircle,
                            isSelected && styles.reasonRadioSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check size={12} color="#000000" strokeWidth={3.5} />
                          )}
                        </View>
                        <Text style={styles.reasonOptionText}>{reason}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.reportSectionLabel}>Açıklama</Text>
                <View style={styles.reportInputWrapper}>
                  <TextInput
                    value={reportDescription}
                    onChangeText={(val) => {
                      setReportDescription(val);
                      setReportError(null);
                    }}
                    placeholder="Lütfen bildirim nedeninizi kısaca açıklayın..."
                    placeholderTextColor="#777777"
                    multiline
                    numberOfLines={3}
                    style={styles.reportTextArea}
                  />
                </View>

                {reportError ? (
                  <Text style={styles.reportErrorText}>{reportError}</Text>
                ) : null}

                <CartoonButton
                  label="Raporu Gönder"
                  onPress={handleSubmitReport}
                  bgColor="#EF4444"
                  textColor="#FFFFFF"
                  icon={<Flag size={16} color="#FFFFFF" strokeWidth={2.6} />}
                  borderRadius={18}
                  shadowSize={3}
                  style={styles.reportSubmitBtn}
                  faceStyle={styles.reportSubmitFace}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Suggest Tag Modal */}
      <Modal
        visible={tagSuggestModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setTagSuggestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[
            styles.reportOverlay,
            {
              paddingTop: Math.max(insets.top + 12, 20),
              paddingBottom: Math.max(insets.bottom + 12, 20),
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setTagSuggestModalVisible(false)}
          />
          <View style={styles.reportCardWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.reportCardBody}>
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View
                    style={[
                      styles.reportBadgeIcon,
                      { backgroundColor: CARTOON_COLORS.yellow },
                    ]}
                  >
                    <Plus size={18} color="#000000" strokeWidth={3} />
                  </View>
                  <Text style={styles.reportModalTitle}>Etiket Öner</Text>
                </View>

                <Pressable
                  onPress={() => setTagSuggestModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.suggestInfoBanner}>
                  <CartoonCornerGloss size="xs" top={2} left={3} />
                  <Info size={18} color="#000000" strokeWidth={2.6} />
                  <Text style={styles.suggestInfoText}>
                    Önerdiğiniz etiketler sistem tarafından incelenip
                    onaylandığında bu meme'e dahil edilecektir.
                  </Text>
                </View>

                <Text style={styles.reportSectionLabel}>
                  Önerilen Etiketler ({suggestedTagsList.length})
                </Text>

                {suggestedTagsList.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestedModalTagsScroll}
                    contentContainerStyle={styles.suggestedModalTagsRow}
                  >
                    {suggestedTagsList.map((tag, idx) => (
                      <View key={tag} style={styles.suggestedModalChipWrap}>
                        <View style={styles.suggestedModalChipShadow} />
                        <View
                          style={[
                            styles.suggestedModalChipFace,
                            {
                              backgroundColor:
                                idx % 2 === 0
                                  ? CARTOON_COLORS.pastelYellow
                                  : CARTOON_COLORS.pastelGreen,
                            },
                          ]}
                        >
                          <CartoonCornerGloss size="xs" top={2} left={3} />
                          <Text style={styles.suggestedModalChipText}>
                            #{tag}
                          </Text>
                          <Pressable
                            onPress={() => handleRemoveSuggestedTag(tag)}
                            style={styles.suggestedModalChipRemove}
                          >
                            <X size={12} color="#000000" strokeWidth={3} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.suggestEmptyHint}>
                    Henüz etiket eklemediniz. Aşağıdan yazıp "+" butonuna
                    basabilirsiniz.
                  </Text>
                )}

                <Text style={styles.reportSectionLabel}>Yeni Etiket Ekle</Text>
                <View style={styles.suggestInputRow}>
                  <View style={styles.suggestInputBox}>
                    <CartoonCornerGloss size="xs" top={2} left={4} />
                    <Text style={styles.suggestHashPrefix}>#</Text>
                    <TextInput
                      value={suggestTagInput}
                      onChangeText={(val) => {
                        setSuggestTagInput(val);
                        setSuggestTagError(null);
                      }}
                      placeholder="komik, tepki, kedi..."
                      placeholderTextColor="#777777"
                      style={styles.suggestTextInput}
                      returnKeyType="done"
                      onSubmitEditing={handleAddSuggestedTag}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <CartoonButton
                    label="Ekle"
                    onPress={handleAddSuggestedTag}
                    bgColor={CARTOON_COLORS.yellow}
                    icon={<Plus size={16} color="#000000" strokeWidth={3} />}
                    borderRadius={16}
                    shadowSize={2.5}
                    style={styles.suggestAddBtn}
                    faceStyle={styles.suggestAddBtnFace}
                  />
                </View>

                {suggestTagError ? (
                  <Text style={styles.reportErrorText}>{suggestTagError}</Text>
                ) : null}

                <CartoonButton
                  label="Önerileri Gönder"
                  onPress={handleSubmitTagSuggestions}
                  bgColor={CARTOON_COLORS.green}
                  textColor="#000000"
                  icon={<Check size={18} color="#000000" strokeWidth={3} />}
                  borderRadius={18}
                  shadowSize={3}
                  style={styles.reportSubmitBtn}
                  faceStyle={styles.reportSubmitFace}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cartoon 3D Bottom Navigation Bar with activeTab="explore" */}
      <BottomNavBar activeTab="explore" onTabPress={onTabPress} isAdmin={isAdmin} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 120,
    alignItems: 'center',
  },
  headerTopRow: {
    width: '100%',
    maxWidth: 366,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    transform: [{ translateY: Platform.OS === 'ios' ? 3.5 : 0 }],
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarRow: {
    width: '100%',
    maxWidth: 366,
    marginBottom: 8,
  },
  searchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScroll: {
    width: '100%',
    maxWidth: 366,
    flexGrow: 0,
    marginBottom: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  categoryPillWrapper: {
    position: 'relative',
    marginBottom: 4,
    marginRight: 2,
  },
  categoryPillShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  categoryPillFace: {
    position: 'relative',
    zIndex: 2,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  categoryPillText: {
    ...CARTOON_FONTS.bold,
    fontSize: 12.5,
    color: '#334155',
  },
  categoryPillTextActive: {
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
  },
  memeTagsScroll: {
    width: '100%',
    maxWidth: 366,
    flexGrow: 0,
    marginBottom: 10,
  },
  memeTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  activeTagClearChip: {
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginBottom: 4,
    marginRight: 4,
  },
  activeTagClearText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12.5,
    color: '#000000',
  },
  masonryContainer: {
    width: '100%',
    maxWidth: 366,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  masonryColumn: {
    width: '48.2%',
    flexDirection: 'column',
  },
  pinItemContainer: {
    width: '100%',
    marginBottom: 16,
  },
  pinCardWrapper: {
    width: '100%',
  },
  pinCardInner: {
    width: '100%',
    backgroundColor: '#0F172A',
  },
  pinCardImage: {
    width: '100%',
  },
  pinTopRightUploader: {
    position: 'absolute',
    top: 7,
    right: 9,
    maxWidth: '82%',
  },
  pinUploaderText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 10.5,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pinUploaderStroke: {
    position: 'absolute',
    top: 1,
    left: 1,
    color: '#000000',
  },
  pinBottomLeftRating: {
    position: 'absolute',
    bottom: 7,
    left: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'transparent',
  },
  pinRatingTextWrap: {
    position: 'relative',
  },
  pinRatingText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 11.5,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2.5,
  },
  pinRatingStroke: {
    position: 'absolute',
    top: 1,
    left: 1,
    color: '#000000',
  },
  pinFooterBlock: {
    marginTop: 6,
    paddingHorizontal: 3,
  },
  pinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  pinTitleText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12.5,
    color: '#0F172A',
  },
  pinMoreDotsBtn: {
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  pinMiniShareBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateWrapper: {
    width: '100%',
    maxWidth: 366,
    marginVertical: 10,
  },
  emptyStateCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 17,
    color: '#000000',
    textAlign: 'center',
  },
  emptyStateDesc: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    marginTop: 4,
  },
  detailPopupWrapper: {
    width: '100%',
    maxWidth: 350,
    position: 'relative',
    zIndex: 2,
  },
  detailPopupBody: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#000000',
    padding: 16,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  detailModalTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 17,
    lineHeight: 22,
    color: '#000000',
  },
  detailUploaderSub: {
    ...CARTOON_FONTS.bold,
    fontSize: 12.5,
    color: '#475569',
  },
  detailRandomMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMediaCardWrap: {
    width: '100%',
    marginBottom: 10,
  },
  detailMediaCardInner: {
    width: '100%',
    height: 215,
    backgroundColor: '#0F172A',
  },
  detailMediaImage: {
    width: '100%',
    height: 215,
  },
  detailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  detailTagsScroll: {
    width: '100%',
    flexGrow: 0,
  },
  expandHintIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareCartoonBtn: {
    alignSelf: 'center',
  },
  shareCartoonFace: {
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: 13,
    borderWidth: 2.5,
  },
  shareCartoonBtnText: {
    fontSize: 12.5,
  },
  reportIconBtn: {
    alignSelf: 'center',
  },
  reportIconFace: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 2.5,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 28, 0.94)',
    justifyContent: 'space-between',
  },
  fullscreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  fullscreenTitleBlock: {
    flex: 1,
  },
  fullscreenTitleText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  fullscreenSubText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 14,
    color: CARTOON_COLORS.yellow,
    marginTop: 2,
  },
  fullscreenCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARTOON_COLORS.pink,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenMediaArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fullscreenImage: {
    width: '100%',
  },
  fullscreenBottomBar: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  fullscreenTagsScroll: {
    width: '100%',
    maxWidth: 360,
    flexGrow: 0,
  },
  fullscreenTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  fullscreenActionRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullscreenReportBtn: {
    flexShrink: 0,
  },
  fullscreenReportFace: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 2.5,
  },
  fullscreenShareBtn: {
    flex: 1,
  },
  fullscreenShareFace: {
    width: '100%',
    height: 44,
    paddingVertical: 0,
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  reportCardWrapper: {
    width: '100%',
    maxWidth: 350,
    maxHeight: '100%',
    flexShrink: 1,
    position: 'relative',
    zIndex: 2,
  },
  reportCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  reportCardBody: {
    position: 'relative',
    zIndex: 2,
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#000000',
    padding: 18,
  },
  reportScrollArea: {
    flexShrink: 1,
  },
  reportScrollContent: {
    paddingRight: 5,
    paddingBottom: 10,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  reportBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 20,
    color: '#000000',
  },
  reportModalSubtitle: {
    ...CARTOON_FONTS.bold,
    fontSize: 12.5,
    color: '#475569',
    marginTop: 1,
  },
  reportCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSectionLabel: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
  },
  reasonsList: {
    gap: 6,
    marginBottom: 12,
  },
  reasonOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reasonOptionSelected: {
    backgroundColor: CARTOON_COLORS.pastelYellow,
  },
  reasonRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioSelected: {
    backgroundColor: CARTOON_COLORS.yellow,
  },
  reasonOptionText: {
    ...CARTOON_FONTS.bold,
    fontSize: 13,
    color: '#000000',
    flex: 1,
  },
  reportInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  reportTextArea: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 14,
    color: '#000000',
    minHeight: 68,
    textAlignVertical: 'top',
  },
  reportErrorText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
  },
  reportSubmitBtn: {
    width: '100%',
    marginTop: 4,
    marginBottom: 4,
  },
  reportSubmitFace: {
    width: '100%',
    height: 44,
    paddingVertical: 0,
    borderWidth: 2.5,
  },
  suggestPlusCartoonBtn: {
    alignSelf: 'center',
    marginBottom: 4,
    marginRight: 4,
  },
  suggestPlusCartoonFace: {
    width: 34,
    height: 29,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 2.5,
  },
  suggestInfoBanner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARTOON_COLORS.pastelBlue,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  suggestInfoText: {
    flex: 1,
    ...CARTOON_FONTS.bold,
    fontSize: 12.5,
    color: '#000000',
    lineHeight: 17,
  },
  suggestedModalTagsScroll: {
    width: '100%',
    flexGrow: 0,
    marginBottom: 12,
  },
  suggestedModalTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  suggestedModalChipWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  suggestedModalChipShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  suggestedModalChipFace: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingLeft: 10,
    paddingRight: 7,
    paddingVertical: 4,
    gap: 5,
  },
  suggestedModalChipText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#000000',
  },
  suggestedModalChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestEmptyHint: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 10,
  },
  suggestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  suggestInputBox: {
    position: 'relative',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 44,
  },
  suggestHashPrefix: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 16,
    color: '#8B5CF6',
    marginRight: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestTextInput: {
    flex: 1,
    ...CARTOON_FONTS.semiBold,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 0,
    height: '100%',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestAddBtn: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  suggestAddBtnFace: {
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderWidth: 2.5,
  },
});
