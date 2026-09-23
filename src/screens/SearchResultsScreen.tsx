import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Search, UserCircle, X, Sparkles } from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { StarRating } from '../components/StarRating';
import { ExpoUIButton } from '../components/ExpoUIButton';
import {
  CartoonCard,
  CartoonSearchInput,
  CartoonBadge,
  RoughCornerAccent,
  CARTOON_COLORS,
} from '../components/cartoon/CartoonUI';
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
  const [query, setQuery] = useState(initialQuery || 'Örnek arama');
  const [searchData, setSearchData] = useState(() =>
    searchMemes(initialQuery || 'Örnek arama')
  );
  const [currentBest, setCurrentBest] = useState<MemeItem>(searchData.bestMatch);
  const [alternatives, setAlternatives] = useState<MemeItem[]>(
    searchData.alternatives
  );

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
        <Pressable onPress={onBackToHome} style={styles.titleContainer}>
          <ColorfulTitle fontSize={38} />
        </Pressable>

        {/* Cartoon 3D Search Bar */}
        <View style={styles.searchBarRow}>
          <CartoonSearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ornek arama"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            rightElement={
              <View style={styles.searchRight}>
                {query.length > 0 && (
                  <Pressable
                    onPress={() => setQuery('')}
                    style={styles.clearBtn}
                  >
                    <X size={16} color="#000000" strokeWidth={2.5} />
                  </Pressable>
                )}
                <Pressable
                  onPress={handleSearchSubmit}
                  style={styles.searchIconBtn}
                >
                  <Search size={20} color="#000000" strokeWidth={2.8} />
                </Pressable>
              </View>
            }
          />
        </View>

        {/* Main Card: "Aranan En Uyumlu Meme" (Cartoon 3D Card) */}
        <View style={styles.mainCardWrapper}>
          <CartoonCard
            borderRadius={24}
            shadowOffset={6}
            contentStyle={styles.mainMemeCard}
          >
            {currentBest.imageUrl ? (
              <Image
                source={{ uri: currentBest.imageUrl }}
                style={styles.mainMemeImage}
                resizeMode="cover"
              />
            ) : null}

            {/* Top Right Comic Sticker */}
            <View style={styles.topMatchSticker}>
              <Sparkles size={13} color="#000000" strokeWidth={2.5} />
              <Text style={styles.stickerText}>EN UYUMLU</Text>
            </View>

            {/* Cartoon Bottom Caption Strip */}
            <View style={styles.captionBanner}>
              <Text style={styles.mainMemeLabel} numberOfLines={1}>
                {currentBest.title || 'Aranan En Uyumlu Meme'}
              </Text>
            </View>
          </CartoonCard>
        </View>

        {/* Card Footer: 5 Cartoon Stars on Left, Uploader Chip on Right */}
        <View style={styles.cardFooter}>
          <StarRating initialRating={currentBest.rating} size={24} />

          <View style={styles.uploaderPill}>
            <UserCircle size={22} color="#000000" strokeWidth={2.5} />
            <Text style={styles.uploaderNickname}>
              {currentBest.uploaderNickname || 'Yükleyen nickname'}
            </Text>
          </View>
        </View>

        {/* Associated Meme Tags (Cartoon Pop Badges) */}
        {currentBest.tags && currentBest.tags.length > 0 && (
          <View style={styles.memeTagsContainer}>
            {currentBest.tags.map((tag, idx) => (
              <CartoonBadge
                key={tag}
                tag={tag}
                index={idx}
                onPress={() => {
                  setQuery(tag);
                  const results = searchMemes(tag);
                  setSearchData(results);
                  setCurrentBest(results.bestMatch);
                  setAlternatives(results.alternatives);
                }}
              />
            ))}
          </View>
        )}

        {/* "Bu değil mi?" Heading + Cartoon "Sen ekle (+)" Button */}
        <View style={styles.actionRow}>
          <View>
            <Text style={styles.questionText}>Bu değil mi?</Text>
            <RoughCornerAccent width={95} height={10} color="#000000" />
          </View>

          <ExpoUIButton
            label="Sen ekle"
            onPress={() => onOpenAddMeme(query)}
            bgColor={CARTOON_COLORS.yellow}
          />
        </View>

        {/* 2x2 Grid of Alternative Memes (Cartoon 3D Cards) */}
        <View style={styles.altGrid}>
          {alternatives.slice(0, 4).map((altMeme, index) => (
            <Pressable
              key={altMeme.id + '-' + index}
              style={styles.altCardWrapper}
              onPress={() => handleSelectAlternative(altMeme, index)}
            >
              <CartoonCard
                borderRadius={18}
                shadowOffset={4}
                contentStyle={styles.altCardInner}
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
              </CartoonCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Cartoon 3D Bottom Navigation Bar */}
      <BottomNavBar activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
    alignItems: 'center',
  },
  titleContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  searchBarRow: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 20,
  },
  searchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARTOON_COLORS.cyan,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardWrapper: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 10,
  },
  mainMemeCard: {
    width: '100%',
    height: 215,
    backgroundColor: '#FFFFFF',
  },
  mainMemeImage: {
    width: '100%',
    height: '100%',
  },
  topMatchSticker: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  stickerText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  captionBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderTopWidth: 3,
    borderTopColor: '#000000',
    alignItems: 'center',
  },
  mainMemeLabel: {
    fontFamily: 'Fredoka_700Bold',
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
    maxWidth: 360,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  uploaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARTOON_COLORS.pastelGreen,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  uploaderNickname: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  questionText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  altGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 360,
    rowGap: 16,
  },
  altCardWrapper: {
    width: '47.5%',
    height: 115,
  },
  altCardInner: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopWidth: 2.5,
    borderTopColor: '#000000',
    alignItems: 'center',
  },
  altCardText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
});
