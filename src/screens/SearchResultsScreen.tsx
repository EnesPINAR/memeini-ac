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
  StatusBar,
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

  // Swapping an alternative meme into the top position when clicked
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Colorful Title matching Figma ara 2.png */}
        <TouchableOpacity activeOpacity={0.8} onPress={onBackToHome} style={styles.titleContainer}>
          <ColorfulTitle fontSize={38} />
        </TouchableOpacity>

        {/* Search Bar matching Figma: Rounded pill with black border */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            placeholder="Ornek arama"
            placeholderTextColor="#000000"
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSearchSubmit}
            style={styles.searchIconBtn}
          >
            <Ionicons name="search" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Main Card: "Aranan En Uyumlu Meme" */}
        <View style={styles.mainMemeCard}>
          {currentBest.imageUrl ? (
            <Image
              source={{ uri: currentBest.imageUrl }}
              style={styles.mainMemeImage}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.mainMemeOverlay}>
            <Text style={styles.mainMemeLabel}>
              {currentBest.title || 'Aranan En Uyumlu Meme'}
            </Text>
          </View>
        </View>

        {/* Directly below main card: 5 Stars on Left, Uploader Nickname on Right */}
        <View style={styles.cardFooter}>
          <StarRating initialRating={currentBest.rating} />

          <View style={styles.uploaderBox}>
            <Ionicons name="person-circle-outline" size={28} color="#000000" style={styles.avatarIcon} />
            <Text style={styles.uploaderNickname}>
              {currentBest.uploaderNickname || 'Yükleyen nickname'}
            </Text>
          </View>
        </View>

        {/* "Bu değil mi?" Heading + "Sen ekle (+)" Pill Button */}
        <View style={styles.actionRow}>
          <Text style={styles.questionText}>Bu değil mi?</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.senEkleButton}
            onPress={() => onOpenAddMeme(query)}
          >
            <Text style={styles.senEkleText}>Sen ekle</Text>
            <Ionicons name="add-circle-outline" size={26} color="#000000" style={styles.plusIcon} />
          </TouchableOpacity>
        </View>

        {/* 2x2 Grid of Alternative Memes */}
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
              <View style={styles.altCardOverlay}>
                <Text style={styles.altCardText} numberOfLines={2}>
                  {altMeme.title || 'Alternatif Meme'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <BottomNavBar activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
    alignItems: 'center',
  },
  titleContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    height: 52,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 6,
  },
  searchIconBtn: {
    padding: 4,
  },
  mainMemeCard: {
    width: '100%',
    maxWidth: 380,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mainMemeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mainMemeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    alignItems: 'center',
  },
  mainMemeLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  uploaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarIcon: {
    marginRight: 6,
  },
  uploaderNickname: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  senEkleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  senEkleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginRight: 6,
  },
  plusIcon: {
    marginLeft: 2,
  },
  altGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    rowGap: 16,
  },
  altCard: {
    width: '47.5%',
    height: 110,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  altCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  altCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    alignItems: 'center',
  },
  altCardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
});
