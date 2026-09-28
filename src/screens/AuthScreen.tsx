import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react-native';

import {
  CartoonCard,
  CartoonButton,
  CartoonCornerGloss,
  CARTOON_COLORS,
  CARTOON_FONTS,
} from '../components/cartoon/CartoonUI';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { authApi, UserProfile } from '../services/api';

const EMOJI_LIST = ['🐹', '🐱', '🦊', '🐸', '🤖', '😎', '🚀', '🍕', '🦄', '⭐'];
const BG_COLORS = [
  CARTOON_COLORS.yellow,
  CARTOON_COLORS.cyan,
  CARTOON_COLORS.pink,
  CARTOON_COLORS.green,
  CARTOON_COLORS.orange,
  CARTOON_COLORS.purple,
];

type AuthTab = 'login' | 'register';
const TAB_ORDER: AuthTab[] = ['login', 'register'];

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Page ScrollView scrollEnabled flag (locked during tabspicker drag to prevent vertical scroll - exactly like ProfileScreen)
  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  // SwiftUI TabsPickerStyle animated thumb & drag gesture navigation (ProfileScreen identical)
  const tabAnim = useRef(new Animated.Value(0)).current;
  const activeTabRef = useRef<AuthTab>('login');
  const touchDownTabRef = useRef<AuthTab>('login');
  const dragStartIdxRef = useRef(0);
  const [segmentsWidth, setSegmentsWidth] = useState(0);
  const segmentsWidthRef = useRef(0);

  const switchTab = (nextTab: AuthTab) => {
    const targetIdx = TAB_ORDER.indexOf(nextTab);
    if (targetIdx === -1) return;
    activeTabRef.current = nextTab;
    touchDownTabRef.current = nextTab;
    setActiveTab(nextTab);
    setErrorMessage(null);

    Animated.spring(tabAnim, {
      toValue: targetIdx,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  };

  // Dragging finger along the SwiftUI TabsPickerStyle segmented bar with vertical scroll lock
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
          // Lock page vertical scrolling during horizontal tab drag
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
          const totalW = segmentsWidthRef.current || 300;
          const segW = totalW / 2;
          const currentIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const clampedIdx = Math.max(0, Math.min(1, currentIdx));
          tabAnim.setValue(clampedIdx);
        },
        onPanResponderRelease: (_, gestureState) => {
          // Re-enable page scrolling
          setPageScrollEnabled(true);
          const totalW = segmentsWidthRef.current || 300;
          const segW = totalW / 2;
          const rawIdx = dragStartIdxRef.current + gestureState.dx / segW;
          const snappedIdx = Math.round(Math.max(0, Math.min(1, rawIdx)));
          switchTab(TAB_ORDER[snappedIdx]);
        },
        onPanResponderTerminate: () => {
          // Re-enable page scrolling
          setPageScrollEnabled(true);
          const currentIdx = TAB_ORDER.indexOf(activeTabRef.current);
          switchTab(TAB_ORDER[currentIdx]);
        },
      }),
    []
  );

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form states
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐹');
  const [selectedBg, setSelectedBg] = useState(CARTOON_COLORS.yellow);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Lütfen kullanıcı adı / e-posta ve şifrenizi girin.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authApi.login(identifier, password);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regEmail.trim() || !regUsername.trim() || !regDisplayName.trim() || !regPassword.trim()) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authApi.register({
        email: regEmail,
        username: regUsername,
        displayName: regDisplayName,
        password: regPassword,
        avatarEmoji: selectedEmoji,
        avatarBg: selectedBg,
      });
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Kayıt işlemi başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        scrollEnabled={pageScrollEnabled}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 24, 44), paddingBottom: insets.bottom + 36 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Avatar removed per user request */}
        <View style={styles.header}>
          <ColorfulTitle fontSize={36} />
          <Text style={styles.subtitle}>En komik memeleri keşfet, puanla ve koleksiyon yap!</Text>
        </View>

        {/* TabsPickerTrack - 100% Identical to ProfileScreen with sliding thumb & locked vertical scroll */}
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
                    width: segmentsWidth / 2,
                    backgroundColor: CARTOON_COLORS.yellow,
                    transform: [
                      {
                        translateX: tabAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, segmentsWidth / 2],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}

            <Pressable
              onPress={() => switchTab('login')}
              onPressIn={() => {
                touchDownTabRef.current = 'login';
              }}
              style={styles.tabsPickerSegment}
            >
              <LogIn
                size={18}
                color={activeTab === 'login' ? '#000000' : '#475569'}
                strokeWidth={2.6}
              />
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'login' && styles.tabsPickerLabelActive,
                ]}
              >
                Giriş Yap
              </Text>
            </Pressable>

            <Pressable
              onPress={() => switchTab('register')}
              onPressIn={() => {
                touchDownTabRef.current = 'register';
              }}
              style={styles.tabsPickerSegment}
            >
              <UserPlus
                size={18}
                color={activeTab === 'register' ? '#000000' : '#475569'}
                strokeWidth={2.6}
              />
              <Text
                style={[
                  styles.tabsPickerLabelText,
                  activeTab === 'register' && styles.tabsPickerLabelActive,
                ]}
              >
                Kayıt Ol
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Error Notification */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#DC2626" strokeWidth={2.6} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Main Cartoon Card (Consistent with ProfileScreen & AddMemeScreen) */}
        <CartoonCard
          borderRadius={24}
          shadowOffset={5}
          bgColor="#FFFDF7"
          style={styles.formCardWrapper}
          contentStyle={styles.formCardInner}
        >
          {activeTab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <View style={styles.formFieldsBlock}>
              <Text style={styles.fieldLabel}>Kullanıcı Adı veya E-Posta</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <User size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Örn: enes veya enes@memeinibul.com"
                    placeholderTextColor="#777777"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Şifre</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <Lock size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor="#777777"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? (
                      <EyeOff size={18} color="#000000" strokeWidth={2.4} />
                    ) : (
                      <Eye size={18} color="#000000" strokeWidth={2.4} />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.submitRow}>
                {isLoading ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={styles.loadingText}>Giriş yapılıyor...</Text>
                  </View>
                ) : (
                  <CartoonButton
                    label="Giriş Yap 🚀"
                    onPress={handleLogin}
                    bgColor={CARTOON_COLORS.yellow}
                    borderRadius={18}
                    shadowSize={4}
                    style={styles.fullWidthButton}
                    faceStyle={styles.fullWidthButtonFace}
                  />
                )}
              </View>
            </View>
          ) : (
            /* ================= REGISTER FORM ================= */
            <View style={styles.formFieldsBlock}>
              <Text style={styles.fieldLabel}>E-Posta Adresi</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <Mail size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#777777"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Kullanıcı Adı</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <User size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="enes_p"
                    placeholderTextColor="#777777"
                    value={regUsername}
                    onChangeText={(val) => setRegUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Görünen İsim</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <Sparkles size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Enes Pınar"
                    placeholderTextColor="#777777"
                    value={regDisplayName}
                    onChangeText={setRegDisplayName}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Şifre (En az 6 karakter)</Text>
              <View style={styles.inputBoxWrapper}>
                <View style={styles.inputShadow} pointerEvents="none" />
                <View style={styles.inputSurface}>
                  <CartoonCornerGloss size="sm" top={2.5} left={4} />
                  <Lock size={18} color="#000000" strokeWidth={2.6} style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor="#777777"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? (
                      <EyeOff size={18} color="#000000" strokeWidth={2.4} />
                    ) : (
                      <Eye size={18} color="#000000" strokeWidth={2.4} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Avatar Seçici - Exact ProfileScreen styling with no clipping */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Avatarını Seç</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarRow}
                contentContainerStyle={styles.avatarRowContent}
              >
                {EMOJI_LIST.map((emoji) => {
                  const isSelected = selectedEmoji === emoji;
                  return (
                    <Pressable
                      key={emoji}
                      onPress={() => setSelectedEmoji(emoji)}
                      style={[
                        styles.avatarOptionBtn,
                        isSelected && [
                          styles.avatarOptionBtnSelected,
                          { backgroundColor: selectedBg },
                        ],
                      ]}
                    >
                      <Text style={styles.avatarEmojiText}>{emoji}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Avatar Rengi</Text>
              <View style={styles.colorRow}>
                {BG_COLORS.map((color) => {
                  const isSelected = selectedBg === color;
                  return (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedBg(color)}
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

              <View style={styles.submitRow}>
                {isLoading ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={styles.loadingText}>Hesap oluşturuluyor...</Text>
                  </View>
                ) : (
                  <CartoonButton
                    label="Hesap Oluştur ✨"
                    onPress={handleRegister}
                    bgColor={CARTOON_COLORS.green}
                    borderRadius={18}
                    shadowSize={4}
                    style={styles.fullWidthButton}
                    faceStyle={styles.fullWidthButtonFace}
                  />
                )}
              </View>
            </View>
          )}
        </CartoonCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFBEA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    ...CARTOON_FONTS.semiBold,
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  // Exact TabsPickerTrack from ProfileScreen.tsx with animated thumb
  tabsPickerTrack: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    zIndex: 2,
    gap: 8,
  },
  tabsPickerLabelText: {
    ...CARTOON_FONTS.bold,
    fontSize: 14.5,
    color: '#475569',
  },
  tabsPickerLabelActive: {
    ...CARTOON_FONTS.extraBold,
    color: '#000000',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 2.5,
    borderColor: '#DC2626',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    flex: 1,
    ...CARTOON_FONTS.semiBold,
    fontSize: 13,
    color: '#991B1B',
  },
  // Form Card Wrapper & Inner
  formCardWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  formCardInner: {
    padding: 18,
  },
  formFieldsBlock: {
    width: '100%',
  },
  fieldLabel: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13.5,
    color: '#000000',
    marginBottom: 6,
  },
  // 3D Cartoon Input Structure (Exact AddMemeScreen.tsx pattern)
  inputBoxWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 4,
  },
  inputShadow: {
    position: 'absolute',
    top: 3.5,
    left: 3.5,
    right: -3.5,
    bottom: -3.5,
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  inputSurface: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    ...CARTOON_FONTS.bold,
    fontSize: 14,
    color: '#000000',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  submitRow: {
    marginTop: 20,
    width: '100%',
  },
  fullWidthButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  fullWidthButtonFace: {
    width: '100%',
    paddingVertical: 12,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    ...CARTOON_FONTS.bold,
    fontSize: 14,
    color: '#000000',
  },
  // Avatar & Color selectors matching ProfileScreen.tsx exactly
  avatarRow: {
    marginHorizontal: -4,
    marginBottom: 6,
  },
  avatarRowContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    gap: 8,
  },
  avatarOptionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionBtnSelected: {
    borderWidth: 3.5,
  },
  avatarEmojiText: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 10,
  },
  colorCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3.5,
  },
});
