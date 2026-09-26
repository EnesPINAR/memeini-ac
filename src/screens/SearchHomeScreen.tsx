import React, { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ImageBackground,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { Search, X } from 'lucide-react-native';
import { ColorfulTitle } from '../components/ColorfulTitle';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import {
  CartoonSearchInput,
  CartoonBadge,
  CartoonCornerGloss,
  CARTOON_COLORS,
} from '../components/cartoon/CartoonUI';

interface SearchHomeScreenProps {
  onSearch: (query: string) => void;
  onTabPress: (tab: TabType) => void;
}

const POPULAR_TAGS = ['hamster', 'yazılımcı', 'kedi', 'doge', 'sınav', 'pazartesi'];
const BG_SOURCE = require('../../assets/images/rainbow_hamsters.jpg');

export const SearchHomeScreen: React.FC<SearchHomeScreenProps> = ({
  onSearch,
  onTabPress,
}) => {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  // Consistent top spacing from the very top of the full-bleed background image across Web, iOS, and Android
  const topOffset = Math.max(insets.top + 82, 142);

  // Use local on-device file URI if available, fallback to bundled asset
  const bgAsset = Asset.fromModule(BG_SOURCE);
  const imageSource = bgAsset.localUri ? { uri: bgAsset.localUri } : BG_SOURCE;

  const handleSearchSubmit = () => {
    if (query.trim()) {
      Keyboard.dismiss();
      onSearch(query.trim());
    } else {
      onSearch('hamster');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background illustration loaded locally from device cache */}
      <ImageBackground
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Spacing to position right under the rainbow consistently on Web & Mobile */}
            <View style={{ height: topOffset }} />

            {/* Original Colorful Title "Meme'ini Bul" */}
            <View style={styles.titleContainer}>
              <ColorfulTitle fontSize={40} />
            </View>

            {/* Cartoon 3D Search Bar */}
            <View style={styles.searchBarContainer}>
              <CartoonSearchInput
                value={query}
                onChangeText={setQuery}
                placeholder="Meme veya etiket ara..."
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                autoCorrect={false}
                rightElement={
                  <View style={styles.searchActions}>
                    {query.length > 0 && (
                      <Pressable
                        onPress={() => setQuery('')}
                        style={styles.clearBtn}
                      >
                        <X size={18} color="#000000" strokeWidth={2.5} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={handleSearchSubmit}
                      style={styles.searchTriggerBtn}
                    >
                      <CartoonCornerGloss size="sm" top={2} left={3} />
                      <Search size={22} color="#000000" strokeWidth={2.8} />
                    </Pressable>
                  </View>
                }
              />
            </View>

            {/* Cartoon Pop Tag Badges (Single-line Horizontal Scroll) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScroll}
              contentContainerStyle={styles.tagsContainer}
            >
              {POPULAR_TAGS.map((tag, idx) => (
                <CartoonBadge
                  key={tag}
                  tag={tag}
                  index={idx}
                  onPress={() => onSearch(tag)}
                />
              ))}
            </ScrollView>
          </ScrollView>

          {/* Cartoon 3D Bottom Navigation Bar */}
          <BottomNavBar activeTab="search" onTabPress={onTabPress} />
        </View>
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
    height: 126,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBarContainer: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 20,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CARTOON_COLORS.pastelPink,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTriggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CARTOON_COLORS.yellow,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsScroll: {
    width: '100%',
    maxWidth: 360,
    flexGrow: 0,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
