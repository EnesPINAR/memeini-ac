import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Keyboard,
  ScrollView,
  Text,
  Platform,
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

  const handleClear = () => {
    setQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Background illustration matching Figma positioning */}
      <ImageBackground
        source={require('../../assets/images/rainbow_hamsters.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Spacing to position under the rainbow */}
            <View style={styles.topSpace} />

            {/* Apple iOS Typography Title */}
            <View style={styles.titleContainer}>
              <ColorfulTitle fontSize={36} />
            </View>

            {/* iOS Cupertino Search Bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.iosSearchBar}>
                <Ionicons name="search" size={19} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Meme veya etiket ara..."
                  placeholderTextColor="#8E8E93"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {query.length > 0 && Platform.OS !== 'ios' && (
                  <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* iOS Style Frosted Tag Badges */}
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.7}
                  style={styles.iosTagBadge}
                  onPress={() => onSearch(tag)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* iOS Floating Tab Bar */}
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
    height: 130,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBarContainer: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 16,
  },
  iosSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.88)' : '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  clearButton: {
    padding: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 360,
    marginTop: 6,
  },
  iosTagBadge: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.82)' : '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        } as any)
      : {}),
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
