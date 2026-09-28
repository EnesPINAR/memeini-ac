import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  PanResponder,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  Flag,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Sparkles,
  User,
  MessageSquare,
  Maximize2,
  Edit3,
  X,
  Plus,
} from 'lucide-react-native';

import {
  CartoonCard,
  CartoonButton,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import {
  adminApi,
  AdminDeleteRequest,
  AdminSuggestedTag,
  AdminReport,
  AdminStats,
} from '../services/api';

type AdminTab = 'upload_requests' | 'delete_requests' | 'suggested_tags' | 'reports';

const TAB_ORDER: AdminTab[] = [
  'upload_requests',
  'delete_requests',
  'suggested_tags',
  'reports',
];

interface AdminManagementScreenProps {
  onBackToHome: () => void;
  onTabPress: (tab: TabType) => void;
}

// Sample prepared upload requests for Tab 1
interface MockUploadRequest {
  id: string;
  title: string;
  uploaderName: string;
  tags: string[];
  imageUrl: string;
  submittedAt: string;
}

const PREPARED_UPLOAD_REQUESTS: MockUploadRequest[] = [
  {
    id: 'req-1',
    title: 'Pazartesi Kahvesi Olmadan Asla',
    uploaderName: 'enes',
    tags: ['kahve', 'pazartesi', 'ofis', 'komik'],
    imageUrl:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&auto=format&fit=crop&q=80',
    submittedAt: 'Bugün, 22:45',
  },
  {
    id: 'req-2',
    title: 'Prod Ortamında Hotfix Atınca Ben',
    uploaderName: 'dev_mehmet',
    tags: ['yazılımcı', 'hotfix', 'prod', 'stres'],
    imageUrl:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=480&auto=format&fit=crop&q=80',
    submittedAt: 'Bugün, 21:10',
  },
];

const DISMISS_REASON_OPTIONS = [
  'Telif Hakkı İhlali Yok / Telif Bildirimi Geçersiz',
  'Topluluk Kurallarını İhlal Etmiyor',
  'Mizah / Parodi / İroni Kapsamında Kabul Edildi',
  'Yetersiz / Asılsız Şikayet',
  'Diğer (Özel Açıklama)',
];

export const AdminManagementScreen: React.FC<AdminManagementScreenProps> = ({
  onBackToHome,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();

  // Active Tab & TabsPicker State
  const [activeTab, setActiveTab] = useState<AdminTab>('delete_requests');
  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  const tabAnim = useRef(new Animated.Value(1)).current; // default to delete_requests (idx: 1)
  const activeTabRef = useRef<AdminTab>('delete_requests');
  const touchDownTabRef = useRef<AdminTab>('delete_requests');
  const dragStartIdxRef = useRef(1);
  const [segmentsWidth, setSegmentsWidth] = useState(0);
  const segmentsWidthRef = useRef(0);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [deleteRequests, setDeleteRequests] = useState<AdminDeleteRequest[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<AdminSuggestedTag[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [mockUploads, setMockUploads] = useState<MockUploadRequest[]>(PREPARED_UPLOAD_REQUESTS);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Fullscreen Viewer State
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; title: string } | null>(null);

  // Edit Upload Request State (Tab 1)
  const [editingUpload, setEditingUpload] = useState<MockUploadRequest | null>(null);
  const [editUploadTitle, setEditUploadTitle] = useState('');
  const [editUploadTags, setEditUploadTags] = useState<string[]>([]);
  const [newUploadTagInput, setNewUploadTagInput] = useState('');

  // Edit Reported Meme State (Tab 4)
  const [editingReport, setEditingReport] = useState<AdminReport | null>(null);
  const [editReportTitle, setEditReportTitle] = useState('');
  const [editReportTags, setEditReportTags] = useState<string[]>([]);
  const [newReportTagInput, setNewReportTagInput] = useState('');
  const [isSavingReportEdit, setIsSavingReportEdit] = useState(false);

  // Dismiss Report with Reason State (Tab 4)
  const [dismissReportTarget, setDismissReportTarget] = useState<AdminReport | null>(null);
  const [selectedDismissReason, setSelectedDismissReason] = useState<string>(DISMISS_REASON_OPTIONS[0]);
  const [customDismissNote, setCustomDismissNote] = useState('');
  const [isDismissingReport, setIsDismissingReport] = useState(false);

  // Tabs navigation
  const switchTab = useCallback(
    (nextTab: AdminTab) => {
      const targetIdx = TAB_ORDER.indexOf(nextTab);
      if (targetIdx === -1) return;
      activeTabRef.current = nextTab;
      touchDownTabRef.current = nextTab;
      setActiveTab(nextTab);

      Animated.spring(tabAnim, {
        toValue: targetIdx,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    },
    [tabAnim]
  );

  // PanResponder matching ProfileScreen exactly
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
          const startTab = touchDownTabRef.current || activeTabRef.current;
          const startIdx = TAB_ORDER.indexOf(startTab);
          dragStartIdxRef.current = startIdx >= 0 ? startIdx : 0;
          tabAnim.stopAnimation();
          tabAnim.setValue(dragStartIdxRef.current);
          if (startTab !== activeTabRef.current) {
            activeTabRef.current = startTab;
            setActiveTab(startTab);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const totalW = segmentsWidthRef.current || 320;
          const segW = totalW / 4;
          const currentIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const clampedIdx = Math.max(0, Math.min(3, currentIdx));
          tabAnim.setValue(clampedIdx);
        },
        onPanResponderRelease: (_, gestureState) => {
          setPageScrollEnabled(true);
          const totalW = segmentsWidthRef.current || 320;
          const segW = totalW / 4;
          const rawIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const snappedIdx = Math.round(Math.max(0, Math.min(3, rawIdx)));
          switchTab(TAB_ORDER[snappedIdx]);
        },
        onPanResponderTerminate: () => {
          setPageScrollEnabled(true);
          const currentIdx = TAB_ORDER.indexOf(activeTabRef.current);
          switchTab(TAB_ORDER[currentIdx >= 0 ? currentIdx : 0]);
        },
      }),
    [switchTab, tabAnim]
  );

  // Load Data
  const loadAdminData = useCallback(async () => {
    try {
      const [statsData, deleteData, tagsData, reportsData] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getDeleteRequests('PENDING').catch(() => []),
        adminApi.getSuggestedTags('PENDING').catch(() => []),
        adminApi.getReports('PENDING').catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setDeleteRequests(deleteData || []);
      setSuggestedTags(tagsData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAdminData();
  };

  // ==================== TAB 1 ACTIONS (UPLOAD REQUESTS) ====================

  const handleOpenEditUpload = (item: MockUploadRequest) => {
    setEditingUpload(item);
    setEditUploadTitle(item.title);
    setEditUploadTags([...item.tags]);
    setNewUploadTagInput('');
  };

  const handleRemoveUploadTag = (tagToRemove: string) => {
    setEditUploadTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleAddUploadTag = () => {
    const clean = newUploadTagInput.trim().replace(/^#+/, '').toLowerCase();
    if (!clean) return;
    if (!editUploadTags.includes(clean)) {
      setEditUploadTags((prev) => [...prev, clean]);
    }
    setNewUploadTagInput('');
  };

  const handleSaveUploadEdit = (autoApprove: boolean = false) => {
    if (!editingUpload) return;
    if (!editUploadTitle.trim()) {
      Alert.alert('Uyarı', 'Lütfen meme için bir başlık girin.');
      return;
    }

    const updatedList = mockUploads.map((item) => {
      if (item.id === editingUpload.id) {
        return {
          ...item,
          title: editUploadTitle.trim(),
          tags: editUploadTags,
        };
      }
      return item;
    });

    if (autoApprove) {
      setMockUploads(updatedList.filter((item) => item.id !== editingUpload.id));
      setEditingUpload(null);
      Alert.alert(
        'Onaylandı ve Yayına Alındı! 🚀',
        `"${editUploadTitle.trim()}" güncellendi ve yayına alındı.`
      );
    } else {
      setMockUploads(updatedList);
      setEditingUpload(null);
      Alert.alert('Kaydedildi', 'Meme bilgileri ve etiketleri güncellendi.');
    }
  };

  const handleApproveMockUpload = (id: string, title: string) => {
    Alert.alert('Meme Ekleme Onayı', `"${title}" başlıklı meme onaylanıp yayına alınsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla ve Yayınla',
        onPress: () => {
          setMockUploads((prev) => prev.filter((item) => item.id !== id));
          Alert.alert('Başarılı! 🎉', 'Meme onaylandı ve keşfet akışına dahil edildi.');
        },
      },
    ]);
  };

  const handleRejectMockUpload = (id: string, title: string) => {
    Alert.alert('Meme Reddet', `"${title}" başlıklı yükleme isteğini reddetmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: () => {
          setMockUploads((prev) => prev.filter((item) => item.id !== id));
          Alert.alert('Reddedildi', 'Meme ekleme isteği reddedildi.');
        },
      },
    ]);
  };

  // ==================== TAB 2 ACTIONS (DELETE REQUESTS) ====================

  const handleApproveDelete = async (req: AdminDeleteRequest) => {
    Alert.alert(
      'Meme Silme Onayı',
      `"${req.meme.title}" başlıklı meme kalıcı olarak silinecek. Onaylıyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Silmeyi Onayla',
          style: 'destructive',
          onPress: async () => {
            setActionInProgressId(req.id);
            try {
              await adminApi.approveDeleteRequest(req.id);
              setDeleteRequests((prev) => prev.filter((item) => item.id !== req.id));
              Alert.alert('Silindi', 'Meme başarıyla silindi ve arşivlendi.');
              loadAdminData();
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Silme işlemi gerçekleştirilemedi.');
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectDelete = async (req: AdminDeleteRequest) => {
    Alert.alert(
      'Talebi Reddet',
      `"${req.meme.title}" için iletilen silme talebi reddedilsin ve meme aktif kalsın mı?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet ve Aktif Tut',
          onPress: async () => {
            setActionInProgressId(req.id);
            try {
              await adminApi.rejectDeleteRequest(req.id, 'Moderasyon tarafından reddedildi.');
              setDeleteRequests((prev) => prev.filter((item) => item.id !== req.id));
              Alert.alert('Talebi Reddedildi', 'Meme aktif durumda kalmaya devam ediyor.');
              loadAdminData();
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'İşlem gerçekleştirilemedi.');
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ]
    );
  };

  // ==================== TAB 3 ACTIONS (SUGGESTED TAGS) ====================

  const handleApproveTag = async (tagItem: AdminSuggestedTag) => {
    setActionInProgressId(tagItem.id);
    try {
      await adminApi.approveSuggestedTag(tagItem.id);
      setSuggestedTags((prev) => prev.filter((item) => item.id !== tagItem.id));
      Alert.alert('Onaylandı', `#${tagItem.tagName} etiketi meme'e eklendi.`);
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Etiket onaylanamadı.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectTag = async (tagItem: AdminSuggestedTag) => {
    setActionInProgressId(tagItem.id);
    try {
      await adminApi.rejectSuggestedTag(tagItem.id);
      setSuggestedTags((prev) => prev.filter((item) => item.id !== tagItem.id));
      Alert.alert('Reddedildi', `#${tagItem.tagName} etiketi reddedildi.`);
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // ==================== TAB 4 ACTIONS (REPORTS & EDIT) ====================

  const handleOpenEditReport = (rep: AdminReport) => {
    setEditingReport(rep);
    setEditReportTitle(rep.meme.title);
    setEditReportTags([]);
    setNewReportTagInput('');
  };

  const handleRemoveReportTag = (tagToRemove: string) => {
    setEditReportTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleAddReportTag = () => {
    const clean = newReportTagInput.trim().replace(/^#+/, '').toLowerCase();
    if (!clean) return;
    if (!editReportTags.includes(clean)) {
      setEditReportTags((prev) => [...prev, clean]);
    }
    setNewReportTagInput('');
  };

  const handleSaveReportEdit = async (resolveReport: boolean = false) => {
    if (!editingReport) return;
    if (!editReportTitle.trim()) {
      Alert.alert('Uyarı', 'Lütfen meme için bir başlık girin.');
      return;
    }

    setIsSavingReportEdit(true);
    try {
      await adminApi.updateMeme(editingReport.meme.id, {
        title: editReportTitle.trim(),
        tags: editReportTags.length > 0 ? editReportTags : undefined,
      });

      if (resolveReport) {
        await adminApi.updateReportStatus(editingReport.id, 'RESOLVED');
        setReports((prev) => prev.filter((r) => r.id !== editingReport.id));
        setEditingReport(null);
        Alert.alert(
          'Başarılı! ✅',
          'Meme başlığı ve etiketleri güncellendi, rapor çözüldü olarak kapatıldı.'
        );
      } else {
        setReports((prev) =>
          prev.map((r) =>
            r.id === editingReport.id
              ? { ...r, meme: { ...r.meme, title: editReportTitle.trim() } }
              : r
          )
        );
        setEditingReport(null);
        Alert.alert('Kaydedildi', 'Meme bilgileri başarıyla güncellendi.');
      }
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Meme güncellenemedi.');
    } finally {
      setIsSavingReportEdit(false);
    }
  };

  const handleResolveReport = async (rep: AdminReport) => {
    Alert.alert(
      'Raporu Kapat',
      `"${rep.meme.title}" hakkındaki şikayet çözüldü olarak işaretlensin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çözüldü Olarak İşaretle',
          onPress: async () => {
            setActionInProgressId(rep.id);
            try {
              await adminApi.updateReportStatus(rep.id, 'RESOLVED');
              setReports((prev) => prev.filter((item) => item.id !== rep.id));
              Alert.alert('Kapatıldı', 'Şikayet çözüldü olarak arşive kaldırıldı.');
              loadAdminData();
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'İşlem gerçekleştirilemedi.');
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenDismissModal = (rep: AdminReport) => {
    setDismissReportTarget(rep);
    setSelectedDismissReason(DISMISS_REASON_OPTIONS[0]);
    setCustomDismissNote('');
  };

  const handleConfirmDismiss = async () => {
    if (!dismissReportTarget) return;
    setIsDismissingReport(true);
    try {
      const finalReason =
        selectedDismissReason === 'Diğer (Özel Açıklama)'
          ? customDismissNote.trim() || 'Açıklama belirtilmedi'
          : selectedDismissReason;

      await adminApi.updateReportStatus(
        dismissReportTarget.id,
        'DISMISSED',
        finalReason
      );

      setReports((prev) => prev.filter((r) => r.id !== dismissReportTarget.id));
      setDismissReportTarget(null);
      Alert.alert(
        'Rapor Geçersiz Sayıldı ✕',
        `Şikayet "${finalReason}" gerekçesiyle kapatıldı.`
      );
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Rapor kapatılamadı.');
    } finally {
      setIsDismissingReport(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 6, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={pageScrollEnabled}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={CARTOON_COLORS.orange}
            colors={[CARTOON_COLORS.orange]}
          />
        }
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={onBackToHome} style={styles.backButton}>
            <ArrowLeft size={22} color="#000000" strokeWidth={2.8} />
          </Pressable>

          <View style={styles.headerTitleGroup}>
            <View style={styles.shieldPill}>
              <ShieldAlert size={14} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.shieldPillText}>MODERASYON</Text>
            </View>
            <Text style={styles.headerTitle}>Meme Yönetimi</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Stats Summary Bar */}
        <View style={styles.statsBarWrapper}>
          <CartoonCard
            borderRadius={20}
            shadowOffset={3}
            bgColor="#FFFFFF"
            style={styles.statsCard}
            contentStyle={styles.statsCardInner}
          >
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{mockUploads.length}</Text>
              <Text style={styles.statLabel}>Ekleme</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>
                {stats?.pendingQueues?.deleteRequests ?? deleteRequests.length}
              </Text>
              <Text style={styles.statLabel}>Silme</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>
                {stats?.pendingQueues?.suggestedTags ?? suggestedTags.length}
              </Text>
              <Text style={styles.statLabel}>Etiket</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>
                {stats?.pendingQueues?.reports ?? reports.length}
              </Text>
              <Text style={styles.statLabel}>Rapor</Text>
            </View>
          </CartoonCard>
        </View>

        {/* SwiftUI TabsPickerStyle Track (ProfileScreen ile 1:1 Aynı, Aydınlık Tasarım) */}
        <View style={styles.tabsPickerTrack}>
          <View
            style={styles.tabsSegmentsRow}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) {
                setSegmentsWidth(w);
                segmentsWidthRef.current = w;
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
                    width: segmentsWidth / 4,
                    backgroundColor:
                      activeTab === 'upload_requests'
                        ? CARTOON_COLORS.green
                        : activeTab === 'delete_requests'
                        ? '#F87171'
                        : activeTab === 'suggested_tags'
                        ? CARTOON_COLORS.cyan
                        : CARTOON_COLORS.yellow,
                    transform: [
                      {
                        translateX: tabAnim.interpolate({
                          inputRange: [0, 1, 2, 3],
                          outputRange: [
                            0,
                            segmentsWidth / 4,
                            (segmentsWidth / 4) * 2,
                            (segmentsWidth / 4) * 3,
                          ],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}

            {/* Tab 1: Meme Ekleme */}
            <Pressable
              onPress={() => switchTab('upload_requests')}
              onPressIn={() => {
                touchDownTabRef.current = 'upload_requests';
              }}
              style={styles.tabsPickerSegment}
            >
              <Text
                style={[
                  styles.tabsPickerCountText,
                  activeTab === 'upload_requests' && styles.tabsPickerCountActive,
                ]}
                numberOfLines={1}
              >
                {mockUploads.length}
              </Text>
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'upload_requests' && styles.tabsPickerLabelActive,
                ]}
                numberOfLines={1}
              >
                Ekleme
              </Text>
            </Pressable>

            {/* Tab 2: Meme Silme */}
            <Pressable
              onPress={() => switchTab('delete_requests')}
              onPressIn={() => {
                touchDownTabRef.current = 'delete_requests';
              }}
              style={styles.tabsPickerSegment}
            >
              <Text
                style={[
                  styles.tabsPickerCountText,
                  activeTab === 'delete_requests' && styles.tabsPickerCountActive,
                ]}
                numberOfLines={1}
              >
                {deleteRequests.length}
              </Text>
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'delete_requests' && styles.tabsPickerLabelActive,
                ]}
                numberOfLines={1}
              >
                Silme
              </Text>
            </Pressable>

            {/* Tab 3: Etiket Ekleme */}
            <Pressable
              onPress={() => switchTab('suggested_tags')}
              onPressIn={() => {
                touchDownTabRef.current = 'suggested_tags';
              }}
              style={styles.tabsPickerSegment}
            >
              <Text
                style={[
                  styles.tabsPickerCountText,
                  activeTab === 'suggested_tags' && styles.tabsPickerCountActive,
                ]}
                numberOfLines={1}
              >
                {suggestedTags.length}
              </Text>
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'suggested_tags' && styles.tabsPickerLabelActive,
                ]}
                numberOfLines={1}
              >
                Etiket
              </Text>
            </Pressable>

            {/* Tab 4: Meme Raporları */}
            <Pressable
              onPress={() => switchTab('reports')}
              onPressIn={() => {
                touchDownTabRef.current = 'reports';
              }}
              style={styles.tabsPickerSegment}
            >
              <Text
                style={[
                  styles.tabsPickerCountText,
                  activeTab === 'reports' && styles.tabsPickerCountActive,
                ]}
                numberOfLines={1}
              >
                {reports.length}
              </Text>
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'reports' && styles.tabsPickerLabelActive,
                ]}
                numberOfLines={1}
              >
                Rapor
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={CARTOON_COLORS.orange} />
            <Text style={styles.loadingText}>Yönetim kuyrukları yükleniyor...</Text>
          </View>
        )}

        {/* TAB 1: MEME EKLEME İSTEKLERİ YÖNETİMİ */}
        {!isLoading && activeTab === 'upload_requests' && (
          <View style={styles.tabContentBlock}>
            <View style={styles.infoBanner}>
              <Sparkles size={20} color="#D97706" strokeWidth={2.4} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBannerTitle}>Meme Ekleme Onay Sistemi</Text>
                <Text style={styles.infoBannerSub}>
                  Kullanıcıların yüklediği memeleri inceleyebilir, başlık ve etiketleri düzenleyip yayına alabilirsiniz.
                </Text>
              </View>
            </View>

            {mockUploads.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#10B981" strokeWidth={2.4} />
                <Text style={styles.emptyTitle}>Tüm Ekleme İstekleri İncelendi!</Text>
                <Text style={styles.emptySub}>Bekleyen yeni bir meme ekleme isteği bulunmuyor.</Text>
              </View>
            ) : (
              mockUploads.map((item) => (
                <CartoonCard
                  key={item.id}
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor="#FFFFFF"
                  style={styles.cardItem}
                  contentStyle={styles.cardInner}
                >
                  <View style={styles.cardRow}>
                    <Pressable
                      style={styles.thumbnailWrapper}
                      onPress={() =>
                        setFullscreenMedia({ url: item.imageUrl, title: item.title })
                      }
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                      <View style={styles.zoomHintIcon}>
                        <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    </Pressable>

                    <View style={styles.cardDetails}>
                      <Text style={styles.memeTitle}>{item.title}</Text>
                      <View style={styles.metaRow}>
                        <User size={13} color="#64748B" />
                        <Text style={styles.metaText}>@{item.uploaderName}</Text>
                        <Clock size={13} color="#64748B" style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{item.submittedAt}</Text>
                      </View>
                      <View style={styles.tagsRow}>
                        {item.tags.map((t) => (
                          <View key={t} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* 3 Eşit Buton: Düzenle, Onayla, Reddet */}
                  <View style={styles.actionButtonsRow}>
                    <CartoonButton
                      label="Düzenle ✏️"
                      onPress={() => handleOpenEditUpload(item)}
                      bgColor={CARTOON_COLORS.pastelYellow}
                      borderRadius={14}
                      shadowSize={3}
                      style={styles.actionBtnThird}
                      faceStyle={styles.actionBtnFace}
                      textStyle={styles.actionBtnText}
                    />
                    <CartoonButton
                      label="Onayla ✅"
                      onPress={() => handleApproveMockUpload(item.id, item.title)}
                      bgColor={CARTOON_COLORS.green}
                      borderRadius={14}
                      shadowSize={3}
                      style={styles.actionBtnThird}
                      faceStyle={styles.actionBtnFace}
                      textStyle={styles.actionBtnText}
                    />
                    <CartoonButton
                      label="Reddet ✕"
                      onPress={() => handleRejectMockUpload(item.id, item.title)}
                      bgColor="#EF4444"
                      textColor="#FFFFFF"
                      borderRadius={14}
                      shadowSize={3}
                      style={styles.actionBtnThird}
                      faceStyle={styles.actionBtnFace}
                      textStyle={styles.actionBtnText}
                    />
                  </View>
                </CartoonCard>
              ))
            )}
          </View>
        )}

        {/* TAB 2: MEME SİLME TALEPLERİ YÖNETİMİ */}
        {!isLoading && activeTab === 'delete_requests' && (
          <View style={styles.tabContentBlock}>
            {deleteRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#10B981" strokeWidth={2.4} />
                <Text style={styles.emptyTitle}>Bekleyen Silme Talebi Yok!</Text>
                <Text style={styles.emptySub}>
                  Kullanıcılar tarafından iletilen tüm silme talepleri işlendi.
                </Text>
              </View>
            ) : (
              deleteRequests.map((req) => (
                <CartoonCard
                  key={req.id}
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor="#FFFDF7"
                  style={styles.cardItem}
                  contentStyle={styles.cardInner}
                >
                  <View style={styles.cardRow}>
                    <Pressable
                      style={styles.thumbnailWrapper}
                      onPress={() =>
                        setFullscreenMedia({
                          url: req.meme.mediaUrl,
                          title: req.meme.title,
                        })
                      }
                    >
                      <Image source={{ uri: req.meme.mediaUrl }} style={styles.thumbnail} />
                      <View style={styles.zoomHintIcon}>
                        <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    </Pressable>

                    <View style={styles.cardDetails}>
                      <Text style={styles.memeTitle}>{req.meme.title}</Text>
                      <View style={styles.metaRow}>
                        <User size={13} color="#64748B" />
                        <Text style={styles.metaText}>@{req.user.username}</Text>
                        <Clock size={13} color="#64748B" style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{formatDate(req.createdAt)}</Text>
                      </View>
                      <View style={styles.reasonBadge}>
                        <Text style={styles.reasonBadgeText}>Nedeni: {req.reason}</Text>
                      </View>
                      {req.note && (
                        <View style={styles.noteBox}>
                          <MessageSquare size={13} color="#64748B" />
                          <Text style={styles.noteText}>{req.note}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    {actionInProgressId === req.id ? (
                      <ActivityIndicator size="small" color="#000000" style={{ flex: 1 }} />
                    ) : (
                      <>
                        <CartoonButton
                          label="Silmeyi Onayla 🗑️"
                          onPress={() => handleApproveDelete(req)}
                          bgColor="#EF4444"
                          textColor="#FFFFFF"
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnHalf}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                        <CartoonButton
                          label="Talebi Reddet ✕"
                          onPress={() => handleRejectDelete(req)}
                          bgColor="#E2E8F0"
                          textColor="#000000"
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnHalf}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                      </>
                    )}
                  </View>
                </CartoonCard>
              ))
            )}
          </View>
        )}

        {/* TAB 3: ETİKET EKLEME TALEPLERİ YÖNETİMİ */}
        {!isLoading && activeTab === 'suggested_tags' && (
          <View style={styles.tabContentBlock}>
            {suggestedTags.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#10B981" strokeWidth={2.4} />
                <Text style={styles.emptyTitle}>Bekleyen Etiket Önerisi Yok!</Text>
                <Text style={styles.emptySub}>
                  Topluluk tarafından önerilen tüm etiketler incelendi.
                </Text>
              </View>
            ) : (
              suggestedTags.map((tagItem) => (
                <CartoonCard
                  key={tagItem.id}
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor="#FFFDF7"
                  style={styles.cardItem}
                  contentStyle={styles.cardInner}
                >
                  <View style={styles.cardRow}>
                    <Pressable
                      style={styles.thumbnailWrapper}
                      onPress={() =>
                        setFullscreenMedia({
                          url: tagItem.meme.mediaUrl,
                          title: tagItem.meme.title,
                        })
                      }
                    >
                      <Image source={{ uri: tagItem.meme.mediaUrl }} style={styles.thumbnail} />
                      <View style={styles.zoomHintIcon}>
                        <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    </Pressable>

                    <View style={styles.cardDetails}>
                      <Text style={styles.memeTitle}>{tagItem.meme.title}</Text>
                      <View style={styles.metaRow}>
                        <User size={13} color="#64748B" />
                        <Text style={styles.metaText}>@{tagItem.user.username}</Text>
                        <Clock size={13} color="#64748B" style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{formatDate(tagItem.createdAt)}</Text>
                      </View>
                      <View style={styles.suggestedTagHighlight}>
                        <Text style={styles.suggestedTagLabel}>Önerilen Etiket:</Text>
                        <Text style={styles.suggestedTagValue}>#{tagItem.tagName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    {actionInProgressId === tagItem.id ? (
                      <ActivityIndicator size="small" color="#000000" style={{ flex: 1 }} />
                    ) : (
                      <>
                        <CartoonButton
                          label="Etiketi Onayla 🏷️"
                          onPress={() => handleApproveTag(tagItem)}
                          bgColor={CARTOON_COLORS.cyan}
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnHalf}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                        <CartoonButton
                          label="Reddet ✕"
                          onPress={() => handleRejectTag(tagItem)}
                          bgColor="#E2E8F0"
                          textColor="#000000"
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnHalf}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                      </>
                    )}
                  </View>
                </CartoonCard>
              ))
            )}
          </View>
        )}

        {/* TAB 4: MEME RAPORLARI YÖNETİMİ */}
        {!isLoading && activeTab === 'reports' && (
          <View style={styles.tabContentBlock}>
            {reports.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#10B981" strokeWidth={2.4} />
                <Text style={styles.emptyTitle}>Açık Şikayet veya Rapor Yok!</Text>
                <Text style={styles.emptySub}>Topluluk güvenliği kontrol altında.</Text>
              </View>
            ) : (
              reports.map((rep) => (
                <CartoonCard
                  key={rep.id}
                  borderRadius={20}
                  shadowOffset={4}
                  bgColor="#FFFDF7"
                  style={styles.cardItem}
                  contentStyle={styles.cardInner}
                >
                  <View style={styles.cardRow}>
                    <Pressable
                      style={styles.thumbnailWrapper}
                      onPress={() =>
                        setFullscreenMedia({
                          url: rep.meme.mediaUrl,
                          title: rep.meme.title,
                        })
                      }
                    >
                      <Image source={{ uri: rep.meme.mediaUrl }} style={styles.thumbnail} />
                      <View style={styles.zoomHintIcon}>
                        <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    </Pressable>

                    <View style={styles.cardDetails}>
                      <Text style={styles.memeTitle}>{rep.meme.title}</Text>
                      <View style={styles.metaRow}>
                        <User size={13} color="#64748B" />
                        <Text style={styles.metaText}>Raporlayan: @{rep.reporter.username}</Text>
                        <Clock size={13} color="#64748B" style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{formatDate(rep.createdAt)}</Text>
                      </View>
                      <View style={[styles.reasonBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.reasonBadgeText, { color: '#B91C1C' }]}>
                          Şikayet: {rep.reason}
                        </Text>
                      </View>
                      {rep.description && (
                        <View style={styles.noteBox}>
                          <MessageSquare size={13} color="#64748B" />
                          <Text style={styles.noteText}>{rep.description}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 3 Eşit Buton: Düzenle, Çözüldü, Geçersiz Say */}
                  <View style={styles.actionButtonsRow}>
                    {actionInProgressId === rep.id ? (
                      <ActivityIndicator size="small" color="#000000" style={{ flex: 1 }} />
                    ) : (
                      <>
                        <CartoonButton
                          label="Düzenle ✏️"
                          onPress={() => handleOpenEditReport(rep)}
                          bgColor={CARTOON_COLORS.cyan}
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnThird}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                        <CartoonButton
                          label="Çözüldü ✅"
                          onPress={() => handleResolveReport(rep)}
                          bgColor={CARTOON_COLORS.green}
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnThird}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                        <CartoonButton
                          label="Geçersiz ✕"
                          onPress={() => handleOpenDismissModal(rep)}
                          bgColor="#E2E8F0"
                          textColor="#000000"
                          borderRadius={14}
                          shadowSize={3}
                          style={styles.actionBtnThird}
                          faceStyle={styles.actionBtnFace}
                          textStyle={styles.actionBtnText}
                        />
                      </>
                    )}
                  </View>
                </CartoonCard>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ==================== FULLSCREEN MEDIA MODAL ==================== */}
      <Modal
        visible={Boolean(fullscreenMedia)}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenMedia(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <View
            style={[
              styles.fullscreenHeader,
              { paddingTop: Math.max(insets.top + 8, 24) },
            ]}
          >
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {fullscreenMedia?.title}
            </Text>
            <Pressable
              onPress={() => setFullscreenMedia(null)}
              style={styles.fullscreenCloseBtn}
            >
              <X size={20} color="#000000" strokeWidth={3} />
            </Pressable>
          </View>
          <Pressable
            style={styles.fullscreenImageArea}
            onPress={() => setFullscreenMedia(null)}
          >
            {fullscreenMedia && (
              <Image
                source={{ uri: fullscreenMedia.url }}
                style={styles.fullscreenImg}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </View>
      </Modal>

      {/* ==================== EDIT UPLOAD REQUEST MODAL (TAB 1) ==================== */}
      <Modal
        visible={Boolean(editingUpload)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingUpload(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdropPressable}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setEditingUpload(null)}
            />
            <View style={styles.modalCardWrap}>
              <CartoonCard
                borderRadius={24}
                shadowOffset={5}
                bgColor="#FFFFFF"
                style={{ width: '100%' }}
                contentStyle={styles.modalCardInner}
              >
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <View style={styles.modalHeaderBadge}>
                      <Edit3 size={16} color="#000000" strokeWidth={2.8} />
                    </View>
                    <Text style={styles.modalHeaderTitle}>Meme Ekleme Düzenle</Text>
                  </View>
                  <Pressable
                    onPress={() => setEditingUpload(null)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color="#000000" strokeWidth={3} />
                  </Pressable>
                </View>

                {/* Title Input */}
                <Text style={styles.inputSectionLabel}>Meme Başlığı</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    value={editUploadTitle}
                    onChangeText={setEditUploadTitle}
                    placeholder="Meme başlığını yazın..."
                    placeholderTextColor="#94A3B8"
                    style={styles.textInputField}
                  />
                </View>

                {/* Tags Management */}
                <Text style={styles.inputSectionLabel}>Etiketler (Hashtag'ler)</Text>
                <View style={styles.tagChipsWrap}>
                  {editUploadTags.map((tag) => (
                    <View key={tag} style={styles.tagChipEditable}>
                      <Text style={styles.tagChipEditableText}>#{tag}</Text>
                      <Pressable
                        onPress={() => handleRemoveUploadTag(tag)}
                        style={styles.tagChipRemoveBtn}
                      >
                        <X size={12} color="#B91C1C" strokeWidth={3} />
                      </Pressable>
                    </View>
                  ))}
                  {editUploadTags.length === 0 && (
                    <Text style={styles.noTagsNote}>Henüz etiket eklenmemiş.</Text>
                  )}
                </View>

                {/* Add New Tag Row */}
                <View style={styles.addTagRow}>
                  <View style={[styles.textInputBox, { flex: 1 }]}>
                    <Text style={styles.hashSymbol}>#</Text>
                    <TextInput
                      value={newUploadTagInput}
                      onChangeText={setNewUploadTagInput}
                      placeholder="Yeni etiket..."
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                      onSubmitEditing={handleAddUploadTag}
                      autoCapitalize="none"
                    />
                  </View>
                  <CartoonButton
                    label="Ekle"
                    onPress={handleAddUploadTag}
                    bgColor={CARTOON_COLORS.cyan}
                    borderRadius={14}
                    shadowSize={2}
                    icon={<Plus size={14} color="#000000" strokeWidth={3} />}
                    style={{ alignSelf: 'stretch' }}
                    faceStyle={styles.addTagBtnFace}
                    textStyle={styles.addTagBtnText}
                  />
                </View>

                {/* Modal Action Buttons */}
                <View style={[styles.actionButtonsRow, { marginTop: 18 }]}>
                  <CartoonButton
                    label="Kaydet 💾"
                    onPress={() => handleSaveUploadEdit(false)}
                    bgColor={CARTOON_COLORS.yellow}
                    borderRadius={16}
                    shadowSize={3}
                    style={styles.actionBtnHalf}
                    faceStyle={styles.actionBtnFace}
                    textStyle={styles.actionBtnText}
                  />
                  <CartoonButton
                    label="Kaydet & Onayla 🚀"
                    onPress={() => handleSaveUploadEdit(true)}
                    bgColor={CARTOON_COLORS.green}
                    borderRadius={16}
                    shadowSize={3}
                    style={styles.actionBtnHalf}
                    faceStyle={styles.actionBtnFace}
                    textStyle={styles.actionBtnText}
                  />
                </View>
              </CartoonCard>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== EDIT REPORTED MEME MODAL (TAB 4) ==================== */}
      <Modal
        visible={Boolean(editingReport)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingReport(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdropPressable}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setEditingReport(null)}
            />
            <View style={styles.modalCardWrap}>
              <CartoonCard
                borderRadius={24}
                shadowOffset={5}
                bgColor="#FFFFFF"
                style={{ width: '100%' }}
                contentStyle={styles.modalCardInner}
              >
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <View style={[styles.modalHeaderBadge, { backgroundColor: CARTOON_COLORS.cyan }]}>
                      <Edit3 size={16} color="#000000" strokeWidth={2.8} />
                    </View>
                    <Text style={styles.modalHeaderTitle}>Raporlanan Meme'i Düzenle</Text>
                  </View>
                  <Pressable
                    onPress={() => setEditingReport(null)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color="#000000" strokeWidth={3} />
                  </Pressable>
                </View>

                {/* Report Reason Info Banner */}
                <View style={styles.modalReportInfoBanner}>
                  <Flag size={14} color="#B91C1C" />
                  <Text style={styles.modalReportInfoText}>
                    Şikayet: {editingReport?.reason}
                  </Text>
                </View>

                {/* Title Input */}
                <Text style={styles.inputSectionLabel}>Meme Başlığını Düzelt</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    value={editReportTitle}
                    onChangeText={setEditReportTitle}
                    placeholder="Meme başlığı..."
                    placeholderTextColor="#94A3B8"
                    style={styles.textInputField}
                  />
                </View>

                {/* Tags Management */}
                <Text style={styles.inputSectionLabel}>Etiketleri Düzenle</Text>
                <View style={styles.tagChipsWrap}>
                  {editReportTags.map((tag) => (
                    <View key={tag} style={styles.tagChipEditable}>
                      <Text style={styles.tagChipEditableText}>#{tag}</Text>
                      <Pressable
                        onPress={() => handleRemoveReportTag(tag)}
                        style={styles.tagChipRemoveBtn}
                      >
                        <X size={12} color="#B91C1C" strokeWidth={3} />
                      </Pressable>
                    </View>
                  ))}
                  {editReportTags.length === 0 && (
                    <Text style={styles.noTagsNote}>Henüz etiket bulunmuyor.</Text>
                  )}
                </View>

                {/* Add New Tag Row */}
                <View style={styles.addTagRow}>
                  <View style={[styles.textInputBox, { flex: 1 }]}>
                    <Text style={styles.hashSymbol}>#</Text>
                    <TextInput
                      value={newReportTagInput}
                      onChangeText={setNewReportTagInput}
                      placeholder="Yeni etiket..."
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                      onSubmitEditing={handleAddReportTag}
                      autoCapitalize="none"
                    />
                  </View>
                  <CartoonButton
                    label="Ekle"
                    onPress={handleAddReportTag}
                    bgColor={CARTOON_COLORS.cyan}
                    borderRadius={14}
                    shadowSize={2}
                    icon={<Plus size={14} color="#000000" strokeWidth={3} />}
                    style={{ alignSelf: 'stretch' }}
                    faceStyle={styles.addTagBtnFace}
                    textStyle={styles.addTagBtnText}
                  />
                </View>

                {/* Modal Action Buttons */}
                <View style={[styles.actionButtonsRow, { marginTop: 18 }]}>
                  {isSavingReportEdit ? (
                    <ActivityIndicator size="small" color="#000000" style={{ flex: 1 }} />
                  ) : (
                    <>
                      <CartoonButton
                        label="Yalnızca Kaydet 💾"
                        onPress={() => handleSaveReportEdit(false)}
                        bgColor={CARTOON_COLORS.yellow}
                        borderRadius={16}
                        shadowSize={3}
                        style={styles.actionBtnHalf}
                        faceStyle={styles.actionBtnFace}
                        textStyle={styles.actionBtnText}
                      />
                      <CartoonButton
                        label="Kaydet & Çözüldü ✅"
                        onPress={() => handleSaveReportEdit(true)}
                        bgColor={CARTOON_COLORS.green}
                        borderRadius={16}
                        shadowSize={3}
                        style={styles.actionBtnHalf}
                        faceStyle={styles.actionBtnFace}
                        textStyle={styles.actionBtnText}
                      />
                    </>
                  )}
                </View>
              </CartoonCard>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== DISMISS REPORT REASON MODAL (TAB 4) ==================== */}
      <Modal
        visible={Boolean(dismissReportTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setDismissReportTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdropPressable}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setDismissReportTarget(null)}
            />
            <View style={styles.modalCardWrap}>
              <CartoonCard
                borderRadius={24}
                shadowOffset={5}
                bgColor="#FFFFFF"
                style={{ width: '100%' }}
                contentStyle={styles.modalCardInner}
              >
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <View style={[styles.modalHeaderBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Flag size={16} color="#B91C1C" strokeWidth={2.8} />
                    </View>
                    <Text style={styles.modalHeaderTitle}>Raporu Geçersiz Say</Text>
                  </View>
                  <Pressable
                    onPress={() => setDismissReportTarget(null)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color="#000000" strokeWidth={3} />
                  </Pressable>
                </View>

                <Text style={styles.dismissPromptText}>
                  Lütfen bu şikayetin geçersiz sayılma nedenini seçiniz:
                </Text>

                {/* Reason Radio Options */}
                <View style={styles.reasonRadioList}>
                  {DISMISS_REASON_OPTIONS.map((opt) => {
                    const isSelected = selectedDismissReason === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setSelectedDismissReason(opt)}
                        style={[
                          styles.reasonRadioItem,
                          isSelected && styles.reasonRadioItemSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                        <Text
                          style={[
                            styles.reasonRadioLabel,
                            isSelected && styles.reasonRadioLabelSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Note input if 'Diğer' is selected */}
                {selectedDismissReason === 'Diğer (Özel Açıklama)' && (
                  <View style={[styles.textInputBox, { marginTop: 6 }]}>
                    <TextInput
                      value={customDismissNote}
                      onChangeText={setCustomDismissNote}
                      placeholder="Geçersiz sayılma gerekçesini yazın..."
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                    />
                  </View>
                )}

                {/* Dismiss Confirm Button */}
                <View style={[styles.actionButtonsRow, { marginTop: 18 }]}>
                  {isDismissingReport ? (
                    <ActivityIndicator size="small" color="#000000" style={{ flex: 1 }} />
                  ) : (
                    <CartoonButton
                      label="Geçersiz Say ve Raporu Kapat ✕"
                      onPress={handleConfirmDismiss}
                      bgColor="#EF4444"
                      textColor="#FFFFFF"
                      borderRadius={16}
                      shadowSize={3}
                      style={{ flex: 1, alignSelf: 'stretch' }}
                      faceStyle={styles.actionBtnFace}
                      textStyle={styles.actionBtnText}
                    />
                  )}
                </View>
              </CartoonCard>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating Bottom Nav Bar */}
      <BottomNavBar
        activeTab="admin_manage"
        onTabPress={onTabPress}
        isAdmin={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 120,
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    maxWidth: 366,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    alignItems: 'center',
    gap: 3,
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  shieldPillText: {
    fontSize: 10,
    ...CARTOON_FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    ...CARTOON_FONTS.extraBold,
    color: '#FFFFFF',
  },
  statsBarWrapper: {
    width: '100%',
    maxWidth: 366,
    marginBottom: 14,
  },
  statsCard: {
    width: '100%',
  },
  statsCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#000000',
  },
  statCount: {
    fontSize: 17,
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    ...CARTOON_FONTS.semiBold,
    color: '#475569',
    marginTop: 1,
  },

  // TabsPicker Track (Matching ProfileScreen exactly - Light grey with black border)
  tabsPickerTrack: {
    width: '100%',
    maxWidth: 366,
    backgroundColor: '#E2E8F0',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tabsSegmentsRow: {
    flexDirection: 'row',
    position: 'relative',
    height: 50,
    alignItems: 'center',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  tabsPickerSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  tabsPickerCountText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 14,
    color: '#475569',
  },
  tabsPickerCountActive: {
    color: '#000000',
  },
  tabsPickerLabelText: {
    ...CARTOON_FONTS.bold,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tabsPickerLabelActive: {
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
  },

  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    ...CARTOON_FONTS.semiBold,
    color: '#475569',
    marginTop: 10,
  },
  tabContentBlock: {
    width: '100%',
    maxWidth: 366,
    gap: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 12,
  },
  infoBannerTitle: {
    fontSize: 14,
    ...CARTOON_FONTS.bold,
    color: '#92400E',
  },
  infoBannerSub: {
    fontSize: 12,
    ...CARTOON_FONTS.semiBold,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    ...CARTOON_FONTS.bold,
    color: '#000000',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    ...CARTOON_FONTS.semiBold,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  cardItem: {
    width: '100%',
    marginBottom: 4,
  },
  cardInner: {
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomHintIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    padding: 3,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  memeTitle: {
    fontSize: 15,
    ...CARTOON_FONTS.bold,
    color: '#000000',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  metaText: {
    fontSize: 11,
    ...CARTOON_FONTS.semiBold,
    color: '#64748B',
    marginLeft: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tagPillText: {
    fontSize: 10,
    ...CARTOON_FONTS.semiBold,
    color: '#1D4ED8',
  },
  reasonBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasonBadgeText: {
    fontSize: 11,
    ...CARTOON_FONTS.bold,
    color: '#334155',
  },
  suggestedTagHighlight: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestedTagLabel: {
    fontSize: 11,
    ...CARTOON_FONTS.semiBold,
    color: '#0369A1',
  },
  suggestedTagValue: {
    fontSize: 13,
    ...CARTOON_FONTS.bold,
    color: '#0284C7',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  noteText: {
    fontSize: 11,
    ...CARTOON_FONTS.semiBold,
    color: '#475569',
    flex: 1,
    lineHeight: 14,
  },

  // Eşitlenmiş Aksiyon Butonları (Row & Button sizing)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  actionBtnHalf: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  actionBtnThird: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  actionBtnFace: {
    width: '100%',
    height: 38,
    paddingVertical: 0,
    paddingHorizontal: 4,
    borderWidth: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    ...CARTOON_FONTS.bold,
    fontSize: 11.5,
    textAlign: 'center',
  },

  // Fullscreen Modal Styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000E6',
    justifyContent: 'space-between',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  fullscreenTitle: {
    flex: 1,
    fontSize: 16,
    ...CARTOON_FONTS.bold,
    color: '#FFFFFF',
    marginRight: 12,
  },
  fullscreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  fullscreenImg: {
    width: '100%',
    height: '100%',
  },

  // Modal Common Styles
  modalOverlay: {
    flex: 1,
  },
  modalBackdropPressable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardWrap: {
    width: '100%',
    maxWidth: 370,
  },
  modalCardInner: {
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeaderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSectionLabel: {
    fontSize: 12,
    ...CARTOON_FONTS.bold,
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    height: 44,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    ...CARTOON_FONTS.semiBold,
    color: '#000000',
  },
  hashSymbol: {
    fontSize: 16,
    ...CARTOON_FONTS.extraBold,
    color: '#64748B',
    marginRight: 4,
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
    minHeight: 32,
    alignItems: 'center',
  },
  tagChipEditable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipEditableText: {
    fontSize: 12,
    ...CARTOON_FONTS.bold,
    color: '#1D4ED8',
  },
  tagChipRemoveBtn: {
    padding: 2,
  },
  noTagsNote: {
    fontSize: 11,
    ...CARTOON_FONTS.semiBold,
    color: '#94A3B8',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addTagBtnFace: {
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: {
    ...CARTOON_FONTS.bold,
    fontSize: 12,
  },

  // Report Specific in Modal
  modalReportInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  modalReportInfoText: {
    fontSize: 11.5,
    ...CARTOON_FONTS.bold,
    color: '#B91C1C',
    flex: 1,
  },

  // Dismiss Radio List
  dismissPromptText: {
    fontSize: 12.5,
    ...CARTOON_FONTS.semiBold,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 16,
  },
  reasonRadioList: {
    gap: 8,
    marginVertical: 4,
  },
  reasonRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  reasonRadioItemSelected: {
    borderColor: '#000000',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#DC2626',
  },
  reasonRadioLabel: {
    fontSize: 12,
    ...CARTOON_FONTS.semiBold,
    color: '#334155',
    flex: 1,
  },
  reasonRadioLabelSelected: {
    ...CARTOON_FONTS.bold,
    color: '#991B1B',
  },
});
