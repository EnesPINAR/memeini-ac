import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Asset } from 'expo-asset';

import { IOSContainer } from './src/components/IOSContainer';
import { SearchHomeScreen } from './src/screens/SearchHomeScreen';
import { SearchResultsScreen } from './src/screens/SearchResultsScreen';
import { AddMemeScreen } from './src/screens/AddMemeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { AdminManagementScreen } from './src/screens/AdminManagementScreen';
import { TabType } from './src/components/BottomNavBar';
import { MemeItem } from './src/types/meme';
import { MOCK_MEMES } from './src/data/mockMemes';
import { authApi, getStoredToken, UserProfile } from './src/services/api';

type CurrentScreen =
  | 'search_home'
  | 'search_results'
  | 'add_meme'
  | 'explore'
  | 'profile'
  | 'auth'
  | 'admin_management';

export default function App() {
  // Load static latin-ext (Turkish supported) Baloo 2 TTFs for iOS, Android, and Web
  const [fontsLoaded, fontError] = useFonts({
    'Baloo2-SemiBold': require('./assets/fonts/Baloo2-SemiBold.ttf'),
    'Baloo2-Bold': require('./assets/fonts/Baloo2-Bold.ttf'),
    'Baloo2-ExtraBold': require('./assets/fonts/Baloo2-ExtraBold.ttf'),
  });

  // On Web, also inject Google Fonts CSS v2 with full latin-ext (Turkish) weights (600, 700, 800)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'cartoon-turkish-fonts-link';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Fredoka:wght@600;700&display=swap&subset=latin,latin-ext';
        document.head.appendChild(link);
      }

      const styleId = 'cartoon-turkish-fonts-override';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          * {
            font-family: 'Baloo 2', 'Fredoka', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Preload local device assets (cached directly on device)
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    async function preloadAssets() {
      try {
        await Asset.loadAsync([
          require('./assets/images/rainbow_hamsters.jpg'),
        ]);
      } catch {
        // continue gracefully
      } finally {
        setAssetsLoaded(true);
      }
    }
    preloadAssets();
  }, []);

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App Navigation & Search State
  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>('search_home');
  const [previousScreen, setPreviousScreen] = useState<CurrentScreen>('search_home');
  const [searchQuery, setSearchQuery] = useState('Ornek arama');
  const [activeDefaultTag, setActiveDefaultTag] = useState('');
  const [userNickname, setUserNickname] = useState('enes');
  const [savedMemeIds, setSavedMemeIds] = useState<string[]>(['1', '3', '6', '10']);

  // Initial Auth Check: load token and fetch user profile from live backend
  useEffect(() => {
    async function verifyAuth() {
      try {
        const token = await getStoredToken();
        if (token) {
          const profile = await authApi.getMe();
          if (profile) {
            setCurrentUser(profile);
            setUserNickname(profile.username);
          }
        }
      } catch {
        // Token expired or invalid
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    verifyAuth();
  }, []);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserNickname(user.username);
    if (user.role === 'ADMIN') {
      setCurrentScreen('admin_management');
      Alert.alert('Yönetici Girişi Yapıldı 🛡️', `${user.displayName} olarak giriş yapıldı. Meme Yönetim Paneli açıldı.`);
    } else {
      setCurrentScreen('profile');
      Alert.alert('Hoş Geldin! 🎉', `${user.displayName} olarak başarıyla giriş yapıldı.`);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setCurrentUser(null);
      setUserNickname('');
      setCurrentScreen('auth');
      Alert.alert('Çıkış Yapıldı 👋', 'Hesabınızdan güvenli bir şekilde çıkış yapıldı.');
    }
  };

  const handleToggleSaveMeme = (memeId: string) => {
    setSavedMemeIds((prev) =>
      prev.includes(memeId)
        ? prev.filter((id) => id !== memeId)
        : [memeId, ...prev]
    );
  };

  const handleStartSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentScreen('search_results');
  };

  const handleOpenAddMeme = (tag?: string) => {
    if (currentUser?.role === 'ADMIN') {
      Alert.alert(
        'Yönetici Hesabı 🛡️',
        'Yönetici hesapları yeni meme ekleyemez. Meme yönetim ekranına yönlendiriliyorsunuz.'
      );
      setCurrentScreen('admin_management');
      return;
    }
    if (currentScreen !== 'add_meme') {
      setPreviousScreen(currentScreen);
    }
    setActiveDefaultTag(tag !== undefined ? tag : currentScreen === 'search_results' ? searchQuery : '');
    setCurrentScreen('add_meme');
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === 'search') {
      setCurrentScreen('search_home');
    } else if (tab === 'add') {
      if (!currentUser) {
        Alert.alert(
          'Giriş Yapmalısınız 🔒',
          'Yeni bir meme yüklemek için lütfen önce hesabınıza giriş yapın.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Giriş Yap', onPress: () => setCurrentScreen('auth') },
          ]
        );
        return;
      }
      if (currentUser.role === 'ADMIN') {
        setCurrentScreen('admin_management');
        return;
      }
      handleOpenAddMeme();
    } else if (tab === 'admin_manage') {
      setCurrentScreen('admin_management');
    } else if (tab === 'explore') {
      setCurrentScreen('explore');
    } else if (tab === 'profile') {
      if (!currentUser) {
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('profile');
      }
    }
  };

  const handleAddNewMeme = (meme: MemeItem) => {
    MOCK_MEMES.unshift(meme);
    setSearchQuery(meme.tags[0] || meme.title);
    setCurrentScreen('profile');
  };

  if ((!fontsLoaded && !fontError) || !assetsLoaded || isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFE600" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaProvider>
        <IOSContainer>
          <View style={styles.container}>
            <AuthScreen onAuthSuccess={handleAuthSuccess} />
          </View>
        </IOSContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <IOSContainer>
        <View style={styles.container}>
          {currentScreen === 'search_home' ? (
            <SearchHomeScreen
              onSearch={handleStartSearch}
              onTabPress={handleTabPress}
              isAdmin={currentUser?.role === 'ADMIN'}
            />
          ) : currentScreen === 'admin_management' ? (
            <AdminManagementScreen
              onBackToHome={() => setCurrentScreen('search_home')}
              onTabPress={handleTabPress}
            />
          ) : currentScreen === 'add_meme' ? (
            <AddMemeScreen
              onBack={() => setCurrentScreen(previousScreen)}
              onAddMeme={handleAddNewMeme}
              onTabPress={handleTabPress}
              defaultTag={activeDefaultTag}
              currentUserNickname={userNickname}
            />
          ) : currentScreen === 'explore' ? (
            <ExploreScreen
              onBackToHome={() => setCurrentScreen('search_home')}
              onSearchTagOrQuery={handleStartSearch}
              onOpenAddMeme={handleOpenAddMeme}
              onTabPress={handleTabPress}
              savedMemeIds={savedMemeIds}
              onToggleSaveMeme={handleToggleSaveMeme}
              isAdmin={currentUser?.role === 'ADMIN'}
            />
          ) : currentScreen === 'profile' ? (
            <ProfileScreen
              onBackToHome={() => setCurrentScreen('search_home')}
              onSearchTagOrQuery={handleStartSearch}
              onOpenAddMeme={handleOpenAddMeme}
              onTabPress={handleTabPress}
              userNickname={userNickname}
              onUpdateNickname={setUserNickname}
              savedMemeIds={savedMemeIds}
              onToggleSaveMeme={handleToggleSaveMeme}
              onLogout={handleLogout}
              currentUser={currentUser}
            />
          ) : (
            <SearchResultsScreen
              initialQuery={searchQuery}
              onBackToHome={() => setCurrentScreen('search_home')}
              onOpenAddMeme={handleOpenAddMeme}
              onTabPress={handleTabPress}
              savedMemeIds={savedMemeIds}
              onToggleSaveMeme={handleToggleSaveMeme}
              isAdmin={currentUser?.role === 'ADMIN'}
            />
          )}
        </View>
      </IOSContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
