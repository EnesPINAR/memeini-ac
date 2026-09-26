import React, { useState, useMemo } from 'react';
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
  UserCircle,
  X,
  Share2,
  Maximize2,
  Flag,
  Check,
  Plus,
  Info,
  Bookmark,
  Star,
} from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { StarRating } from '../components/StarRating';
import { ExpoUIButton } from '../components/ExpoUIButton';
import {
  CartoonCard,
  CartoonButton,
  CartoonSearchInput,
  CartoonBadge,
  CartoonCornerGloss,
  RoughCornerAccent,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { MemeItem } from '../types/meme';
import { searchMemes } from '../data/mockMemes';

interface SearchResultsScreenProps {
  initialQuery: string;
  onBackToHome: () => void;
  onOpenAddMeme: (tag?: string) => void;
  onTabPress: (tab: TabType) => void;
  savedMemeIds?: string[];
  onToggleSaveMeme?: (memeId: string) => void;
}

const USERNAME_STROKE_OFFSETS = [
  { x: -1.5, y: -1.5 },
  { x: 1.5, y: -1.5 },
  { x: -1.5, y: 1.5 },
  { x: 1.5, y: 1.5 },
  { x: 0, y: 2 },
];

const REPORT_REASONS = [
  'Uygunsuz / Müstehcen İçerik',
  'Spam veya Alakasız Meme',
  'Nefret Söylemi / Hakaret',
  'Telif Hakkı / Çalıntı İçerik',
  'Diğer',
];

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  initialQuery,
  onBackToHome,
  onOpenAddMeme,
  onTabPress,
  savedMemeIds = [],
  onToggleSaveMeme,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const topInset = Platform.OS === 'web' && windowWidth > 500 ? 48 : Math.max(insets.top, 20);

  const [query, setQuery] = useState(initialQuery || 'Örnek arama');
  const [searchData, setSearchData] = useState(() =>
    searchMemes(initialQuery || 'Örnek arama')
  );
  const [currentBest, setCurrentBest] = useState<MemeItem>(searchData.bestMatch);
  const [alternatives, setAlternatives] = useState<MemeItem[]>(
    searchData.alternatives
  );
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

  const handleSearchSubmit = () => {
    if (query.trim()) {
      const results = searchMemes(query.trim());
      setSearchData(results);
      setCurrentBest(results.bestMatch);
      setAlternatives(results.alternatives);
    }
  };

  const handleSelectAlternative = (item: MemeItem, index: number) => {
    const oldBest = currentBest;
    setCurrentBest(item);
    setAlternatives((prev) => {
      const updated = [...prev];
      updated[index] = oldBest;
      return updated;
    });
  };

  const handleOpenReportModal = () => {
    setSelectedReason('');
    setReportDescription('');
    setReportError(null);
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
    const msg = `"${currentBest.title}" başlıklı meme "${selectedReason}" sebebiyle incelenmek üzere bildirildi. Teşekkürler! 🚩`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => window.alert(msg), 150);
    } else {
      Alert.alert('Rapor Gönderildi', msg);
    }
  };

  const handleOpenTagSuggestModal = () => {
    setSuggestTagInput('');
    setSuggestedTagsList([]);
    setSuggestTagError(null);
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
        const alreadyInMeme = (currentBest.tags || []).some(
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
          !(currentBest.tags || []).some(
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

  const handleShareMeme = async () => {
    try {
      const tagText =
        currentBest.tags && currentBest.tags.length > 0
          ? currentBest.tags.map((t) => `#${t}`).join(' ')
          : '';
      const shareCaption = `${currentBest.title} 😂 ${tagText}`.trim();

      // 1. If local file URI on native (e.g. uploaded from phone gallery/camera), share file directly via expo-sharing
      const isLocalFile =
        Platform.OS !== 'web' &&
        (currentBest.imageUrl.startsWith('file://') ||
          currentBest.imageUrl.startsWith('content://'));

      if (isLocalFile) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(currentBest.imageUrl, {
            dialogTitle: `${currentBest.title} - Paylaş`,
          });
          return;
        }
      }

      // 2. Web Share API if on web and supported
      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share({
          title: currentBest.title,
          text: shareCaption,
          url: currentBest.imageUrl,
        });
        return;
      }

      // 3. Native OS Share Sheet (WhatsApp, Instagram, Telegram, Messages, etc.)
      await Share.share(
        {
          title: currentBest.title,
          message:
            Platform.OS === 'ios'
              ? shareCaption
              : `${shareCaption}\n${currentBest.imageUrl}`,
          url: currentBest.imageUrl,
        },
        {
          dialogTitle: `${currentBest.title} - Paylaş`,
          subject: currentBest.title,
        }
      );
    } catch {
      Alert.alert('Paylaşım', 'Paylaşım ekranı açılamadı.');
    }
  };

  const uploaderHandle = `@${currentBest.uploaderNickname || 'anonim'}`;

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Colorful Title matching Figma positioning */}
        <Pressable onPress={onBackToHome} style={styles.titleContainer}>
          <ColorfulTitle fontSize={38} />
        </Pressable>

        {/* Cartoon 3D Search Bar */}
        <View style={styles.searchBarRow}>
          <CartoonSearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ornek arama"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            rightElement={
              <View style={styles.searchRight}>
                {query.length > 0 && (
                  <Pressable
                    onPress={() => setQuery('')}
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
                  <Search size={20} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>
            }
          />
        </View>

        {/* If no exact meme matched the search query, show Yeni Meme Ekle card */}
        {searchData.noExactMatch && (
          <CartoonCard
            borderRadius={20}
            shadowOffset={4}
            bgColor={CARTOON_COLORS.pastelYellow}
            style={styles.noMatchBannerWrapper}
            contentStyle={styles.noMatchBannerCard}
          >
            <Text style={styles.noMatchBannerTitle}>
              &quot;{searchData.query}&quot; için henüz meme bulunamadı!
            </Text>
            <Text style={styles.noMatchBannerDesc}>
              İlk ekleyen sen olmak ister misin?
            </Text>
            <CartoonButton
              label="Yeni Meme Ekle"
              onPress={() => onOpenAddMeme(searchData.query)}
              bgColor={CARTOON_COLORS.green}
              icon={<Plus size={16} color="#000000" strokeWidth={3} />}
              borderRadius={16}
              shadowSize={3}
              style={styles.noMatchAddBtn}
              faceStyle={styles.noMatchAddBtnFace}
            />
          </CartoonCard>
        )}

        {/* "En Uyumlu" Heading + Meme Title underneath with Right-Aligned Report Button */}
        <View style={styles.topSectionHeader}>
          <View style={styles.enUyumluTitleWrap}>
            <Text style={styles.questionText}>
              {currentBest.mediaType === 'video' ? 'En Uyumlu 🎬' : 'En Uyumlu'}
            </Text>
            <RoughCornerAccent width={100} height={10} color="#000000" />
          </View>

          <View style={styles.memeTitleAndReportRow}>
            <Text style={styles.compactMemeTitle}>
              {currentBest.title}
            </Text>

            <CartoonButton
              onPress={handleOpenReportModal}
              bgColor="#EF4444"
              icon={<Flag size={16} color="#FFFFFF" strokeWidth={2.6} />}
              borderRadius={14}
              shadowSize={2.5}
              style={styles.reportIconBtn}
              faceStyle={styles.reportIconFace}
            />
          </View>
        </View>

        {/* Main Card: Tapping opens Full-Screen Popup (with 3D button hover/press physics & no gloss) */}
        <CartoonCard
          onPress={() => setFullscreenVisible(true)}
          borderRadius={24}
          shadowOffset={6}
          showGloss={false}
          style={styles.mainCardWrapper}
          contentStyle={styles.mainMemeCard}
        >
          {currentBest.imageUrl ? (
            currentBest.mediaType === 'video' && Platform.OS === 'web' ? (
              React.createElement('video', {
                src: currentBest.imageUrl,
                style: {
                  width: '100%',
                  height: 225,
                  objectFit: 'cover',
                  backgroundColor: '#000',
                },
                controls: true,
                loop: true,
                playsInline: true,
              })
            ) : (
              <Image
                source={{ uri: currentBest.imageUrl }}
                style={styles.mainMemeImage}
                resizeMode="cover"
              />
            )
          ) : null}

          {/* Top Right Uploader Username (No background, outlined for high contrast over any meme) */}
          <View style={styles.topRightUploaderOverlay} pointerEvents="none">
            <View style={styles.outlinedIconWrap}>
              <View style={styles.iconStrokeShadow}>
                <UserCircle size={17} color="#000000" strokeWidth={3.5} />
              </View>
              <UserCircle size={17} color="#FFFFFF" strokeWidth={2.2} />
            </View>

            <View style={styles.outlinedUsernameWrap}>
              {USERNAME_STROKE_OFFSETS.map((offset, idx) => (
                <Text
                  key={`u-stroke-${idx}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.overlayUsernameText,
                    styles.overlayUsernameStroke,
                    {
                      transform: [
                        { translateX: offset.x },
                        { translateY: offset.y },
                      ],
                    },
                  ]}
                >
                  {uploaderHandle}
                </Text>
              ))}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.overlayUsernameText}
              >
                {uploaderHandle}
              </Text>
            </View>
          </View>

          {/* Subtle bottom-right fullscreen hint icon (no background box covering the meme) */}
          <View style={styles.expandHintIcon} pointerEvents="none">
            <Maximize2 size={15} color="#FFFFFF" strokeWidth={2.8} />
          </View>
        </CartoonCard>

        {/* Row under Card: 5 Cartoon Stars on Left + Save & Paylaş Button on Right */}
        <View style={styles.cardFooter}>
          <StarRating initialRating={currentBest.rating} size={24} />

          <View style={styles.footerActionsGroup}>
            <CartoonButton
              onPress={() => onToggleSaveMeme && onToggleSaveMeme(currentBest.id)}
              bgColor={
                savedMemeIds.includes(currentBest.id)
                  ? CARTOON_COLORS.green
                  : CARTOON_COLORS.yellow
              }
              icon={
                <Bookmark
                  size={16}
                  color="#000000"
                  fill={
                    savedMemeIds.includes(currentBest.id)
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
              onPress={handleShareMeme}
              bgColor={CARTOON_COLORS.cyan}
              icon={<Share2 size={16} color="#000000" strokeWidth={2.8} />}
              borderRadius={16}
              shadowSize={2.5}
              style={styles.shareCartoonBtn}
              faceStyle={styles.shareCartoonFace}
              textStyle={styles.shareCartoonBtnText}
            />
          </View>
        </View>

        {/* Associated Meme Tags + End "+" Suggest Tag Button (Single-line Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.memeTagsScroll}
          contentContainerStyle={styles.memeTagsContainer}
        >
          {(currentBest.tags || []).map((tag, idx) => (
            <CartoonBadge
              key={tag}
              tag={tag}
              index={idx}
              onPress={() => {
                setQuery(tag);
                const results = searchMemes(tag);
                setSearchData(results);
                setCurrentBest(results.bestMatch);
                setAlternatives(results.alternatives);
              }}
            />
          ))}

          {/* "+" Suggest Tag Button at the end of the tags list (uses CartoonButton with explicit faceStyle like Report icon button) */}
          <CartoonButton
            onPress={handleOpenTagSuggestModal}
            bgColor={CARTOON_COLORS.yellow}
            icon={<Plus size={15} color="#000000" strokeWidth={3.2} />}
            borderRadius={14}
            shadowSize={2.5}
            style={styles.suggestPlusCartoonBtn}
            faceStyle={styles.suggestPlusCartoonFace}
          />
        </ScrollView>

        {/* "Bu değil mi?" Heading + Cartoon "Sen ekle (+)" Button */}
        <View style={styles.actionRow}>
          <View>
            <Text style={styles.questionText}>Bu değil mi?</Text>
            <RoughCornerAccent width={95} height={10} color="#000000" />
          </View>

          <ExpoUIButton
            label="Sen ekle"
            onPress={() => onOpenAddMeme(query)}
            bgColor={CARTOON_COLORS.yellow}
          />
        </View>

        {/* 2-Column Pinterest Masonry Grid of Alternative Memes (Identical to ExploreScreen design) */}
        <View style={styles.masonryContainer}>
          {[0, 1].map((colIdx) => (
            <View key={`alt-col-${colIdx}`} style={styles.masonryColumn}>
              {alternatives
                .slice(0, 4)
                .map((item, idx) => ({ item, idx }))
                .filter((_, i) => i % 2 === colIdx)
                .map(({ item: altMeme, idx: originalIndex }) => {
                  const ratio = altMeme.aspectRatio || (originalIndex % 2 === 0 ? 0.75 : 1.1);
                  const clampedRatio = Math.max(0.58, Math.min(1.4, ratio));
                  const colW = Math.floor((Math.min(windowWidth - 36, 360) - 12) / 2);
                  const cardHeight = Math.max(125, Math.min(260, Math.round(colW / clampedRatio)));
                  const formattedAvg = Number(altMeme.rating || 4.5)
                    .toFixed(1)
                    .replace('.', ',');
                  const itemUploader = `@${altMeme.uploaderNickname || 'anonim'}`;

                  return (
                    <View
                      key={`${altMeme.id}-${originalIndex}`}
                      style={styles.pinItemContainer}
                    >
                      <CartoonCard
                        onPress={() => handleSelectAlternative(altMeme, originalIndex)}
                        borderRadius={20}
                        shadowOffset={4}
                        showGloss={false}
                        style={[styles.pinCardWrapper, { height: cardHeight }]}
                        contentStyle={[styles.pinCardInner, { height: cardHeight }]}
                      >
                        {altMeme.imageUrl ? (
                          <Image
                            source={{ uri: altMeme.imageUrl }}
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

                        {/* Bottom Left Small Average Rating ("4,5 ★") without covering the meme */}
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
                        <Pressable
                          onPress={() => handleSelectAlternative(altMeme, originalIndex)}
                        >
                          <Text style={styles.pinTitleText} numberOfLines={1}>
                            {altMeme.title || 'Alternatif Meme'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Full-Screen Meme Lightbox Popup Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenBackdrop}>
          {/* Top Bar in Fullscreen Popup */}
          <View
            style={[
              styles.fullscreenTopBar,
              { paddingTop: Math.max(insets.top + 8, 24) },
            ]}
          >
            <View style={styles.fullscreenTitleBlock}>
              <Text style={styles.fullscreenTitleText} numberOfLines={1}>
                {currentBest.title}
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

          {/* Center Full-Screen Media Area (Tap outside/on image to close or inspect) */}
          <Pressable
            style={styles.fullscreenMediaArea}
            onPress={() => setFullscreenVisible(false)}
          >
            {currentBest.mediaType === 'video' && Platform.OS === 'web' ? (
              React.createElement('video', {
                src: currentBest.imageUrl,
                style: {
                  width: '100%',
                  maxHeight: windowHeight * 0.72,
                  objectFit: 'contain',
                },
                controls: true,
                autoPlay: true,
                loop: true,
                playsInline: true,
              })
            ) : (
              <Image
                source={{ uri: currentBest.imageUrl }}
                style={[
                  styles.fullscreenImage,
                  { height: windowHeight * 0.68 },
                ]}
                resizeMode="contain"
              />
            )}
          </Pressable>

          {/* Bottom Bar in Fullscreen Popup: Single-line Tags + "+" Suggest Tag Button + Red Report Button (Left) + Full-Width Share Button (Right) */}
          <View
            style={[
              styles.fullscreenBottomBar,
              { paddingBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.fullscreenTagsScroll}
              contentContainerStyle={styles.fullscreenTagsRow}
            >
              {(currentBest.tags || []).map((tag, idx) => (
                <CartoonBadge
                  key={`fs-${tag}`}
                  tag={tag}
                  index={idx}
                  onPress={() => {
                    setFullscreenVisible(false);
                    setQuery(tag);
                    const results = searchMemes(tag);
                    setSearchData(results);
                    setCurrentBest(results.bestMatch);
                    setAlternatives(results.alternatives);
                  }}
                />
              ))}

              {/* "+" Suggest Tag Button at the end of the fullscreen tags list */}
              <CartoonButton
                onPress={handleOpenTagSuggestModal}
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
                onPress={() => onToggleSaveMeme && onToggleSaveMeme(currentBest.id)}
                bgColor={
                  savedMemeIds.includes(currentBest.id)
                    ? CARTOON_COLORS.green
                    : CARTOON_COLORS.yellow
                }
                icon={
                  <Bookmark
                    size={18}
                    color="#000000"
                    fill={
                      savedMemeIds.includes(currentBest.id)
                        ? '#000000'
                        : 'none'
                    }
                    strokeWidth={2.8}
                  />
                }
                borderRadius={16}
                shadowSize={2.5}
                style={styles.fullscreenReportBtn}
                faceStyle={styles.fullscreenReportFace}
              />

              <CartoonButton
                onPress={handleOpenReportModal}
                bgColor="#EF4444"
                icon={<Flag size={18} color="#FFFFFF" strokeWidth={2.6} />}
                borderRadius={16}
                shadowSize={2.5}
                style={styles.fullscreenReportBtn}
                faceStyle={styles.fullscreenReportFace}
              />

              <CartoonButton
                label="Meme'i Paylaş"
                onPress={handleShareMeme}
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

      {/* Report Meme Popup Modal (Reason Selection + Description) */}
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
              paddingTop: Math.max(insets.top + 16, 44),
              paddingBottom: Math.max(insets.bottom + 12, 16),
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
              <CartoonCornerGloss size="lg" top={4} left={6} />
              {/* Pinned Header (Always inside safe area, never pushed off-screen by keyboard) */}
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View style={styles.reportBadgeIcon}>
                    <CartoonCornerGloss size="xs" top={1.5} left={2} />
                    <Flag size={16} color="#FFFFFF" strokeWidth={2.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>Meme&apos;i Bildir</Text>
                    <Text style={styles.reportModalSubtitle} numberOfLines={1}>
                      {currentBest.title}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setReportModalVisible(false)}
                  hitSlop={14}
                  style={styles.reportCloseBtn}
                >
                  <CartoonCornerGloss size="xs" top={1.5} left={2} />
                  <X size={18} color="#000000" strokeWidth={3} />
                </Pressable>
              </View>

              {/* Scrollable Form Content when Keyboard is Open */}
              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Reason Selection */}
                <Text style={styles.reportSectionLabel}>Rapor Sebebi Seçin *</Text>
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
                            <Check size={13} color="#000000" strokeWidth={3.2} />
                          )}
                        </View>
                        <Text style={styles.reasonOptionText}>{reason}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Description Input */}
                <Text style={styles.reportSectionLabel}>Açıklama *</Text>
                <View style={styles.reportInputWrapper}>
                  <TextInput
                    style={styles.reportTextArea}
                    placeholder="Neden raporladığınızı kısaca açıklayın..."
                    placeholderTextColor="#888888"
                    multiline
                    numberOfLines={3}
                    value={reportDescription}
                    onChangeText={(val) => {
                      setReportDescription(val);
                      setReportError(null);
                    }}
                  />
                </View>

                {reportError && (
                  <Text style={styles.reportErrorText}>{reportError}</Text>
                )}

                {/* Submit Report Button */}
                <CartoonButton
                  label="Raporu Gönder"
                  onPress={handleSubmitReport}
                  bgColor="#EF4444"
                  textColor="#FFFFFF"
                  icon={<Flag size={17} color="#FFFFFF" strokeWidth={2.6} />}
                  borderRadius={18}
                  shadowSize={3.5}
                  style={styles.reportSubmitBtn}
                  faceStyle={styles.reportSubmitFace}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Suggest Tags Popup Modal (Multi-tag suggestion + approval info, no description) */}
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
              paddingTop: Math.max(insets.top + 16, 44),
              paddingBottom: Math.max(insets.bottom + 12, 16),
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
              <CartoonCornerGloss size="lg" top={4} left={6} />

              {/* Pinned Header */}
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View
                    style={[
                      styles.reportBadgeIcon,
                      { backgroundColor: CARTOON_COLORS.yellow },
                    ]}
                  >
                    <CartoonCornerGloss size="xs" top={1.5} left={2} />
                    <Plus size={18} color="#000000" strokeWidth={3.2} />
                  </View>
                  <Text style={styles.reportModalTitle}>Etiket Öner</Text>
                </View>

                <Pressable
                  onPress={() => setTagSuggestModalVisible(false)}
                  hitSlop={14}
                  style={styles.reportCloseBtn}
                >
                  <CartoonCornerGloss size="xs" top={1.5} left={2} />
                  <X size={18} color="#000000" strokeWidth={3} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* System Approval Notice Banner */}
                <View style={styles.suggestInfoBanner}>
                  <CartoonCornerGloss size="xs" top={2} left={3} />
                  <Info size={18} color="#000000" strokeWidth={2.6} />
                  <Text style={styles.suggestInfoText}>
                    Önerilen etiketler sistem tarafından incelenip onaylandığında bu meme&apos;e dahil edilecektir.
                  </Text>
                </View>

                {/* Added Suggested Tags (Single-line Horizontal Scroll) */}
                <Text style={styles.reportSectionLabel}>
                  Önerdiğiniz Etiketler ({suggestedTagsList.length})
                </Text>

                {suggestedTagsList.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestedModalTagsScroll}
                    contentContainerStyle={styles.suggestedModalTagsRow}
                  >
                    {suggestedTagsList.map((tag, idx) => (
                      <View
                        key={`sug-${tag}-${idx}`}
                        style={styles.suggestedModalChipWrap}
                      >
                        <View style={styles.suggestedModalChipShadow} />
                        <View
                          style={[
                            styles.suggestedModalChipFace,
                            {
                              backgroundColor:
                                idx % 3 === 0
                                  ? CARTOON_COLORS.pastelYellow
                                  : idx % 3 === 1
                                  ? CARTOON_COLORS.pastelGreen
                                  : CARTOON_COLORS.pastelBlue,
                            },
                          ]}
                        >
                          <CartoonCornerGloss size="xs" top={2} left={3} />
                          <Text style={styles.suggestedModalChipText}>
                            #{tag}
                          </Text>
                          <Pressable
                            onPress={() => handleRemoveSuggestedTag(tag)}
                            hitSlop={6}
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
                    Henüz etiket eklemediniz. Aşağıdan birden fazla etiket ekleyebilirsiniz:
                  </Text>
                )}

                {/* Input Row: # Tag Input on Left + "Ekle" Button on Right */}
                <View style={styles.suggestInputRow}>
                  <View style={styles.suggestInputBox}>
                    <CartoonCornerGloss size="xs" top={2} left={4} />
                    <Text style={styles.suggestHashPrefix}>#</Text>
                    <TextInput
                      style={styles.suggestTextInput}
                      placeholder="etiket yazın..."
                      placeholderTextColor="#888888"
                      value={suggestTagInput}
                      onChangeText={(val) => {
                        setSuggestTagInput(val.replace(/^#+/, ''));
                        setSuggestTagError(null);
                      }}
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

                {suggestTagError && (
                  <Text style={styles.reportErrorText}>{suggestTagError}</Text>
                )}

                {/* Submit Tag Suggestions Button */}
                <CartoonButton
                  label="Etiket Önerilerini Gönder"
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

      {/* Cartoon 3D Bottom Navigation Bar */}
      <BottomNavBar activeTab="search" onTabPress={onTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
    alignItems: 'center',
  },
  titleContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  searchBarRow: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 14,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 360,
    marginBottom: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  enUyumluTitleWrap: {
    alignSelf: 'flex-start',
  },
  memeTitleAndReportRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  compactMemeTitle: {
    flex: 1,
    ...CARTOON_FONTS.extraBold,
    fontSize: 16.5,
    lineHeight: 21,
    color: '#0F172A',
    textAlign: 'left',
  },
  mainCardWrapper: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 10,
  },
  mainMemeCard: {
    width: '100%',
    height: 225,
    backgroundColor: '#0F172A',
  },
  mainMemeImage: {
    width: '100%',
    height: 225,
  },
  topRightUploaderOverlay: {
    position: 'absolute',
    top: 10,
    right: 12,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  outlinedIconWrap: {
    position: 'relative',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStrokeShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedUsernameWrap: {
    position: 'relative',
    flexShrink: 1,
  },
  overlayUsernameText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#FFFFFF',
    paddingHorizontal: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  overlayUsernameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: '#000000',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
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
    height: 38,
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderWidth: 2.5,
  },
  shareCartoonBtnText: {
    fontSize: 13,
  },
  reportIconBtn: {
    alignSelf: 'center',
  },
  reportIconFace: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 2.5,
  },
  memeTagsScroll: {
    width: '100%',
    maxWidth: 360,
    flexGrow: 0,
    marginBottom: 16,
  },
  memeTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  questionText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 22,
    color: '#000000',
  },
  altGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 360,
    rowGap: 16,
  },
  masonryContainer: {
    width: '100%',
    maxWidth: 360,
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
  pinTitleText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12.5,
    color: '#0F172A',
  },
  altCardWrapper: {
    width: '47.5%',
    height: 115,
  },
  altCardContainer: {
    width: '100%',
    height: 115,
  },
  altCardInner: {
    width: '100%',
    height: 115,
    backgroundColor: '#0F172A',
  },
  altCardImage: {
    width: '100%',
    height: 115,
  },
  altCardCaptionOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  altCardOverlayText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  altCardOverlayStroke: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 0,
    color: '#000000',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    lineHeight: 23,
  },
  reportModalSubtitle: {
    ...CARTOON_FONTS.bold,
    fontSize: 12.5,
    color: '#475569',
    marginTop: 1,
  },
  noMatchBannerWrapper: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 14,
  },
  noMatchBannerCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  noMatchBannerTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  noMatchBannerDesc: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 10,
  },
  noMatchAddBtn: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  noMatchAddBtnFace: {
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderWidth: 2.5,
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
