import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Share,
  Alert,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  ArrowLeft,
  Plus,
  Share2,
  Flag,
  Maximize2,
  X,
  Check,
  Info,
  Star,
  Bookmark,
  Edit3,
  Trash2,
  Clock,
  Settings,
  Lock,
  Bell,
  Mail,
  LogOut,
  ShieldAlert,
  Tag,
  CheckCircle2,
  User,
} from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { StarRating } from '../components/StarRating';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import {
  CartoonCard,
  CartoonButton,
  CartoonBadge,
  CartoonCornerGloss,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { MOCK_MEMES } from '../data/mockMemes';
import { MemeItem } from '../types/meme';

import { UserProfile, adminApi, AdminHistory } from '../services/api';

interface ProfileScreenProps {
  onBackToHome: () => void;
  onSearchTagOrQuery: (query: string) => void;
  onOpenAddMeme: (defaultTag?: string) => void;
  onTabPress: (tab: TabType) => void;
  userNickname: string;
  onUpdateNickname: (newNickname: string) => void;
  savedMemeIds: string[];
  onToggleSaveMeme: (memeId: string) => void;
  onLogout?: () => void;
  currentUser?: UserProfile | null;
}

type ProfileCollectionTab = 'uploaded' | 'starred' | 'saved';

const AVATAR_EMOJIS = ['🐹', '🐱', '🦊', '🐸', '🤖', '😎', '🚀', '🍕'];
const AVATAR_BG_COLORS = [
  CARTOON_COLORS.yellow,
  CARTOON_COLORS.cyan,
  CARTOON_COLORS.pink,
  CARTOON_COLORS.green,
  CARTOON_COLORS.orange,
  CARTOON_COLORS.purple,
];

const REPORT_REASONS = [
  'Telif Hakkı / Çalıntı İçerik',
  'Uygunsuz veya Rahatsız Edici Görsel',
  'Yanlış / Alakasız Etiketler',
  'Spam veya Reklam İçeriği',
  'Diğer Nedenler',
];

const DELETE_REQUEST_REASONS = [
  'Yanlış görsel veya hatalı etiket yükledim',
  'Daha yüksek kaliteli versiyonunu yükleyeceğim',
  'Tekrarlanan (kopya) yükleme yaptım',
  'Diğer Nedenler',
];

const SunburstBackground: React.FC = () => {
  const numRays = 20;
  const centerX = 250;
  const centerY = 380;
  const radius = 950;

  const rays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < numRays; i++) {
      if (i % 2 === 0) {
        const angle1 = (i * 2 * Math.PI) / numRays;
        const angle2 = ((i + 1) * 2 * Math.PI) / numRays;
        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);
        arr.push(`${centerX},${centerY} ${x1},${y1} ${x2},${y2}`);
      }
    }
    return arr;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 500 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="profileGrad" cx="50%" cy="38%" r="65%">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="55%" stopColor="#1D4ED8" />
            <Stop offset="100%" stopColor="#0F172A" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="500" height="900" fill="url(#profileGrad)" />
        {rays.map((points, idx) => (
          <Polygon key={idx} points={points} fill="rgba(255, 255, 255, 0.05)" />
        ))}
      </Svg>
    </View>
  );
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBackToHome,
  onSearchTagOrQuery,
  onOpenAddMeme,
  onTabPress,
  userNickname,
  onUpdateNickname,
  savedMemeIds,
  onToggleSaveMeme,
  onLogout,
  currentUser,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const topInset =
    Platform.OS === 'web' && windowWidth > 500 ? 48 : Math.max(insets.top, 20);

  // User Profile Identity State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Enes Pınar');
  const [bioText, setBioText] = useState(
    currentUser?.bio || 'Her duruma uygun bir meme mutlaka vardır 🎯 Favori meme koleksiyonum ve kendi yüklediklerim.'
  );
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser?.avatarEmoji || '🐹');
  const [avatarBg, setAvatarBg] = useState(currentUser?.avatarBg || CARTOON_COLORS.yellow);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName) setDisplayName(currentUser.displayName);
      if (currentUser.bio) setBioText(currentUser.bio);
      if (currentUser.avatarEmoji) setAvatarEmoji(currentUser.avatarEmoji);
      if (currentUser.avatarBg) setAvatarBg(currentUser.avatarBg);
    }
  }, [currentUser]);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [draftHandle, setDraftHandle] = useState(userNickname);
  const [draftBio, setDraftBio] = useState(bioText);
  const [draftAvatarEmoji, setDraftAvatarEmoji] = useState(avatarEmoji);
  const [draftAvatarBg, setDraftAvatarBg] = useState(avatarBg);

  // Settings (Gear Icon) Modal State (Password change, notifications, email, etc.)
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [emailAddress, setEmailAddress] = useState('enes@memeini.app');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isAdmin = currentUser?.role === 'ADMIN';

  type AdminCollectionTab = 'approved_memes' | 'deleted_memes' | 'added_tags' | 'reports_history';
  const ADMIN_TAB_ORDER: AdminCollectionTab[] = [
    'approved_memes',
    'deleted_memes',
    'added_tags',
    'reports_history',
  ];

  // Active Collection Tab ('uploaded' | 'starred' | 'saved')
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<ProfileCollectionTab>('uploaded');
  const [activeAdminTab, setActiveAdminTab] =
    useState<AdminCollectionTab>('approved_memes');

  // Admin History State
  const [adminHistory, setAdminHistory] = useState<AdminHistory | null>(null);
  const [isLoadingAdminHistory, setIsLoadingAdminHistory] = useState(false);

  const fetchAdminHistory = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingAdminHistory(true);
    try {
      const data = await adminApi.getHistory();
      setAdminHistory(data);
    } catch (err) {
      console.warn('Admin history fetch error:', err);
    } finally {
      setIsLoadingAdminHistory(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminHistory();
    }
  }, [isAdmin, fetchAdminHistory]);

  const formatActionDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Page ScrollView scrollEnabled flag (locked during tabspicker drag to prevent vertical scroll)
  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  // SwiftUI TabsPickerStyle animated thumb & drag gesture navigation
  const TAB_ORDER: ProfileCollectionTab[] = ['uploaded', 'starred', 'saved'];
  const tabAnim = useRef(new Animated.Value(0)).current;
  const activeTabRef = useRef<string>(isAdmin ? 'approved_memes' : 'uploaded');
  const touchDownTabRef = useRef<string>(isAdmin ? 'approved_memes' : 'uploaded');
  const dragStartIdxRef = useRef(0);
  const [segmentsWidth, setSegmentsWidth] = useState(0);
  const segmentsWidthRef = useRef(0);

  const switchCollectionTab = (nextTab: string) => {
    const order: string[] = isAdmin ? ADMIN_TAB_ORDER : TAB_ORDER;
    const targetIdx = order.indexOf(nextTab);
    if (targetIdx === -1) return;
    activeTabRef.current = nextTab;
    touchDownTabRef.current = nextTab;
    if (isAdmin) {
      setActiveAdminTab(nextTab as AdminCollectionTab);
    } else {
      setActiveCollectionTab(nextTab as ProfileCollectionTab);
    }
    setSelectedTags([]);
    Animated.spring(tabAnim, {
      toValue: targetIdx,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  };

  // Dragging finger directly along the SwiftUI TabsPickerStyle segmented bar
  const pickerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 7 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > 7 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          setPageScrollEnabled(false);
          const order: string[] = isAdmin ? ADMIN_TAB_ORDER : TAB_ORDER;
          const startTab = touchDownTabRef.current || activeTabRef.current;
          const startIdx = order.indexOf(startTab);
          dragStartIdxRef.current = startIdx >= 0 ? startIdx : 0;
          tabAnim.stopAnimation();
          tabAnim.setValue(dragStartIdxRef.current);
          if (startTab !== activeTabRef.current) {
            activeTabRef.current = startTab;
            if (isAdmin) {
              setActiveAdminTab(startTab as AdminCollectionTab);
            } else {
              setActiveCollectionTab(startTab as ProfileCollectionTab);
            }
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const totalW = segmentsWidthRef.current || 300;
          const count = isAdmin ? 4 : 3;
          const segW = totalW / count;
          const currentIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const clampedIdx = Math.max(0, Math.min(count - 1, currentIdx));
          tabAnim.setValue(clampedIdx);
        },
        onPanResponderRelease: (_, gestureState) => {
          setPageScrollEnabled(true);
          const totalW = segmentsWidthRef.current || 300;
          const count = isAdmin ? 4 : 3;
          const segW = totalW / count;
          const rawIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const snappedIdx = Math.round(Math.max(0, Math.min(count - 1, rawIdx)));
          const order: string[] = isAdmin ? ADMIN_TAB_ORDER : TAB_ORDER;
          switchCollectionTab(order[snappedIdx]);
        },
        onPanResponderTerminate: () => {
          setPageScrollEnabled(true);
          const order: string[] = isAdmin ? ADMIN_TAB_ORDER : TAB_ORDER;
          const currentIdx = order.indexOf(activeTabRef.current);
          switchCollectionTab(order[currentIdx >= 0 ? currentIdx : 0]);
        },
      }),
    [isAdmin]
  );

  // Multi-select tag filters in profile
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Local version counter when MOCK_MEMES is updated
  const [memesRevision, setMemesRevision] = useState(0);

  // User's star ratings map (memeId -> 1..5 stars)
  const [userStarRatings, setUserStarRatings] = useState<Record<string, number>>({
    '1': 5,
    '3': 5,
    '7': 4,
    '9': 5,
  });

  // Memes awaiting system approval for deletion
  const [pendingDeleteMemeIds, setPendingDeleteMemeIds] = useState<string[]>([]);
  const [deleteRequestModalVisible, setDeleteRequestModalVisible] = useState(false);
  const [selectedDeleteReason, setSelectedDeleteReason] = useState<string>(
    DELETE_REQUEST_REASONS[0]
  );
  const [deleteNote, setDeleteNote] = useState('');

  // Dynamically measured image aspect ratios (width / height)
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, number>>({});

  // Detail & Lightbox & Report & Suggest Tag Modals
  const [selectedMeme, setSelectedMeme] = useState<MemeItem>(MOCK_MEMES[0]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDescription, setReportDescription] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [tagSuggestModalVisible, setTagSuggestModalVisible] = useState(false);
  const [suggestTagInput, setSuggestTagInput] = useState('');
  const [suggestedTagsList, setSuggestedTagsList] = useState<string[]>([]);
  const [suggestTagError, setSuggestTagError] = useState<string | null>(null);

  useEffect(() => {
    MOCK_MEMES.forEach((meme) => {
      if (!measuredRatios[meme.id] && meme.imageUrl) {
        Image.getSize(
          meme.imageUrl,
          (w, h) => {
            if (w > 0 && h > 0) {
              setMeasuredRatios((prev) =>
                prev[meme.id] ? prev : { ...prev, [meme.id]: w / h }
              );
            }
          },
          () => {}
        );
      }
    });
  }, [measuredRatios, memesRevision]);

  // 1) Memes uploaded by current user
  const uploadedMemes = useMemo(() => {
    const cleanUser = userNickname.replace(/^@+/, '').trim().toLowerCase();
    return MOCK_MEMES.filter(
      (m) => m.uploaderNickname.replace(/^@+/, '').trim().toLowerCase() === cleanUser
    );
  }, [userNickname, memesRevision]);

  // 2) Memes rated with stars by current user
  const starredMemes = useMemo(() => {
    return MOCK_MEMES.filter((m) => (userStarRatings[m.id] || 0) > 0);
  }, [userStarRatings, memesRevision]);

  // 3) Memes saved by current user (Kaydedilme)
  const savedMemes = useMemo(() => {
    return MOCK_MEMES.filter((m) => savedMemeIds.includes(m.id));
  }, [savedMemeIds, memesRevision]);

  // Active tab's base meme list
  const baseCollectionMemes = useMemo(() => {
    if (activeCollectionTab === 'uploaded') return uploadedMemes;
    if (activeCollectionTab === 'starred') return starredMemes;
    return savedMemes;
  }, [activeCollectionTab, uploadedMemes, starredMemes, savedMemes]);

  // All unique tags inside the active collection tab
  const collectionTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const meme of baseCollectionMemes) {
      for (const t of meme.tags || []) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet);
  }, [baseCollectionMemes]);

  // Move selected tags to the very beginning of the tag bar
  const orderedCollectionTags = useMemo(() => {
    if (selectedTags.length === 0) return collectionTags;
    const remaining = collectionTags.filter(
      (t) => !selectedTags.some((sel) => sel.toLowerCase() === t.toLowerCase())
    );
    return [...selectedTags, ...remaining];
  }, [collectionTags, selectedTags]);

  // Filtered memes according to selectedTags
  const displayedMemes = useMemo(() => {
    if (selectedTags.length === 0) return baseCollectionMemes;
    const scored = baseCollectionMemes
      .map((meme) => {
        const matchCount = selectedTags.filter((selTag) =>
          meme.tags.some((t) => t.toLowerCase() === selTag.toLowerCase())
        ).length;
        return { meme, matchCount };
      })
      .filter((item) => item.matchCount > 0);

    const allMatched = scored.filter(
      (item) => item.matchCount === selectedTags.length
    );
    if (allMatched.length > 0) {
      return allMatched.map((item) => item.meme);
    }
    return scored
      .sort((a, b) => b.matchCount - a.matchCount)
      .map((item) => item.meme);
  }, [baseCollectionMemes, selectedTags]);

  // Split displayedMemes into 2 balanced Pinterest Masonry columns (identical to ExploreScreen)
  const columnWidth = useMemo(() => {
    const containerMax = Math.min(windowWidth - 28, 366);
    return Math.floor((containerMax - 12) / 2);
  }, [windowWidth]);

  const getPinHeight = (meme: MemeItem): number => {
    const ratio = measuredRatios[meme.id] || meme.aspectRatio || 0.85;
    const clampedRatio = Math.max(0.55, Math.min(1.45, ratio));
    const rawHeight = Math.round(columnWidth / clampedRatio);
    return Math.max(122, Math.min(285, rawHeight));
  };

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: MemeItem[] = [];
    const right: MemeItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    for (const meme of displayedMemes) {
      const h = getPinHeight(meme) + 42;
      if (leftHeight <= rightHeight) {
        left.push(meme);
        leftHeight += h;
      } else {
        right.push(meme);
        rightHeight += h;
      }
    }
    return { leftColumn: left, rightColumn: right };
  }, [displayedMemes, measuredRatios, columnWidth]);

  const handleToggleTagFilter = (tag: string) => {
    const cleanTag = tag.replace(/^#+/, '').trim();
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === cleanTag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase());
      }
      return [...prev, cleanTag];
    });
  };

  const handleOpenMemeDetail = (meme: MemeItem) => {
    setSelectedMeme(meme);
    setDetailModalVisible(true);
  };

  const handleRateMeme = (memeId: string, newRating: number) => {
    setUserStarRatings((prev) => ({
      ...prev,
      [memeId]: newRating,
    }));
  };

  const handleRequestDeleteMeme = (meme: MemeItem) => {
    setSelectedMeme(meme);
    setDetailModalVisible(false);
    setSelectedDeleteReason(DELETE_REQUEST_REASONS[0]);
    setDeleteNote('');
    setDeleteRequestModalVisible(true);
  };

  const handleSubmitDeleteRequest = () => {
    setPendingDeleteMemeIds((prev) =>
      prev.includes(selectedMeme.id) ? prev : [...prev, selectedMeme.id]
    );
    setDeleteRequestModalVisible(false);
    Alert.alert(
      'Silme Talebi İletildi ⏳',
      `"${selectedMeme.title}" başlıklı meme için silme talebiniz sistem onayına gönderildi. İncelenip onaylandığında yayından kaldırılacaktır.`
    );
  };

  const handleShareMeme = async (meme: MemeItem) => {
    try {
      const formattedTags = (meme.tags || [])
        .map((t) => `#${t.replace(/^#+/, '')}`)
        .join(' ');
      await Share.share({
        title: meme.title,
        message: `${meme.title} (${formattedTags}) — @${meme.uploaderNickname}\n${meme.imageUrl}`,
        url: meme.imageUrl,
      });
    } catch {
      Alert.alert('Paylaşım Hatası', 'Meme paylaşılırken bir sorun oluştu.');
    }
  };

  const handleOpenEditProfile = () => {
    setDraftDisplayName(displayName);
    setDraftHandle(userNickname);
    setDraftBio(bioText);
    setDraftAvatarEmoji(avatarEmoji);
    setDraftAvatarBg(avatarBg);
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    const cleanHandle = draftHandle
      .replace(/^@+/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (!cleanHandle) {
      Alert.alert('Eksik Bilgi', 'Lütfen geçerli bir kullanıcı adı girin.');
      return;
    }

    const oldClean = userNickname.replace(/^@+/, '').trim().toLowerCase();
    if (cleanHandle !== oldClean) {
      MOCK_MEMES.forEach((m) => {
        if (m.uploaderNickname.replace(/^@+/, '').trim().toLowerCase() === oldClean) {
          m.uploaderNickname = cleanHandle;
        }
      });
      onUpdateNickname(cleanHandle);
      setMemesRevision((r) => r + 1);
    }

    setDisplayName(draftDisplayName.trim() || 'Meme Avcısı');
    setBioText(draftBio.trim() || 'Her duruma uygun bir meme mutlaka vardır 🎯');
    setAvatarEmoji(draftAvatarEmoji);
    setAvatarBg(draftAvatarBg);
    setEditModalVisible(false);
  };

  const handleOpenSettings = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError(null);
    setPasswordMessage(null);
    setSettingsModalVisible(true);
  };

  const handleUpdatePassword = () => {
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword.trim()) {
      setPasswordError('Lütfen mevcut şifrenizi girin.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setPasswordError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordMessage('Şifreniz başarıyla güncellendi! ✅');
  };

  const handleOpenReportModal = (meme: MemeItem) => {
    setSelectedMeme(meme);
    setDetailModalVisible(false);
    setSelectedReason(REPORT_REASONS[0]);
    setReportDescription('');
    setReportError(null);
    setReportModalVisible(true);
  };

  const handleSubmitReport = () => {
    if (!reportDescription.trim()) {
      setReportError('Lütfen rapor nedenini kısaca açıklayın.');
      return;
    }
    setReportModalVisible(false);
    Alert.alert(
      'Bildirim Alındı 🚩',
      `"${selectedMeme.title}" başlıklı meme için raporunuz (#${selectedReason}) incelenmek üzere iletildi.`
    );
  };

  const handleOpenTagSuggestModal = (meme: MemeItem) => {
    setSelectedMeme(meme);
    setDetailModalVisible(false);
    setSuggestTagInput('');
    setSuggestedTagsList([]);
    setSuggestTagError(null);
    setTagSuggestModalVisible(true);
  };

  const addSuggestedTag = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.replace(/#/g, '').trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setSuggestedTagsList((prev) => {
      const next = [...prev];
      for (const candidate of parts) {
        const existsInSuggested = next.some(
          (t) => t.toLowerCase() === candidate.toLowerCase()
        );
        const existsInMeme = (selectedMeme.tags || []).some(
          (t) => t.toLowerCase() === candidate.toLowerCase()
        );
        if (!existsInSuggested && !existsInMeme) {
          next.push(candidate);
        }
      }
      return next;
    });
    setSuggestTagError(null);
  };

  const handleSubmitTagSuggestions = () => {
    const pendingClean = suggestTagInput.replace(/#/g, '').trim();
    const finalTags = [...suggestedTagsList];
    if (
      pendingClean &&
      !finalTags.some((t) => t.toLowerCase() === pendingClean.toLowerCase())
    ) {
      finalTags.push(pendingClean);
    }

    if (finalTags.length === 0) {
      setSuggestTagError('Lütfen en az bir yeni #etiket ekleyin.');
      return;
    }

    setTagSuggestModalVisible(false);
    Alert.alert(
      'Etiket Önerisi Alındı ✨',
      `${finalTags.map((t) => `#${t}`).join(', ')} etiket öneriniz incelendikten sonra "${selectedMeme.title}" meme'ine eklenecektir!`
    );
  };

  const getFormattedRating = (meme: MemeItem): string => {
    const userRated = userStarRatings[meme.id];
    const baseRating = meme.rating || 4.5;
    const count = meme.ratingCount || 25;
    const finalScore =
      userRated !== undefined
        ? (baseRating * count + userRated) / (count + 1)
        : baseRating;
    return finalScore.toFixed(1).replace('.', ',');
  };

  const activeMeme = selectedMeme || MOCK_MEMES[0];
  const activeMemeRating =
    userStarRatings[activeMeme.id] !== undefined
      ? userStarRatings[activeMeme.id]
      : Math.round(activeMeme.rating || 4);
  const isActiveMemeSaved = savedMemeIds.includes(activeMeme.id);
  const isOwnMeme =
    activeMeme.uploaderNickname.replace(/^@+/, '').trim().toLowerCase() ===
    userNickname.replace(/^@+/, '').trim().toLowerCase();
  const isPendingDelete = pendingDeleteMemeIds.includes(activeMeme.id);

  // Exact Masonry Pin design matching ExploreScreen.tsx
  const renderMasonryPin = (meme: MemeItem) => {
    const cardHeight = getPinHeight(meme);
    const formattedAvg = getFormattedRating(meme);
    const itemUploader = `@${meme.uploaderNickname || 'anonim'}`;
    const isMemePendingDelete = pendingDeleteMemeIds.includes(meme.id);

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

          {/* Top Right Uploader Handle on Pin (Exact match with ExploreScreen) */}
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

          {/* Pending Deletion Approval Badge (if requested) */}
          {isMemePendingDelete && (
            <View style={styles.pinPendingBadge} pointerEvents="none">
              <Clock size={10} color="#000000" strokeWidth={2.8} />
              <Text style={styles.pinPendingBadgeText}>Onay Bekliyor</Text>
            </View>
          )}

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

        {/* Clean Single-Line Caption Footer (Readable on Sunburst Background) */}
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
      <SunburstBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={pageScrollEnabled}
      >
        {/* Top Bar: Back Button + Centered "Meme'ini Bul" at same height + Gear Icon Only on Right */}
        <View style={styles.topHeaderRow}>
          <Pressable onPress={onBackToHome} style={styles.backBtn}>
            <CartoonCornerGloss size="sm" top={2.5} left={3} />
            <ArrowLeft size={22} color="#000000" strokeWidth={3} />
          </Pressable>

          <Pressable onPress={onBackToHome} style={styles.titleCenter}>
            <ColorfulTitle fontSize={32} />
          </Pressable>

          <Pressable onPress={handleOpenSettings} style={styles.settingsGearBtn}>
            <CartoonCornerGloss size="sm" top={2.5} left={3} />
            <Settings size={21} color="#000000" strokeWidth={2.8} />
          </Pressable>
        </View>

        {/* Cartoon User Profile Identity Card */}
        <CartoonCard
          borderRadius={24}
          shadowOffset={5}
          bgColor="#FFFDF7"
          style={styles.profileCardWrapper}
          contentStyle={styles.profileCardInner}
        >
          {/* Top Row: Avatar + Identity */}
          <View style={styles.profileIdentityRow}>
            <Pressable
              onPress={handleOpenEditProfile}
              style={styles.avatarContainer}
            >
              <View style={styles.avatarShadow} pointerEvents="none" />
              <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
                <CartoonCornerGloss size="sm" top={4} left={6} />
                <Text style={styles.avatarEmojiText}>{avatarEmoji}</Text>
              </View>
              <View style={styles.avatarEditMiniBadge}>
                <Edit3 size={11} color="#000000" strokeWidth={3} />
              </View>
            </Pressable>

            <View style={styles.identityTextColumn}>
              <Text style={styles.profileDisplayName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={styles.handlePill}>
                  <Text style={styles.handlePillText}>@{userNickname}</Text>
                </View>
                {isAdmin && (
                  <View style={styles.adminRolePill}>
                    <ShieldAlert size={12} color="#FFFFFF" strokeWidth={2.6} />
                    <Text style={styles.adminRolePillText}>YÖNETİCİ</Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileBioText} numberOfLines={3}>
                {bioText}
              </Text>
            </View>
          </View>

          {/* SwiftUI TabsPickerStyle Segmented Picker right below Bio (tiny padding: 4 + sliding thumb) */}
          <View style={styles.tabsPickerTrack}>
            <View
              style={styles.tabsSegmentsRow}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) {
                  segmentsWidthRef.current = w;
                  setSegmentsWidth(w);
                }
              }}
              {...pickerPanResponder.panHandlers}
            >
              {segmentsWidth > 0 && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.tabsPickerActiveThumb,
                    {
                      width: segmentsWidth / (isAdmin ? 4 : 3),
                      backgroundColor: isAdmin
                        ? activeAdminTab === 'approved_memes'
                          ? CARTOON_COLORS.green
                          : activeAdminTab === 'deleted_memes'
                          ? '#F87171'
                          : activeAdminTab === 'added_tags'
                          ? CARTOON_COLORS.cyan
                          : CARTOON_COLORS.orange
                        : activeCollectionTab === 'uploaded'
                        ? CARTOON_COLORS.yellow
                        : activeCollectionTab === 'starred'
                        ? CARTOON_COLORS.cyan
                        : CARTOON_COLORS.green,
                      transform: [
                        {
                          translateX: tabAnim.interpolate({
                            inputRange: isAdmin ? [0, 1, 2, 3] : [0, 1, 2],
                            outputRange: isAdmin
                              ? [
                                  0,
                                  segmentsWidth / 4,
                                  (segmentsWidth / 4) * 2,
                                  (segmentsWidth / 4) * 3,
                                ]
                              : [0, segmentsWidth / 3, (segmentsWidth / 3) * 2],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {isAdmin ? (
                <>
                  <Pressable
                    onPress={() => switchCollectionTab('approved_memes')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'approved_memes';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeAdminTab === 'approved_memes' && styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {adminHistory?.approvedMemes?.length || 0} ✓
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeAdminTab === 'approved_memes' && styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      Onaylanan
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchCollectionTab('deleted_memes')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'deleted_memes';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeAdminTab === 'deleted_memes' && styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {adminHistory?.deletedMemes?.length || 0} 🗑
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeAdminTab === 'deleted_memes' && styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      Silinen
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchCollectionTab('added_tags')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'added_tags';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeAdminTab === 'added_tags' && styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {adminHistory?.addedTags?.length || 0} 🏷
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeAdminTab === 'added_tags' && styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      Etiket
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchCollectionTab('reports_history')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'reports_history';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeAdminTab === 'reports_history' && styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {adminHistory?.reportsHistory?.length || 0} 🚩
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeAdminTab === 'reports_history' && styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      Rapor
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => switchCollectionTab('uploaded')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'uploaded';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeCollectionTab === 'uploaded' &&
                          styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {uploadedMemes.length}
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeCollectionTab === 'uploaded' &&
                          styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Eklediğim
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchCollectionTab('starred')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'starred';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeCollectionTab === 'starred' &&
                          styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {starredMemes.length} ★
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeCollectionTab === 'starred' &&
                          styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Yıldızlanan
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchCollectionTab('saved')}
                    onPressIn={() => {
                      touchDownTabRef.current = 'saved';
                    }}
                    style={styles.tabsPickerSegment}
                  >
                    <Text
                      style={[
                        styles.tabsPickerCountText,
                        activeCollectionTab === 'saved' &&
                          styles.tabsPickerCountActive,
                      ]}
                      numberOfLines={1}
                    >
                      {savedMemes.length} 📌
                    </Text>
                    <Text
                      style={[
                        styles.tabsPickerLabelText,
                        activeCollectionTab === 'saved' &&
                          styles.tabsPickerLabelActive,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Kaydedilme
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Quick Actions inside Profile Card */}
          <View style={styles.profileQuickActionsRow}>
            {isAdmin ? (
              <CartoonButton
                label="Meme Yönetimi"
                onPress={() => onTabPress('admin_manage')}
                bgColor={CARTOON_COLORS.orange}
                icon={<ShieldAlert size={15} color="#000000" strokeWidth={3.2} />}
                borderRadius={16}
                shadowSize={3}
                style={styles.profileAddMemeBtn}
                faceStyle={styles.profileActionFace}
                textStyle={styles.profileActionBtnText}
              />
            ) : (
              <CartoonButton
                label="Yeni Meme Ekle"
                onPress={() => onOpenAddMeme()}
                bgColor={CARTOON_COLORS.green}
                icon={<Plus size={15} color="#000000" strokeWidth={3.2} />}
                borderRadius={16}
                shadowSize={3}
                style={styles.profileAddMemeBtn}
                faceStyle={styles.profileActionFace}
                textStyle={styles.profileActionBtnText}
              />
            )}

            <CartoonButton
              label="Profili Düzenle"
              onPress={handleOpenEditProfile}
              bgColor={CARTOON_COLORS.pastelYellow}
              icon={<Edit3 size={15} color="#000000" strokeWidth={2.8} />}
              borderRadius={16}
              shadowSize={3}
              style={styles.profileEditBtn}
              faceStyle={styles.profileActionFace}
              textStyle={styles.profileActionBtnText}
            />
          </View>
        </CartoonCard>

        {/* ADMIN HISTORY FEED (When User is Admin) OR USER COLLECTION GRID */}
        {isAdmin ? (
          <View style={styles.adminHistoryContainer}>
            {isLoadingAdminHistory ? (
              <View style={styles.adminHistoryLoading}>
                <ActivityIndicator size="large" color={CARTOON_COLORS.orange} />
                <Text style={styles.adminHistoryLoadingText}>İşlem geçmişi yükleniyor...</Text>
              </View>
            ) : activeAdminTab === 'approved_memes' ? (
              /* ================= ONAYLANAN MEMELER GEÇMİŞİ ================= */
              (!adminHistory?.approvedMemes || adminHistory.approvedMemes.length === 0) ? (
                <CartoonCard
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor={CARTOON_COLORS.pastelYellow}
                  style={styles.emptyStateWrapper}
                  contentStyle={styles.emptyStateCard}
                >
                  <Text style={styles.emptyStateTitle}>Henüz Onaylanan Meme Yok!</Text>
                  <Text style={styles.emptyStateDesc}>Onaylanan tüm memeler işlem tarihiyle birlikte burada tutulur.</Text>
                </CartoonCard>
              ) : (
                adminHistory.approvedMemes.map((m) => (
                  <CartoonCard
                    key={m.id}
                    borderRadius={20}
                    shadowOffset={4}
                    bgColor="#FFFFFF"
                    style={styles.historyCardWrapper}
                    contentStyle={styles.historyCardContent}
                  >
                    <View style={styles.historyRow}>
                      <Image source={{ uri: m.mediaUrl }} style={styles.historyThumb as any} />
                      <View style={styles.historyInfo}>
                        <View style={styles.historyBadgeRow}>
                          <View style={[styles.historyStatusPill, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                            <CheckCircle2 size={12} color="#15803D" strokeWidth={2.6} />
                            <Text style={[styles.historyStatusText, { color: '#15803D' }]}>Onaylandı</Text>
                          </View>
                        </View>
                        <Text style={styles.historyTitle}>{m.title}</Text>
                        <View style={styles.historyMetaRow}>
                          <User size={12} color="#64748B" />
                          <Text style={styles.historyMetaText}>@{m.uploader.username}</Text>
                        </View>
                        <View style={styles.historyDateRow}>
                          <Clock size={12} color="#D97706" />
                          <Text style={styles.historyDateText}>Onay Zamanı: {formatActionDateTime(m.approvedAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </CartoonCard>
                ))
              )
            ) : activeAdminTab === 'deleted_memes' ? (
              /* ================= SİLİNEN MEMELER GEÇMİŞİ ================= */
              (!adminHistory?.deletedMemes || adminHistory.deletedMemes.length === 0) ? (
                <CartoonCard
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor={CARTOON_COLORS.pastelYellow}
                  style={styles.emptyStateWrapper}
                  contentStyle={styles.emptyStateCard}
                >
                  <Text style={styles.emptyStateTitle}>Henüz Silinen Meme Kaydı Yok!</Text>
                  <Text style={styles.emptyStateDesc}>Onaylanıp silinen memeler işlem tarihi ve gerekçesiyle burada listelenir.</Text>
                </CartoonCard>
              ) : (
                adminHistory.deletedMemes.map((item) => (
                  <CartoonCard
                    key={item.id}
                    borderRadius={20}
                    shadowOffset={4}
                    bgColor="#FFFFFF"
                    style={styles.historyCardWrapper}
                    contentStyle={styles.historyCardContent}
                  >
                    <View style={styles.historyRow}>
                      {item.meme?.mediaUrl ? (
                        <Image source={{ uri: item.meme.mediaUrl }} style={styles.historyThumb as any} />
                      ) : (
                        <View style={[styles.historyThumb, { backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }]}>
                          <Trash2 size={24} color="#DC2626" />
                        </View>
                      )}
                      <View style={styles.historyInfo}>
                        <View style={styles.historyBadgeRow}>
                          <View style={[styles.historyStatusPill, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                            <Trash2 size={12} color="#B91C1C" strokeWidth={2.6} />
                            <Text style={[styles.historyStatusText, { color: '#B91C1C' }]}>Silindi</Text>
                          </View>
                        </View>
                        <Text style={styles.historyTitle}>{item.meme?.title || 'Silinen Meme'}</Text>
                        <View style={styles.historyReasonBox}>
                          <Text style={styles.historyReasonLabel}>Neden: {item.reason}</Text>
                        </View>
                        {item.note ? (
                          <Text style={styles.historyNoteText} numberOfLines={2}>Not: {item.note}</Text>
                        ) : null}
                        <View style={styles.historyMetaRow}>
                          <User size={12} color="#64748B" />
                          <Text style={styles.historyMetaText}>Talep Eden: @{item.user.username}</Text>
                        </View>
                        <View style={styles.historyDateRow}>
                          <Clock size={12} color="#DC2626" />
                          <Text style={styles.historyDateText}>Silinme Zamanı: {formatActionDateTime(item.updatedAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </CartoonCard>
                ))
              )
            ) : activeAdminTab === 'added_tags' ? (
              /* ================= EKLENEN ETİKETLER GEÇMİŞİ ================= */
              (!adminHistory?.addedTags || adminHistory.addedTags.length === 0) ? (
                <CartoonCard
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor={CARTOON_COLORS.pastelYellow}
                  style={styles.emptyStateWrapper}
                  contentStyle={styles.emptyStateCard}
                >
                  <Text style={styles.emptyStateTitle}>Henüz Eklenen Etiket Kaydı Yok!</Text>
                  <Text style={styles.emptyStateDesc}>Onaylanan etiket önerileri eklenme zamanıyla burada tutulur.</Text>
                </CartoonCard>
              ) : (
                adminHistory.addedTags.map((item) => (
                  <CartoonCard
                    key={item.id}
                    borderRadius={20}
                    shadowOffset={4}
                    bgColor="#FFFFFF"
                    style={styles.historyCardWrapper}
                    contentStyle={styles.historyCardContent}
                  >
                    <View style={styles.historyRow}>
                      <Image source={{ uri: item.meme.mediaUrl }} style={styles.historyThumb as any} />
                      <View style={styles.historyInfo}>
                        <View style={styles.historyBadgeRow}>
                          <View style={[styles.historyStatusPill, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }]}>
                            <Tag size={12} color="#0284C7" strokeWidth={2.6} />
                            <Text style={[styles.historyStatusText, { color: '#0284C7' }]}>Etiket Eklendi</Text>
                          </View>
                        </View>
                        <View style={styles.tagHighlightRow}>
                          <Text style={styles.tagHighlightText}>#{item.tagName}</Text>
                        </View>
                        <Text style={styles.historyTitle} numberOfLines={1}>{item.meme.title}</Text>
                        <View style={styles.historyMetaRow}>
                          <User size={12} color="#64748B" />
                          <Text style={styles.historyMetaText}>Öneren: @{item.user.username}</Text>
                        </View>
                        <View style={styles.historyDateRow}>
                          <Clock size={12} color="#0284C7" />
                          <Text style={styles.historyDateText}>Eklenme Zamanı: {formatActionDateTime(item.updatedAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </CartoonCard>
                ))
              )
            ) : (
                /* ================= RAPORLARIN GEÇMİŞİ ================= */
                (!adminHistory?.reportsHistory || adminHistory.reportsHistory.length === 0) ? (
                  <CartoonCard
                    borderRadius={20}
                    shadowOffset={4}
                    bgColor={CARTOON_COLORS.pastelYellow}
                    style={styles.emptyStateWrapper}
                    contentStyle={styles.emptyStateCard}
                  >
                    <Text style={styles.emptyStateTitle}>Henüz Sonuçlanan Rapor Yok!</Text>
                    <Text style={styles.emptyStateDesc}>Çözülen veya kapatılan şikayetler işlem zamanıyla burada listelenir.</Text>
                  </CartoonCard>
                ) : (
                  adminHistory.reportsHistory.map((rep) => {
                    const isResolved = rep.status === 'RESOLVED';
                    return (
                      <CartoonCard
                        key={rep.id}
                        borderRadius={20}
                        shadowOffset={4}
                        bgColor="#FFFFFF"
                        style={styles.historyCardWrapper}
                        contentStyle={styles.historyCardContent}
                      >
                        <View style={styles.historyRow}>
                          <Image source={{ uri: rep.meme.mediaUrl }} style={styles.historyThumb as any} />
                          <View style={styles.historyInfo}>
                            <View style={styles.historyBadgeRow}>
                              <View
                                style={[
                                  styles.historyStatusPill,
                                  isResolved
                                    ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                                    : { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.historyStatusText,
                                    isResolved ? { color: '#15803D' } : { color: '#475569' },
                                  ]}
                                >
                                  {isResolved ? 'Çözüldü ✅' : 'Geçersiz Sayıldı ✕'}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.historyTitle}>{rep.meme.title}</Text>
                            <View style={[styles.historyReasonBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                              <Text style={[styles.historyReasonLabel, { color: '#92400E' }]}>
                                Şikayet: {rep.reason}
                              </Text>
                            </View>
                            {rep.description ? (
                              <Text style={styles.historyNoteText} numberOfLines={2}>Açıklama: {rep.description}</Text>
                            ) : null}
                            <View style={styles.historyMetaRow}>
                              <User size={12} color="#64748B" />
                              <Text style={styles.historyMetaText}>Raporlayan: @{rep.reporter.username}</Text>
                            </View>
                            <View style={styles.historyDateRow}>
                              <Clock size={12} color="#64748B" />
                              <Text style={styles.historyDateText}>İşlem Zamanı: {formatActionDateTime(rep.updatedAt)}</Text>
                            </View>
                          </View>
                        </View>
                      </CartoonCard>
                    );
                  })
                )
              )}
          </View>
        ) : (
          /* Regular User Collection: Tags + Pinterest Masonry Grid */
          <>
            {orderedCollectionTags.length > 0 && (
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
                {orderedCollectionTags.map((tag, idx) => {
                  const isTagSelected = selectedTags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <CartoonBadge
                      key={`profile-tag-${tag}`}
                      tag={tag}
                      index={idx}
                      selected={isTagSelected}
                      onPress={() => handleToggleTagFilter(tag)}
                    />
                  );
                })}
              </ScrollView>
            )}

            {/* Pinterest Staggered 2-Column Masonry Grid (Exact match with ExploreScreen) */}
            <View style={{ width: '100%', alignItems: 'center' }}>
              {displayedMemes.length === 0 ? (
                <CartoonCard
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor={CARTOON_COLORS.pastelYellow}
                  style={styles.emptyStateWrapper}
                  contentStyle={styles.emptyStateCard}
                >
                  <Text style={styles.emptyStateTitle}>
                    {activeCollectionTab === 'uploaded'
                      ? 'Henüz eklediğin bir meme yok!'
                      : activeCollectionTab === 'starred'
                      ? 'Henüz yıldızladığın bir meme yok!'
                      : 'Henüz kaydedilen bir meme yok!'}
                  </Text>
                  <Text style={styles.emptyStateDesc}>
                    {activeCollectionTab === 'uploaded'
                      ? 'Hemen kendi meme’ini yükleyip koleksiyonunu başlatabilirsin.'
                      : 'Keşfet veya Arama ekranından beğendiğin memeleri kaydedebilirsin.'}
                  </Text>
                  <CartoonButton
                    label={
                      activeCollectionTab === 'uploaded'
                        ? 'Yeni Meme Ekle'
                        : 'Keşfet’e Göz At'
                    }
                    onPress={() =>
                      activeCollectionTab === 'uploaded'
                        ? onOpenAddMeme(selectedTags[0] || '')
                        : onTabPress('explore')
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
                  <View style={styles.masonryColumn}>
                    {leftColumn.map(renderMasonryPin)}
                  </View>
                  <View style={styles.masonryColumn}>
                    {rightColumn.map(renderMasonryPin)}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Settings (Gear Icon) Modal: Password Change, Account, Notifications */}
      <Modal
        visible={settingsModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reportOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSettingsModalVisible(false)}
          />
          <View style={styles.reportCardWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.reportCardBody}>
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View
                    style={[
                      styles.reportBadgeIcon,
                      { backgroundColor: CARTOON_COLORS.cyan },
                    ]}
                  >
                    <Settings size={16} color="#000000" strokeWidth={2.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>Hesap Ayarları</Text>
                    <Text style={styles.reportModalSubtitle}>@{userNickname}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setSettingsModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* E-posta Bilgisi */}
                <View style={styles.settingsSectionHeader}>
                  <Mail size={15} color="#000000" strokeWidth={2.8} />
                  <Text style={styles.reportSectionLabel}>E-posta Adresi</Text>
                </View>
                <View style={styles.editFieldBox}>
                  <TextInput
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    placeholder="ornek@eposta.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                {/* Şifre Değiştirme Alanı */}
                <View style={styles.settingsSectionHeader}>
                  <Lock size={15} color="#000000" strokeWidth={2.8} />
                  <Text style={styles.reportSectionLabel}>Şifre Değiştir</Text>
                </View>

                <View style={styles.editFieldBox}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={(v) => {
                      setCurrentPassword(v);
                      setPasswordError(null);
                      setPasswordMessage(null);
                    }}
                    placeholder="Mevcut şifreniz"
                    secureTextEntry
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                <View style={styles.editFieldBox}>
                  <TextInput
                    value={newPassword}
                    onChangeText={(v) => {
                      setNewPassword(v);
                      setPasswordError(null);
                      setPasswordMessage(null);
                    }}
                    placeholder="Yeni şifre (en az 6 karakter)"
                    secureTextEntry
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                <View style={styles.editFieldBox}>
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={(v) => {
                      setConfirmNewPassword(v);
                      setPasswordError(null);
                      setPasswordMessage(null);
                    }}
                    placeholder="Yeni şifre tekrar"
                    secureTextEntry
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                {passwordError ? (
                  <Text style={styles.reportErrorText}>{passwordError}</Text>
                ) : null}

                {passwordMessage ? (
                  <Text style={styles.passwordSuccessText}>{passwordMessage}</Text>
                ) : null}

                <CartoonButton
                  label="Şifreyi Güncelle"
                  onPress={handleUpdatePassword}
                  bgColor={CARTOON_COLORS.green}
                  icon={<Check size={16} color="#000000" strokeWidth={3.2} />}
                  borderRadius={16}
                  shadowSize={3}
                  style={styles.reportSubmitBtn}
                  faceStyle={styles.reportSubmitFace}
                />

                {/* Bildirim Ayarı */}
                <Pressable
                  onPress={() => setNotificationsEnabled((prev) => !prev)}
                  style={styles.notificationToggleRow}
                >
                  <View style={styles.notificationLabelGroup}>
                    <Bell size={16} color="#000000" strokeWidth={2.8} />
                    <Text style={styles.notificationToggleText}>
                      Etiket & Onay Bildirimleri
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.togglePill,
                      notificationsEnabled
                        ? { backgroundColor: CARTOON_COLORS.green }
                        : { backgroundColor: '#CBD5E1' },
                    ]}
                  >
                    <Text style={styles.togglePillText}>
                      {notificationsEnabled ? 'AÇIK' : 'KAPALI'}
                    </Text>
                  </View>
                </Pressable>

                <CartoonButton
                  label="Hesaptan Çıkış Yap"
                  onPress={() => {
                    setSettingsModalVisible(false);
                    if (onLogout) {
                      onLogout();
                    } else {
                      Alert.alert(
                        'Çıkış Yapıldı 👋',
                        'Oturumunuz güvenli bir şekilde kapatıldı.'
                      );
                    }
                  }}
                  bgColor={CARTOON_COLORS.pastelPink}
                  icon={<LogOut size={16} color="#000000" strokeWidth={2.8} />}
                  borderRadius={16}
                  shadowSize={2.5}
                  style={[styles.reportSubmitBtn, { marginTop: 8 }]}
                  faceStyle={styles.reportSubmitFace}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reportOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditModalVisible(false)}
          />
          <View style={styles.reportCardWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.reportCardBody}>
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View
                    style={[
                      styles.reportBadgeIcon,
                      { backgroundColor: CARTOON_COLORS.cyan },
                    ]}
                  >
                    <Edit3 size={16} color="#000000" strokeWidth={2.8} />
                  </View>
                  <Text style={styles.reportModalTitle}>Profili Düzenle</Text>
                </View>

                <Pressable
                  onPress={() => setEditModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.reportSectionLabel}>Avatar Seç</Text>
                <View style={styles.avatarPickerRow}>
                  {AVATAR_EMOJIS.map((emoji) => {
                    const isSelected = draftAvatarEmoji === emoji;
                    return (
                      <Pressable
                        key={emoji}
                        onPress={() => setDraftAvatarEmoji(emoji)}
                        style={[
                          styles.avatarOptionBtn,
                          isSelected && styles.avatarOptionBtnSelected,
                        ]}
                      >
                        <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.reportSectionLabel}>Avatar Rengi</Text>
                <View style={styles.colorPickerRow}>
                  {AVATAR_BG_COLORS.map((color) => {
                    const isSelected = draftAvatarBg === color;
                    return (
                      <Pressable
                        key={color}
                        onPress={() => setDraftAvatarBg(color)}
                        style={[
                          styles.colorCircleBtn,
                          { backgroundColor: color },
                          isSelected && styles.colorCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Check size={14} color="#000000" strokeWidth={3.2} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.reportSectionLabel}>Görünen İsim</Text>
                <View style={styles.editFieldBox}>
                  <TextInput
                    value={draftDisplayName}
                    onChangeText={setDraftDisplayName}
                    placeholder="Örn: Enes Pınar"
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                <Text style={styles.reportSectionLabel}>Kullanıcı Adı (@)</Text>
                <View style={styles.editFieldBox}>
                  <TextInput
                    value={draftHandle}
                    onChangeText={setDraftHandle}
                    placeholder="enes"
                    autoCapitalize="none"
                    placeholderTextColor="#777777"
                    style={styles.editFieldInput}
                  />
                </View>

                <Text style={styles.reportSectionLabel}>Kısa Biyografi</Text>
                <View style={styles.reportInputWrapper}>
                  <TextInput
                    value={draftBio}
                    onChangeText={setDraftBio}
                    placeholder="Hangi durumlarda hangi memeleri kullanırsın?"
                    placeholderTextColor="#777777"
                    multiline
                    numberOfLines={3}
                    style={styles.reportTextArea}
                  />
                </View>

                <CartoonButton
                  label="Değişiklikleri Kaydet"
                  onPress={handleSaveProfile}
                  bgColor={CARTOON_COLORS.green}
                  icon={<Check size={17} color="#000000" strokeWidth={3.2} />}
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

      {/* Meme Detail Popup Modal (Report Button moved to Top Header Row) */}
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
              {/* Header: Full Meme Title + Report (and Delete if own meme) + Close */}
              <View style={styles.detailHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailModalTitle}>
                    {activeMeme.title}
                  </Text>
                  <Text style={styles.detailUploaderSub} numberOfLines={1}>
                    @{activeMeme.uploaderNickname.replace(/^@+/, '')}
                    {isPendingDelete ? ' • Silme Onayı Bekliyor ⏳' : ''}
                  </Text>
                </View>

                {isOwnMeme && (
                  <Pressable
                    onPress={() => handleRequestDeleteMeme(activeMeme)}
                    style={[
                      styles.detailDeleteMiniBtn,
                      isPendingDelete && { backgroundColor: CARTOON_COLORS.orange },
                    ]}
                  >
                    {isPendingDelete ? (
                      <Clock size={15} color="#000000" strokeWidth={2.8} />
                    ) : (
                      <Trash2 size={15} color="#FFFFFF" strokeWidth={2.8} />
                    )}
                  </Pressable>
                )}

                {!isOwnMeme && activeCollectionTab !== 'uploaded' && (
                  <Pressable
                    onPress={() => handleOpenReportModal(activeMeme)}
                    style={styles.detailReportMiniBtn}
                  >
                    <CartoonCornerGloss size="xs" top={2} left={2} />
                    <Flag size={15} color="#FFFFFF" strokeWidth={2.8} />
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              {/* Meme Media Preview Card */}
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

              {/* 5-Star Rating + Save & Share Actions (No overflow!) */}
              <View style={styles.detailActionsRow}>
                <StarRating
                  initialRating={activeMemeRating}
                  onRate={(r) => handleRateMeme(activeMeme.id, r)}
                  size={22}
                />

                <View style={styles.footerActionsGroup}>
                  <CartoonButton
                    onPress={() => onToggleSaveMeme(activeMeme.id)}
                    bgColor={
                      isActiveMemeSaved
                        ? CARTOON_COLORS.green
                        : CARTOON_COLORS.yellow
                    }
                    icon={
                      <Bookmark
                        size={15}
                        color="#000000"
                        fill={isActiveMemeSaved ? '#000000' : 'none'}
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
                    key={`prof-detail-${tag}`}
                    tag={tag}
                    index={idx}
                    onPress={() => {
                      setDetailModalVisible(false);
                      onSearchTagOrQuery(tag);
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

      {/* Delete Meme System Approval Modal ("Meme Silme Talebi") */}
      <Modal
        visible={deleteRequestModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setDeleteRequestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reportOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteRequestModalVisible(false)}
          />
          <View style={styles.reportCardWrapper}>
            <View style={styles.reportCardShadow} pointerEvents="none" />
            <View style={styles.reportCardBody}>
              <View style={styles.reportHeaderRow}>
                <View style={styles.reportHeaderTitleGroup}>
                  <View style={styles.reportBadgeIcon}>
                    <Trash2 size={16} color="#FFFFFF" strokeWidth={2.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>Meme Silme Talebi</Text>
                    <Text style={styles.reportModalSubtitle}>
                      {activeMeme.title}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setDeleteRequestModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <X size={18} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.reportScrollArea}
                contentContainerStyle={styles.reportScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.suggestInfoBanner}>
                  <CartoonCornerGloss size="xs" top={2} left={3} />
                  <Info size={18} color="#000000" strokeWidth={2.6} />
                  <Text style={styles.suggestInfoText}>
                    Eklediğiniz memelerin silinmesi için sistem (yönetici) onayı
                    gerekmektedir. Talebiniz onaylandığında meme kaldırılacaktır.
                  </Text>
                </View>

                <Text style={styles.reportSectionLabel}>Silme Nedeni</Text>
                <View style={styles.reasonsList}>
                  {DELETE_REQUEST_REASONS.map((reason) => {
                    const isSelected = selectedDeleteReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        onPress={() => setSelectedDeleteReason(reason)}
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

                <Text style={styles.reportSectionLabel}>Ek Not (İsteğe Bağlı)</Text>
                <View style={styles.reportInputWrapper}>
                  <TextInput
                    value={deleteNote}
                    onChangeText={setDeleteNote}
                    placeholder="Sistem yöneticisine iletmek istediğiniz not..."
                    placeholderTextColor="#777777"
                    multiline
                    numberOfLines={2}
                    style={styles.reportTextArea}
                  />
                </View>

                <CartoonButton
                  label="Silme Onayına Gönder"
                  onPress={handleSubmitDeleteRequest}
                  bgColor="#EF4444"
                  textColor="#FFFFFF"
                  icon={<Trash2 size={16} color="#FFFFFF" strokeWidth={2.6} />}
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
                @{activeMeme.uploaderNickname.replace(/^@+/, '')}
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
            <View style={styles.fullscreenActionRow}>
              <CartoonButton
                onPress={() => onToggleSaveMeme(activeMeme.id)}
                bgColor={
                  isActiveMemeSaved
                    ? CARTOON_COLORS.green
                    : CARTOON_COLORS.yellow
                }
                icon={
                  <Bookmark
                    size={18}
                    color="#000000"
                    fill={isActiveMemeSaved ? '#000000' : 'none'}
                    strokeWidth={2.8}
                  />
                }
                borderRadius={16}
                shadowSize={3}
                style={styles.fullscreenReportBtn}
                faceStyle={styles.fullscreenReportFace}
              />

              {!isOwnMeme && activeCollectionTab !== 'uploaded' && (
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
              )}

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

      {/* Report Meme Modal (Shows Meme Title underneath "Meme'i Bildir") */}
      <Modal
        visible={reportModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reportOverlay}
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
                    <Text style={styles.reportModalSubtitle}>
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
          style={styles.reportOverlay}
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

                <View style={styles.suggestInputRow}>
                  <View style={styles.suggestTextInputBox}>
                    <Text style={styles.suggestHashPrefix}>#</Text>
                    <TextInput
                      value={suggestTagInput}
                      onChangeText={(txt) => {
                        if (txt.includes(',')) {
                          const parts = txt.split(',');
                          const lastPart = parts.pop() || '';
                          addSuggestedTag(parts.join(','));
                          setSuggestTagInput(lastPart);
                        } else {
                          setSuggestTagInput(txt);
                        }
                        setSuggestTagError(null);
                      }}
                      onSubmitEditing={() => {
                        if (suggestTagInput.trim()) {
                          addSuggestedTag(suggestTagInput);
                          setSuggestTagInput('');
                        }
                      }}
                      placeholder="yeni_etiket yazın..."
                      placeholderTextColor="#777777"
                      style={styles.suggestTextInput}
                      returnKeyType="done"
                    />
                  </View>

                  <CartoonButton
                    label="Ekle"
                    onPress={() => {
                      if (suggestTagInput.trim()) {
                        addSuggestedTag(suggestTagInput);
                        setSuggestTagInput('');
                      }
                    }}
                    bgColor={CARTOON_COLORS.yellow}
                    borderRadius={16}
                    shadowSize={2.5}
                    faceStyle={styles.suggestAddBtnFace}
                    textStyle={styles.suggestAddBtnText}
                  />
                </View>

                {suggestTagError ? (
                  <Text style={styles.reportErrorText}>{suggestTagError}</Text>
                ) : null}

                <CartoonButton
                  label="Öneriyi Gönder"
                  onPress={handleSubmitTagSuggestions}
                  bgColor={CARTOON_COLORS.green}
                  icon={<Check size={17} color="#000000" strokeWidth={3.2} />}
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

      <BottomNavBar activeTab="profile" onTabPress={onTabPress} isAdmin={isAdmin} />
    </View>
  );
};

const styles = StyleSheet.create({
  adminRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  adminRolePillText: {
    ...CARTOON_FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  adminHistoryContainer: {
    width: '100%',
    maxWidth: 366,
    gap: 10,
    marginTop: 10,
    paddingBottom: 20,
  },
  adminHistoryLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  adminHistoryLoadingText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 14,
    color: '#475569',
    marginTop: 10,
  },
  historyCardWrapper: {
    width: '100%',
    marginBottom: 4,
  },
  historyCardContent: {
    padding: 12,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  historyThumb: {
    width: 82,
    height: 82,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#E2E8F0',
  },
  historyInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  historyBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  historyStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  historyStatusText: {
    ...CARTOON_FONTS.bold,
    fontSize: 11,
  },
  historyTitle: {
    ...CARTOON_FONTS.bold,
    fontSize: 14,
    color: '#000000',
    lineHeight: 18,
  },
  historyReasonBox: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignSelf: 'flex-start',
    marginVertical: 3,
  },
  historyReasonLabel: {
    ...CARTOON_FONTS.bold,
    fontSize: 11,
    color: '#B91C1C',
  },
  historyNoteText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 11,
    color: '#475569',
    marginVertical: 2,
    lineHeight: 14,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  historyMetaText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 11,
    color: '#64748B',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historyDateText: {
    ...CARTOON_FONTS.bold,
    fontSize: 11,
    color: '#1E293B',
  },
  tagHighlightRow: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  tagHighlightText: {
    ...CARTOON_FONTS.bold,
    fontSize: 13,
    color: '#0284C7',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 120,
    alignItems: 'center',
  },
  topHeaderRow: {
    width: '100%',
    maxWidth: 366,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  settingsGearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardWrapper: {
    width: '100%',
    maxWidth: 366,
    marginBottom: 12,
  },
  profileCardInner: {
    padding: 16,
  },
  profileIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    position: 'relative',
  },
  avatarShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 38,
    backgroundColor: '#000000',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmojiText: {
    fontSize: 36,
  },
  avatarEditMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  identityTextColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileDisplayName: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 20,
    color: '#000000',
  },
  handlePill: {
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginTop: 2,
    marginBottom: 5,
  },
  handlePillText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12,
    color: '#000000',
  },
  profileBioText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#334155',
  },
  tabsPickerTrack: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tabsSegmentsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabsPickerActiveThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  tabsPickerSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 12,
    zIndex: 2,
  },
  tabsPickerCountText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 15,
    color: '#475569',
  },
  tabsPickerCountActive: {
    color: '#000000',
  },
  tabsPickerLabelText: {
    ...CARTOON_FONTS.bold,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  tabsPickerLabelActive: {
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
  },
  profileQuickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAddMemeBtn: {
    flex: 1,
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  profileEditBtn: {
    flex: 1,
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  profileActionFace: {
    width: '100%',
    height: 42,
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
  collectionTabsRow: {
    width: '100%',
    maxWidth: 366,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  collectionTabWrap: {
    flex: 1,
    position: 'relative',
  },
  collectionTabShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  collectionTabShadowActive: {
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
  },
  collectionTabFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 6,
  },
  collectionTabText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 11.5,
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
  /* Exact ExploreScreen Masonry Pin Styles */
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
  pinPendingBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: CARTOON_COLORS.orange,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pinPendingBadgeText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 9.5,
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
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2.5,
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
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  passwordSuccessText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 12.5,
    color: '#16A34A',
    marginBottom: 8,
  },
  notificationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  notificationLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notificationToggleText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
    color: '#000000',
  },
  togglePill: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  togglePillText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 11,
    color: '#000000',
  },
  avatarPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 12,
  },
  avatarOptionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionBtnSelected: {
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 3,
  },
  avatarOptionEmoji: {
    fontSize: 22,
  },
  colorPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 12,
  },
  colorCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
  },
  editFieldBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    justifyContent: 'center',
    marginBottom: 10,
  },
  editFieldInput: {
    ...CARTOON_FONTS.bold,
    fontSize: 14,
    color: '#000000',
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
  detailDeleteMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailReportMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
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
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 2.5,
  },
  suggestPlusCartoonBtn: {
    alignSelf: 'center',
  },
  suggestPlusCartoonFace: {
    width: 32,
    height: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 2,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 28, 0.96)',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fullscreenImage: {
    width: '100%',
  },
  fullscreenBottomBar: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fullscreenActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullscreenReportBtn: {
    alignSelf: 'center',
  },
  fullscreenReportFace: {
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
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
    right: -5,
    bottom: -5,
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
    marginBottom: 4,
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
  suggestInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARTOON_COLORS.pastelYellow,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  suggestInfoText: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 12,
    color: '#000000',
    flex: 1,
  },
  suggestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestTextInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 40,
  },
  suggestHashPrefix: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 16,
    color: '#000000',
    marginRight: 4,
  },
  suggestTextInput: {
    flex: 1,
    ...CARTOON_FONTS.bold,
    fontSize: 14,
    color: '#000000',
  },
  suggestAddBtnFace: {
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 14,
  },
  suggestAddBtnText: {
    fontSize: 13,
  },
});
