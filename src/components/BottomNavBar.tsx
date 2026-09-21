import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from './LiquidGlassView';

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
    return activeTab === tab ? '#007AFF' : '#64748B';
  };

  return (
    <View style={styles.container}>
      <LiquidGlassView
        borderRadius={34}
        intensity={70}
        style={styles.liquidTabBar}
      >
        {/* 1. Search */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('search')}
          style={styles.tabItem}
          accessibilityLabel="Arama"
        >
          <Ionicons
            name={activeTab === 'search' ? 'search' : 'search-outline'}
            size={25}
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
          <View style={styles.addLiquidCircle}>
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
            size={26}
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
            size={26}
            color={getIconColor('profile')}
          />
          {activeTab === 'profile' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </LiquidGlassView>
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
    paddingHorizontal: 20,
    zIndex: 90,
  },
  liquidTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 360,
    height: 64,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  addLiquidCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
