import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Film,
  Camera,
  Trash2,
  RefreshCw,
  Play,
  Plus,
  X,
  Link2,
  Smartphone,
  AlertCircle,
} from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import {
  CartoonCard,
  CartoonButton,
  CartoonBadge,
  CartoonCornerGloss,
  RoughCornerAccent,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { MemeItem } from '../types/meme';

interface AddMemeScreenProps {
  onBack: () => void;
  onAddMeme: (meme: MemeItem) => void;
  onTabPress: (tab: TabType) => void;
  defaultTag?: string;
  currentUserNickname?: string;
}

interface SelectedMedia {
  uri: string;
  mediaType: 'image' | 'video';
  fileName?: string | null;
  duration?: number | null;
}

type MediaSourceMode = 'device' | 'url';

const SUGGESTED_TAGS = ['komik', 'yazılımcı', 'kedi', 'hamster', 'sınav', 'pazartesi'];

export const AddMemeScreen: React.FC<AddMemeScreenProps> = ({
  onBack,
  onAddMeme,
  onTabPress,
  defaultTag = '',
  currentUserNickname = 'enes',
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const topInset =
    Platform.OS === 'web' && windowWidth > 500 ? 48 : Math.max(insets.top, 20);

  const [mediaMode, setMediaMode] = useState<MediaSourceMode>('device');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [urlMediaType, setUrlMediaType] = useState<'image' | 'video'>('image');

  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [addedTags, setAddedTags] = useState<string[]>(() => {
    const cleanDefault = defaultTag.replace(/^#+/, '').trim();
    return cleanDefault ? [cleanDefault] : [];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const cleanDefault = defaultTag.replace(/^#+/, '').trim();
    if (cleanDefault) {
      setAddedTags((prev) =>
        prev.some((t) => t.toLowerCase() === cleanDefault.toLowerCase())
          ? prev
          : [cleanDefault, ...prev]
      );
    }
  }, [defaultTag]);

  const showValidationError = (msg: string) => {
    setErrorMessage(msg);
    if (Platform.OS !== 'web') {
      Alert.alert('Eksik Bilgi', msg);
    }
  };

  const addTagToState = (rawTag: string) => {
    const candidates = rawTag
      .split(',')
      .map((part) => part.replace(/#/g, '').trim())
      .filter(Boolean);

    if (candidates.length === 0) return;

    setAddedTags((prev) => {
      const next = [...prev];
      for (const candidate of candidates) {
        const exists = next.some(
          (existing) => existing.toLowerCase() === candidate.toLowerCase()
        );
        if (!exists) {
          next.push(candidate);
        }
      }
      return next;
    });
    setErrorMessage(null);
  };

  const handleAddTagFromInput = () => {
    if (!tagInput.trim()) return;
    addTagToState(tagInput);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAddedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleUrlChange = (val: string) => {
    setMediaUrl(val);
    setErrorMessage(null);
    if (/\.(mp4|mov|webm|mkv|avi)(\?.*)?$/i.test(val.trim())) {
      setUrlMediaType('video');
    }
  };

  const handlePickFromLibrary = async (filterType?: 'images' | 'videos') => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showValidationError(
          'Fotoğraf veya video yükleyebilmek için galeri erişim izni vermeniz gerekiyor.'
        );
        return;
      }

      const mediaTypes: ImagePicker.MediaType[] = filterType
        ? [filterType]
        : ['images', 'videos'];

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' ||
          (asset.mimeType && asset.mimeType.startsWith('video/')) ||
          /\.(mp4|mov|webm|mkv|avi)$/i.test(asset.uri);

        setSelectedMedia({
          uri: asset.uri,
          mediaType: isVideo ? 'video' : 'image',
          fileName: asset.fileName || (isVideo ? 'meme-video.mp4' : 'meme-foto.jpg'),
          duration: asset.duration,
        });
        setErrorMessage(null);
      }
    } catch {
      showValidationError('Medya seçilirken bir sorun oluştu.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showValidationError(
          'Fotoğraf veya video çekebilmek için kamera izni vermeniz gerekiyor.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        setSelectedMedia({
          uri: asset.uri,
          mediaType: isVideo ? 'video' : 'image',
          fileName: asset.fileName || (isVideo ? 'kamera-video.mp4' : 'kamera-foto.jpg'),
          duration: asset.duration,
        });
        setErrorMessage(null);
      }
    } catch {
      showValidationError('Kamera bu cihazda veya tarayıcıda kullanılamıyor.');
    }
  };

  const handleAppendTag = (tagToAdd: string) => {
    addTagToState(tagToAdd);
  };

  const handleSubmit = () => {
    // 1. Validate Media (Device upload OR URL is required)
    const hasDeviceMedia = mediaMode === 'device' && selectedMedia !== null;
    const trimmedUrl = mediaUrl.trim();
    const hasUrlMedia = mediaMode === 'url' && trimmedUrl.length > 0;

    // Fallback check: if user switched tabs after filling the other tab, accept whichever is provided
    const effectiveMedia: { uri: string; mediaType: 'image' | 'video' } | null =
      hasDeviceMedia && selectedMedia
        ? { uri: selectedMedia.uri, mediaType: selectedMedia.mediaType }
        : hasUrlMedia
        ? { uri: trimmedUrl, mediaType: urlMediaType }
        : selectedMedia
        ? { uri: selectedMedia.uri, mediaType: selectedMedia.mediaType }
        : trimmedUrl.length > 0
        ? { uri: trimmedUrl, mediaType: urlMediaType }
        : null;

    if (!effectiveMedia) {
      showValidationError(
        'Lütfen cihazdan bir fotoğraf/video yükleyin VEYA geçerli bir medya URL’si girin.'
      );
      return;
    }

    if (
      effectiveMedia.uri === trimmedUrl &&
      !/^https?:\/\/.+/i.test(trimmedUrl)
    ) {
      showValidationError(
        'Lütfen http:// veya https:// ile başlayan geçerli bir medya URL’si girin.'
      );
      return;
    }

    // 2. Validate Title (Required)
    if (!title.trim()) {
      showValidationError('Lütfen meme için bir başlık girin.');
      return;
    }

    // 3. Validate Tags (At least 1 tag is required)
    const pendingInputTag = tagInput.replace(/#/g, '').trim();
    const finalTags = [...addedTags];
    if (
      pendingInputTag &&
      !finalTags.some((t) => t.toLowerCase() === pendingInputTag.toLowerCase())
    ) {
      finalTags.push(pendingInputTag);
    }

    if (finalTags.length === 0) {
      showValidationError('Lütfen en az bir etiket ekleyin.');
      return;
    }

    setErrorMessage(null);

    const newMeme: MemeItem = {
      id: Date.now().toString(),
      title: title.trim(),
      imageUrl: effectiveMedia.uri,
      mediaType: effectiveMedia.mediaType,
      tags: finalTags,
      uploaderNickname: currentUserNickname,
      rating: 5,
      ratingCount: 1,
      description:
        effectiveMedia.mediaType === 'video'
          ? 'Kullanıcı tarafından video meme olarak eklendi.'
          : 'Kullanıcı tarafından eklendi.',
    };

    onAddMeme(newMeme);
  };

  const formatDuration = (ms?: number | null) => {
    if (!ms) return '';
    const totalSeconds = Math.round(ms > 1000 ? ms / 1000 : ms);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topInset + 8 },
          ]}
        >
          {/* Top Bar: Back Button + Colorful Title */}
          <View style={styles.topHeaderRow}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <CartoonCornerGloss size="sm" top={2.5} left={3} />
              <ArrowLeft size={22} color="#000000" strokeWidth={3} />
            </Pressable>

            <Pressable onPress={onBack} style={styles.titleCenter}>
              <ColorfulTitle fontSize={34} />
            </Pressable>

            <View style={styles.headerSpacer} />
          </View>

          {/* Page Subtitle Banner */}
          <View style={styles.pageHeaderRow}>
            <View>
              <Text style={styles.pageTitle}>Yeni Meme Ekle 🎨</Text>
              <RoughCornerAccent width={140} height={10} color="#000000" />
            </View>
          </View>

          {/* 1. Photo/Video Upload OR URL Option */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>
              Fotoğraf / Video Yükle veya URL Ekle *
            </Text>

            {/* Source Mode Switcher: Device Upload OR URL */}
            <View style={styles.modeSwitchRow}>
              <Pressable
                onPress={() => {
                  setMediaMode('device');
                  setErrorMessage(null);
                }}
                style={[
                  styles.modeSwitchTab,
                  mediaMode === 'device' && {
                    backgroundColor: CARTOON_COLORS.yellow,
                  },
                ]}
              >
                <CartoonCornerGloss size="sm" top={2.5} left={4} />
                <Smartphone size={17} color="#000000" strokeWidth={2.5} />
                <Text style={styles.modeSwitchText}>Cihazdan Yükle</Text>
              </Pressable>

              <Text style={styles.orBadgeText}>VEYA</Text>

              <Pressable
                onPress={() => {
                  setMediaMode('url');
                  setErrorMessage(null);
                }}
                style={[
                  styles.modeSwitchTab,
                  mediaMode === 'url' && {
                    backgroundColor: CARTOON_COLORS.cyan,
                  },
                ]}
              >
                <CartoonCornerGloss size="sm" top={2.5} left={4} />
                <Link2 size={17} color="#000000" strokeWidth={2.5} />
                <Text style={styles.modeSwitchText}>URL Ekle</Text>
              </Pressable>
            </View>

            {mediaMode === 'device' ? (
              selectedMedia ? (
                <CartoonCard
                  borderRadius={22}
                  shadowOffset={5}
                  contentStyle={styles.mediaPreviewCard}
                >
                  {selectedMedia.mediaType === 'video' && Platform.OS === 'web' ? (
                    React.createElement('video', {
                      src: selectedMedia.uri,
                      style: {
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        backgroundColor: '#000',
                      },
                      controls: true,
                      loop: true,
                      muted: true,
                      playsInline: true,
                    })
                  ) : (
                    <View style={styles.previewImageContainer}>
                      <Image
                        source={{ uri: selectedMedia.uri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                      {selectedMedia.mediaType === 'video' && (
                        <View style={styles.videoCenterOverlay}>
                          <View style={styles.videoPlayCircle}>
                            <Play
                              size={28}
                              color="#000000"
                              fill="#FFE600"
                              strokeWidth={2.5}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Top Media Type Badge */}
                  <View
                    style={[
                      styles.mediaTypeSticker,
                      {
                        backgroundColor:
                          selectedMedia.mediaType === 'video'
                            ? CARTOON_COLORS.cyan
                            : CARTOON_COLORS.yellow,
                      },
                    ]}
                  >
                    {selectedMedia.mediaType === 'video' ? (
                      <Film size={14} color="#000000" strokeWidth={2.5} />
                    ) : (
                      <ImageIcon size={14} color="#000000" strokeWidth={2.5} />
                    )}
                    <Text style={styles.mediaTypeStickerText}>
                      {selectedMedia.mediaType === 'video'
                        ? `VİDEO ${formatDuration(selectedMedia.duration)}`.trim()
                        : 'FOTOĞRAF'}
                    </Text>
                  </View>

                  {/* Bottom Action Strip inside Preview Card */}
                  <View style={styles.previewFooterBar}>
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {selectedMedia.fileName || 'Medya seçildi'}
                    </Text>

                    <View style={styles.previewActionBtns}>
                      <Pressable
                        onPress={() => handlePickFromLibrary()}
                        style={[
                          styles.miniActionBtn,
                          { backgroundColor: CARTOON_COLORS.pastelYellow },
                        ]}
                      >
                        <RefreshCw size={15} color="#000000" strokeWidth={2.5} />
                        <Text style={styles.miniActionText}>Değiştir</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setSelectedMedia(null)}
                        style={[
                          styles.miniActionBtn,
                          { backgroundColor: CARTOON_COLORS.pastelPink },
                        ]}
                      >
                        <Trash2 size={15} color="#000000" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                </CartoonCard>
              ) : (
                <CartoonCard
                  borderRadius={22}
                  shadowOffset={5}
                  bgColor="#FFFFFF"
                  contentStyle={styles.dropzoneCard}
                >
                  <Pressable
                    onPress={() => handlePickFromLibrary()}
                    style={styles.dropzoneMainTouch}
                  >
                    <View style={styles.uploadIconCircle}>
                      <UploadCloud size={34} color="#000000" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.dropzoneTitle}>
                      Cihazdan Fotoğraf veya Video Seç
                    </Text>
                    <Text style={styles.dropzoneSubtitle}>
                      Galerinden komik bir fotoğraf ya da video yükle
                    </Text>
                  </Pressable>

                  {/* Quick Media Picker Buttons */}
                  <View style={styles.pickerButtonsRow}>
                    <Pressable
                      onPress={() => handlePickFromLibrary('images')}
                      style={[
                        styles.pickerPillBtn,
                        { backgroundColor: CARTOON_COLORS.pastelYellow },
                      ]}
                    >
                      <ImageIcon size={17} color="#000000" strokeWidth={2.5} />
                      <Text style={styles.pickerPillText}>Fotoğraf</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handlePickFromLibrary('videos')}
                      style={[
                        styles.pickerPillBtn,
                        { backgroundColor: CARTOON_COLORS.pastelBlue },
                      ]}
                    >
                      <Film size={17} color="#000000" strokeWidth={2.5} />
                      <Text style={styles.pickerPillText}>Video</Text>
                    </Pressable>

                    {Platform.OS !== 'web' && (
                      <Pressable
                        onPress={handleCaptureCamera}
                        style={[
                          styles.pickerPillBtn,
                          { backgroundColor: CARTOON_COLORS.pastelGreen },
                        ]}
                      >
                        <Camera size={17} color="#000000" strokeWidth={2.5} />
                        <Text style={styles.pickerPillText}>Kamera</Text>
                      </Pressable>
                    )}
                  </View>
                </CartoonCard>
              )
            ) : (
              /* URL Input & Live Preview Card */
              <CartoonCard
                borderRadius={22}
                shadowOffset={5}
                bgColor="#FFFFFF"
                contentStyle={styles.urlModeCard}
              >
                <View style={styles.urlTypeToggleRow}>
                  <Pressable
                    onPress={() => setUrlMediaType('image')}
                    style={[
                      styles.urlTypeChip,
                      urlMediaType === 'image' && {
                        backgroundColor: CARTOON_COLORS.pastelYellow,
                      },
                    ]}
                  >
                    <ImageIcon size={15} color="#000000" strokeWidth={2.5} />
                    <Text style={styles.urlTypeChipText}>Fotoğraf URL</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setUrlMediaType('video')}
                    style={[
                      styles.urlTypeChip,
                      urlMediaType === 'video' && {
                        backgroundColor: CARTOON_COLORS.pastelBlue,
                      },
                    ]}
                  >
                    <Film size={15} color="#000000" strokeWidth={2.5} />
                    <Text style={styles.urlTypeChipText}>Video URL</Text>
                  </Pressable>
                </View>

                <View style={styles.inputBoxWrapper}>
                  <View style={styles.inputShadow} pointerEvents="none" />
                  <View style={styles.tagInputSurface}>
                    <Link2
                      size={18}
                      color="#000000"
                      strokeWidth={2.5}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={styles.tagFieldInput}
                      placeholder={
                        urlMediaType === 'video'
                          ? 'https://.../meme-video.mp4'
                          : 'https://.../meme-gorsel.jpg'
                      }
                      placeholderTextColor="#888888"
                      value={mediaUrl}
                      onChangeText={handleUrlChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    {mediaUrl.length > 0 && (
                      <Pressable
                        onPress={() => setMediaUrl('')}
                        style={styles.removeTagBtn}
                      >
                        <X size={13} color="#000000" strokeWidth={3} />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/^https?:\/\/.+/i.test(mediaUrl.trim()) && (
                  <View style={styles.urlPreviewBox}>
                    {urlMediaType === 'video' && Platform.OS === 'web' ? (
                      React.createElement('video', {
                        src: mediaUrl.trim(),
                        style: {
                          width: '100%',
                          height: 175,
                          objectFit: 'cover',
                          backgroundColor: '#000',
                        },
                        controls: true,
                        loop: true,
                        muted: true,
                        playsInline: true,
                      })
                    ) : (
                      <Image
                        source={{ uri: mediaUrl.trim() }}
                        style={styles.urlPreviewImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                )}
              </CartoonCard>
            )}
          </View>

          {/* 2. Meme Title Input (Required) */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Meme Başlığı *</Text>
            <View style={styles.inputBoxWrapper}>
              <View style={styles.inputShadow} pointerEvents="none" />
              <View style={styles.inputSurface}>
                <CartoonCornerGloss size="sm" top={2.5} left={4} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Örn: Pazartesi sabahı alarm çalınca ben"
                  placeholderTextColor="#888888"
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    setErrorMessage(null);
                  }}
                />
              </View>
            </View>
          </View>

          {/* 3. Tags Input + Added Tags under Heading (Required) */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Etiketler * (En az 1 etiket)</Text>

            {/* Added Tags shown directly under the "Etiketler" heading (Single-line Horizontal Scroll) */}
            {addedTags.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.addedTagsScroll}
                contentContainerStyle={styles.addedTagsContainer}
              >
                {addedTags.map((tag, idx) => (
                  <View key={tag + '-' + idx} style={styles.addedTagChipWrapper}>
                    <View style={styles.addedTagChipShadow} />
                    <View
                      style={[
                        styles.addedTagChipFace,
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
                      <Text style={styles.addedTagChipText}>#{tag}</Text>
                      <Pressable
                        onPress={() => handleRemoveTag(tag)}
                        hitSlop={6}
                        style={styles.removeTagBtn}
                      >
                        <X size={13} color="#000000" strokeWidth={3} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyTagsHint}>
                Henüz etiket eklenmedi. Aşağıdan yazıp &quot;Ekle&quot; butonuna basın:
              </Text>
            )}

            {/* Tag Input Row: Input on the Left + "Ekle" Button on the Right */}
            <View style={styles.tagInputRow}>
              <View style={[styles.inputBoxWrapper, styles.tagInputFlex]}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.tagInputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <Text style={styles.autoHashPrefix}>#</Text>
                  <TextInput
                    style={styles.tagFieldInput}
                    placeholder="etiket yazın (örn: komik)"
                    placeholderTextColor="#888888"
                    value={tagInput}
                    onChangeText={(val) => {
                      setTagInput(val.replace(/^#+/, ''));
                      setErrorMessage(null);
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleAddTagFromInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <CartoonButton
                label="Ekle"
                onPress={handleAddTagFromInput}
                bgColor={CARTOON_COLORS.yellow}
                icon={<Plus size={18} color="#000000" strokeWidth={3} />}
                borderRadius={18}
                shadowSize={4}
                style={styles.addTagBtn}
              />
            </View>

            {/* Quick Suggested Tags (Single-line Horizontal Scroll) */}
            <Text style={styles.suggestedLabel}>Hızlı ekle:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestedTagsScroll}
              contentContainerStyle={styles.suggestedTagsRow}
            >
              {SUGGESTED_TAGS.map((tag, idx) => (
                <CartoonBadge
                  key={tag}
                  tag={tag}
                  index={idx}
                  onPress={() => handleAppendTag(tag)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Validation Error Banner (if any required field is missing) */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color="#000000" strokeWidth={2.5} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* 4. Submit Button */}
          <View style={styles.submitRow}>
            <CartoonButton
              label="Meme'i Yayımla!"
              onPress={handleSubmit}
              bgColor={CARTOON_COLORS.green}
              icon={<UploadCloud size={22} color="#000000" strokeWidth={2.5} />}
              style={styles.fullWidthBtn}
              borderRadius={22}
              shadowSize={5}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation Bar with 'add' active */}
      <BottomNavBar activeTab="add" onTabPress={onTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
    alignItems: 'center',
  },
  topHeaderRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: Platform.OS === 'ios' ? 4 : 0 }],
  },
  headerSpacer: {
    width: 40,
  },
  pageHeaderRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  pageTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 22,
    color: '#000000',
  },
  sectionBlock: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 14,
  },
  fieldLabel: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 15,
    color: '#000000',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dropzoneCard: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dropzoneMainTouch: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropzoneTitle: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
  dropzoneSubtitle: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 12,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
  },
  pickerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  pickerPillText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#000000',
  },
  mediaPreviewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  previewImageContainer: {
    width: '100%',
    height: 215,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  previewImage: {
    width: '100%',
    height: 215,
  },
  videoCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  videoPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTypeSticker: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  mediaTypeStickerText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 11,
    color: '#000000',
  },
  previewFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: '#000000',
    gap: 8,
  },
  fileNameText: {
    flex: 1,
    ...CARTOON_FONTS.semiBold,
    fontSize: 13,
    color: '#000000',
  },
  previewActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  miniActionText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#000000',
  },
  inputBoxWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  inputShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  inputSurface: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  fieldInput: {
    ...CARTOON_FONTS.semiBold,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#000000',
    paddingVertical: 6,
  },
  addedTagsScroll: {
    width: '100%',
    flexGrow: 0,
    marginBottom: 12,
  },
  addedTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  addedTagChipWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  addedTagChipShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  addedTagChipFace: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 5,
    gap: 6,
  },
  addedTagChipText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 14,
    color: '#000000',
  },
  removeTagBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTagsHint: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  tagInputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  tagInputSurface: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 50,
  },
  autoHashPrefix: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 18,
    color: '#8B5CF6',
    marginRight: 4,
  },
  tagFieldInput: {
    flex: 1,
    ...CARTOON_FONTS.semiBold,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#000000',
    paddingVertical: 6,
  },
  addTagBtn: {
    height: 50,
    justifyContent: 'center',
  },
  suggestedLabel: {
    ...CARTOON_FONTS.bold,
    fontSize: 13,
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  suggestedTagsScroll: {
    width: '100%',
    flexGrow: 0,
    marginTop: 2,
  },
  suggestedTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  modeSwitchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  modeSwitchText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#000000',
  },
  orBadgeText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#475569',
    paddingHorizontal: 2,
  },
  urlModeCard: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  urlTypeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  urlTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#F8FAFC',
  },
  urlTypeChipText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#000000',
  },
  urlPreviewBox: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  urlPreviewImage: {
    width: '100%',
    height: 175,
  },
  errorBanner: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    flex: 1,
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#000000',
  },
  submitRow: {
    width: '100%',
    maxWidth: 360,
    marginTop: 10,
    alignItems: 'center',
  },
  fullWidthBtn: {
    width: '100%',
  },
});
