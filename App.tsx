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
import { TabType } from './src/components/BottomNavBar';
import { MemeItem } from './src/types/meme';
import { MOCK_MEMES } from './src/data/mockMemes';

type CurrentScreen = 'search_home' | 'search_results' | 'add_meme' | 'explore' | 'profile';

export default function App() {
  // Load static latin-ext (Turkish supported) Baloo 2 TTFs for iOS, Android, and Web
  // Using exact PostScript names ensures 100% compatibility across Expo Go, iOS CoreText, and Android
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

  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>('search_home');
  const [previousScreen, setPreviousScreen] = useState<'search_home' | 'search_results' | 'explore' | 'profile'>('search_home');
  const [searchQuery, setSearchQuery] = useState('Ornek arama');
  const [activeDefaultTag, setActiveDefaultTag] = useState('');
  const [userNickname, setUserNickname] = useState('enes');
  const [savedMemeIds, setSavedMemeIds] = useState<string[]>(['1', '3', '6', '10']);

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
      handleOpenAddMeme();
    } else if (tab === 'explore') {
      setCurrentScreen('explore');
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    }
  };

  const handleAddNewMeme = (meme: MemeItem) => {
    MOCK_MEMES.unshift(meme);
    setSearchQuery(meme.tags[0] || meme.title);
    setCurrentScreen('profile');
  };

  if ((!fontsLoaded && !fontError) || !assetsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFE600" />
      </View>
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
            />
          ) : (
            <SearchResultsScreen
              initialQuery={searchQuery}
              onBackToHome={() => setCurrentScreen('search_home')}
              onOpenAddMeme={handleOpenAddMeme}
              onTabPress={handleTabPress}
              savedMemeIds={savedMemeIds}
              onToggleSaveMeme={handleToggleSaveMeme}
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
