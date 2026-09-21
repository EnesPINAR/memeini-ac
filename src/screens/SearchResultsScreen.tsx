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
import { LiquidGlassView } from '../components/LiquidGlassView';
import { ExpoUIButton } from '../components/ExpoUIButton';
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
          <ColorfulTitle fontSize={36} />
        </TouchableOpacity>

        {/* Liquid Glass Search Bar Row */}
        <View style={styles.searchBarRow}>
          <LiquidGlassView borderRadius={14} intensity={60} style={styles.liquidSearchBar}>
            <Ionicons name="search" size={18} color="#475569" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              placeholder="Meme veya etiket ara..."
              placeholderTextColor="#64748B"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={17} color="#64748B" />
              </TouchableOpacity>
            )}
          </LiquidGlassView>

          <TouchableOpacity onPress={onBackToHome} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>

        {/* Main Card: "Aranan En Uyumlu Meme" in Liquid Glass Frame */}
        <View style={styles.mainCardWrapper}>
          <LiquidGlassView borderRadius={24} intensity={70} style={styles.mainLiquidCard}>
            {currentBest.imageUrl ? (
              <Image
                source={{ uri: currentBest.imageUrl }}
                style={styles.mainMemeImage}
                resizeMode="cover"
              />
            ) : null}

            {/* Liquid Glass Bottom Caption Banner */}
            <View style={styles.captionBanner}>
              <Text style={styles.mainMemeLabel} numberOfLines={1}>
                {currentBest.title || 'Aranan En Uyumlu Meme'}
              </Text>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>En Uyumlu</Text>
              </View>
            </View>
          </LiquidGlassView>
        </View>

        {/* Card Footer: 5 Stars on Left, Uploader Nickname on Right */}
        <View style={styles.cardFooter}>
          <StarRating initialRating={currentBest.rating} size={22} />

          <View style={styles.uploaderBox}>
            <Ionicons name="person-circle" size={24} color="#0284C7" style={styles.avatarIcon} />
            <Text style={styles.uploaderNickname}>
              @{currentBest.uploaderNickname || 'yukleyen'}
            </Text>
          </View>
        </View>

        {/* Associated Meme Tags in Liquid Glass Chips */}
        {currentBest.tags && currentBest.tags.length > 0 && (
          <View style={styles.memeTagsContainer}>
            {currentBest.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                activeOpacity={0.75}
                onPress={() => {
                  setQuery(tag);
                  const results = searchMemes(tag);
                  setSearchData(results);
                  setCurrentBest(results.bestMatch);
                  setAlternatives(results.alternatives);
                }}
              >
                <LiquidGlassView borderRadius={12} intensity={50} style={styles.liquidTagChip}>
                  <Text style={styles.liquidTagText}>#{tag}</Text>
                </LiquidGlassView>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* "Bu değil mi?" Heading + Liquid Glass "Sen ekle (+)" Button */}
        <View style={styles.actionRow}>
          <Text style={styles.questionText}>Bu değil mi?</Text>

          <ExpoUIButton
            label="Sen ekle"
            onPress={() => onOpenAddMeme(query)}
            iconName="add-circle"
          />
        </View>

        {/* 2x2 Grid of Alternative Memes (Liquid Glass Cards) */}
        <View style={styles.altGrid}>
          {alternatives.slice(0, 4).map((altMeme, index) => (
            <TouchableOpacity
              key={altMeme.id + '-' + index}
              activeOpacity={0.8}
              style={styles.altCardWrapper}
              onPress={() => handleSelectAlternative(altMeme, index)}
            >
              <LiquidGlassView borderRadius={18} intensity={60} style={styles.altLiquidCard}>
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
              </LiquidGlassView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Liquid Glass Bottom Navigation Bar */}
      <BottomNavBar activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
  liquidSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
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
    color: '#0284C7',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mainCardWrapper: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 6,
  },
  mainLiquidCard: {
    width: '100%',
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  mainMemeImage: {
    width: '100%',
    height: '100%',
  },
  captionBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  mainMemeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  bestBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
    marginBottom: 10,
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
    color: '#475569',
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
  liquidTagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liquidTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -0.4,
  },
  senEkleLiquidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  senEkleText: {
    fontSize: 14,
    fontWeight: '700',
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
  altCardWrapper: {
    width: '48%',
    height: 118,
  },
  altLiquidCard: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        } as any)
      : {}),
  },
  altCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});
