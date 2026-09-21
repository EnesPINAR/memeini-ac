import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TabType = 'search' | 'add' | 'explore' | 'profile';

interface BottomNavBarProps {
  activeTab?: TabType;
  onTabPress: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'search',
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.pillBar}>
        {/* 1. Search */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('search')}
          style={styles.iconButton}
          accessibilityLabel="Arama"
        >
          <Ionicons
            name="search-outline"
            size={30}
            color="#000000"
            style={activeTab === 'search' ? styles.activeIcon : undefined}
          />
        </TouchableOpacity>

        {/* 2. Add Meme */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('add')}
          style={styles.iconButton}
          accessibilityLabel="Meme Ekle"
        >
          <Ionicons
            name="add-circle-outline"
            size={32}
            color="#000000"
            style={activeTab === 'add' ? styles.activeIcon : undefined}
          />
        </TouchableOpacity>

        {/* 3. Explore */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('explore')}
          style={styles.iconButton}
          accessibilityLabel="Keşfet"
        >
          <Ionicons
            name="compass-outline"
            size={32}
            color="#000000"
            style={activeTab === 'explore' ? styles.activeIcon : undefined}
          />
        </TouchableOpacity>

        {/* 4. Profile */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('profile')}
          style={styles.iconButton}
          accessibilityLabel="Profil"
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color="#000000"
            style={activeTab === 'profile' ? styles.activeIcon : undefined}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 380,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeIcon: {
    transform: [{ scale: 1.08 }],
  },
});
