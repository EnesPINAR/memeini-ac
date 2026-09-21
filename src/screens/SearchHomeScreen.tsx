import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Keyboard,
  ScrollView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';

interface SearchHomeScreenProps {
  onSearch: (query: string) => void;
  onTabPress: (tab: TabType) => void;
}

const POPULAR_TAGS = ['hamster', 'yazılımcı', 'kedi', 'doge', 'sınav', 'pazartesi'];

export const SearchHomeScreen: React.FC<SearchHomeScreenProps> = ({
  onSearch,
  onTabPress,
}) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = () => {
    if (query.trim()) {
      Keyboard.dismiss();
      onSearch(query.trim());
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full screen background image matching Figma ara.png */}
      <ImageBackground
        source={require('../../assets/images/rainbow_hamsters.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Spacing to position under the rainbow */}
            <View style={styles.topSpace} />

            {/* Colorful Title "Meme'ini Bul" */}
            <View style={styles.titleContainer}>
              <ColorfulTitle fontSize={40} />
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.input}
                  placeholder="Meme veya etiket ara..."
                  placeholderTextColor="#777777"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.searchButton}
                  onPress={handleSearchSubmit}
                >
                  <Ionicons name="search" size={28} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Popular tags badges */}
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.75}
                  style={styles.tagBadge}
                  onPress={() => onSearch(tag)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Floating Navigation Bar */}
          <BottomNavBar activeTab="search" onTabPress={onTabPress} />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#86E0FE',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 120,
  },
  topSpace: {
    height: 140,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBarContainer: {
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 18,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    paddingVertical: 8,
    marginRight: 8,
  },
  searchButton: {
    padding: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 380,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
});
