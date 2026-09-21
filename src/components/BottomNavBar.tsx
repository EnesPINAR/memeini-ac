import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const getIconColor = (tab: TabType) => {
    return activeTab === tab ? '#007AFF' : '#8E8E93';
  };

  return (
    <View style={styles.container}>
      <View style={styles.iosTabBar}>
        {/* 1. Search */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('search')}
          style={styles.tabItem}
          accessibilityLabel="Arama"
        >
          <Ionicons
            name={activeTab === 'search' ? 'search' : 'search-outline'}
            size={26}
            color={getIconColor('search')}
          />
          {activeTab === 'search' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* 2. Add Meme */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('add')}
          style={styles.tabItem}
          accessibilityLabel="Meme Ekle"
        >
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* 3. Explore */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('explore')}
          style={styles.tabItem}
          accessibilityLabel="Keşfet"
        >
          <Ionicons
            name={activeTab === 'explore' ? 'compass' : 'compass-outline'}
            size={27}
            color={getIconColor('explore')}
          />
          {activeTab === 'explore' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* 4. Profile */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('profile')}
          style={styles.tabItem}
          accessibilityLabel="Profil"
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'}
            size={27}
            color={getIconColor('profile')}
          />
          {activeTab === 'profile' && <View style={styles.activeDot} />}
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
    zIndex: 90,
  },
  iosTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 360,
    height: 60,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.88)' : '#FFFFFF',
    borderRadius: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
});
