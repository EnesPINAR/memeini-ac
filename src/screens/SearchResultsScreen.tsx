import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { StarRating } from '../components/StarRating';
import { MemeItem } from '../types/meme';
import { searchMemes } from '../data/mockMemes';

interface SearchResultsScreenProps {
  initialQuery: string;
  onBackToHome: () => void;
  onOpenAddMeme: (tag?: string) => void;
  onTabPress: (tab: TabType) => void;
}

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  initialQuery,
  onBackToHome,
  onOpenAddMeme,
  onTabPress,
}) => {
  const [query, setQuery] = useState(initialQuery || 'Ornek arama');
  const [searchData, setSearchData] = useState(() => searchMemes(initialQuery || 'Ornek arama'));
  const [currentBest, setCurrentBest] = useState<MemeItem>(searchData.bestMatch);
  const [alternatives, setAlternatives] = useState<MemeItem[]>(searchData.alternatives);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Colorful Title matching Figma positioning */}
        <TouchableOpacity activeOpacity={0.8} onPress={onBackToHome} style={styles.titleContainer}>
          <ColorfulTitle fontSize={34} />
        </TouchableOpacity>

        {/* Apple iOS Search Bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.iosSearchBar}>
            <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              placeholder="Meme veya etiket ara..."
              placeholderTextColor="#8E8E93"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onBackToHome} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>

        {/* Main Card: "Aranan En Uyumlu Meme" (Apple Card Style) */}
        <View style={styles.mainCardContainer}>
          <View style={styles.mainMemeCard}>
            {currentBest.imageUrl ? (
              <Image
                source={{ uri: currentBest.imageUrl }}
                style={styles.mainMemeImage}
                resizeMode="cover"
              />
            ) : null}
            {/* Elegant glassmorphic bottom caption banner */}
            <View style={styles.mainMemeCaption}>
              <Text style={styles.mainMemeLabel} numberOfLines={1}>
                {currentBest.title || 'Aranan En Uyumlu Meme'}
              </Text>
              <Text style={styles.bestMatchTag}>En Uyumlu Eşleşme</Text>
            </View>
          </View>
        </View>

        {/* Card Footer: 5 Stars on Left, Uploader Nickname on Right */}
        <View style={styles.cardFooter}>
          <StarRating initialRating={currentBest.rating} size={22} />

          <View style={styles.uploaderBox}>
            <Ionicons name="person-circle" size={24} color="#007AFF" style={styles.avatarIcon} />
            <Text style={styles.uploaderNickname}>
              @{currentBest.uploaderNickname || 'yukleyen'}
            </Text>
          </View>
        </View>

        {/* Associated Meme Tags (iOS System Tinted Chips) */}
        {currentBest.tags && currentBest.tags.length > 0 && (
          <View style={styles.memeTagsContainer}>
            {currentBest.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                activeOpacity={0.7}
                style={styles.iosTagBadge}
                onPress={() => {
                  setQuery(tag);
                  const results = searchMemes(tag);
                  setSearchData(results);
                  setCurrentBest(results.bestMatch);
                  setAlternatives(results.alternatives);
                }}
              >
                <Text style={styles.iosTagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* "Bu değil mi?" Heading + Apple Styled "Sen ekle (+)" Button */}
        <View style={styles.actionRow}>
          <Text style={styles.questionText}>Bu değil mi?</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.senEkleBtn}
            onPress={() => onOpenAddMeme(query)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.senEkleText}>Sen ekle</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Grid of Alternative Memes (Apple Card Grid) */}
        <View style={styles.altGrid}>
          {alternatives.slice(0, 4).map((altMeme, index) => (
            <TouchableOpacity
              key={altMeme.id + '-' + index}
              activeOpacity={0.8}
              style={styles.altCard}
              onPress={() => handleSelectAlternative(altMeme, index)}
            >
              {altMeme.imageUrl ? (
                <Image
                  source={{ uri: altMeme.imageUrl }}
                  style={styles.altCardImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.altCardCaption}>
                <Text style={styles.altCardText} numberOfLines={1}>
                  {altMeme.title || 'Alternatif Meme'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* iOS Floating Tab Bar */}
      <BottomNavBar activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    alignItems: 'center',
  },
  titleContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 16,
  },
  iosSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E9EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    marginLeft: 10,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mainCardContainer: {
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  mainMemeCard: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    position: 'relative',
  },
  mainMemeImage: {
    width: '100%',
    height: '100%',
  },
  mainMemeCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  mainMemeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginRight: 8,
  },
  bestMatchTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  uploaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarIcon: {
    marginRight: 4,
  },
  uploaderNickname: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  memeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 360,
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  iosTagBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  iosTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -0.4,
  },
  senEkleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  senEkleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  altGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 360,
    rowGap: 12,
  },
  altCard: {
    width: '48%',
    height: 115,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  altCardImage: {
    width: '100%',
    height: '100%',
  },
  altCardCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        } as any)
      : {}),
  },
  altCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
});
