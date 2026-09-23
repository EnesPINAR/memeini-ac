import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { IOSContainer } from './src/components/IOSContainer';
import { SearchHomeScreen } from './src/screens/SearchHomeScreen';
import { SearchResultsScreen } from './src/screens/SearchResultsScreen';
import { AddMemeModal } from './src/components/AddMemeModal';
import { TabType } from './src/components/BottomNavBar';
import { MemeItem } from './src/types/meme';
import { MOCK_MEMES } from './src/data/mockMemes';

type CurrentScreen = 'search_home' | 'search_results';

export default function App() {
  // Load full latin-ext (Turkish supported) Baloo 2 & Fredoka TTFs for native
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular: require('./assets/fonts/Baloo2-Turkish.ttf'),
    Fredoka_600SemiBold: require('./assets/fonts/Baloo2-Turkish.ttf'),
    Fredoka_700Bold: require('./assets/fonts/Baloo2-Turkish.ttf'),
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

  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>('search_home');
  const [searchQuery, setSearchQuery] = useState('Ornek arama');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [activeModalTag, setActiveModalTag] = useState('');

  const handleStartSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentScreen('search_results');
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === 'search') {
      setCurrentScreen('search_home');
    } else if (tab === 'add') {
      setActiveModalTag(currentScreen === 'search_results' ? searchQuery : '');
      setAddModalVisible(true);
    } else if (tab === 'explore') {
      Alert.alert('Keşfet', 'Keşfet ekranı sıradaki güncellemede aktif edilecektir! 🚀');
    } else if (tab === 'profile') {
      Alert.alert('Profil', 'Kullanıcı profil ve meme koleksiyonu ekranı yakında burada olacak! 👤');
    }
  };

  const handleOpenAddMeme = (tag?: string) => {
    setActiveModalTag(tag || '');
    setAddModalVisible(true);
  };

  const handleAddNewMeme = (meme: MemeItem) => {
    MOCK_MEMES.unshift(meme);
    setSearchQuery(meme.tags[0] || meme.title);
    setCurrentScreen('search_results');
  };

  if (!fontsLoaded) {
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
          ) : (
            <SearchResultsScreen
              initialQuery={searchQuery}
              onBackToHome={() => setCurrentScreen('search_home')}
              onOpenAddMeme={handleOpenAddMeme}
              onTabPress={handleTabPress}
            />
          )}

          {/* Add Meme Modal */}
          <AddMemeModal
            visible={addModalVisible}
            onClose={() => setAddModalVisible(false)}
            onAddMeme={handleAddNewMeme}
            defaultTag={activeModalTag}
          />
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
