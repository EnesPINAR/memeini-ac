import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Search, PlusCircle, Compass, UserCircle } from 'lucide-react-native';
import { CARTOON_COLORS } from './cartoon/CartoonUI';

export type TabType = 'search' | 'add' | 'explore' | 'profile';

interface BottomNavBarProps {
  activeTab?: TabType;
  onTabPress: (tab: TabType) => void;
}

const TAB_ITEMS: { id: TabType; color: string; Icon: any }[] = [
  { id: 'search', color: CARTOON_COLORS.yellow, Icon: Search },
  { id: 'add', color: CARTOON_COLORS.green, Icon: PlusCircle },
  { id: 'explore', color: CARTOON_COLORS.cyan, Icon: Compass },
  { id: 'profile', color: CARTOON_COLORS.pink, Icon: UserCircle },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'search',
  onTabPress,
}) => {
  const [pressedTab, setPressedTab] = useState<TabType | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.barWrapper}>
        {/* 3D Cartoon Hard Black Shadow */}
        <View style={styles.barShadow} />

        {/* Main Cartoon Capsule Nav Bar */}
        <View style={styles.pillBar}>
          {TAB_ITEMS.map(({ id, color, Icon }) => {
            const isActive = activeTab === id;
            const isPressed = pressedTab === id;

            return (
              <Pressable
                key={id}
                onPress={() => onTabPress(id)}
                onPressIn={() => setPressedTab(id)}
                onPressOut={() => setPressedTab(null)}
                style={styles.tabTouch}
              >
                <View
                  style={[
                    styles.iconBadge,
                    isActive && {
                      backgroundColor: color,
                      borderWidth: 2.5,
                      borderColor: '#000000',
                    },
                    isPressed && {
                      transform: [{ translateY: 2 }, { scale: 0.94 }],
                    },
                  ]}
                >
                  <Icon
                    size={28}
                    color="#000000"
                    strokeWidth={2.5}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 90,
  },
  barWrapper: {
    width: '100%',
    maxWidth: 360,
    height: 66,
    position: 'relative',
  },
  barShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#000000',
  },
  pillBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#000000',
    paddingHorizontal: 14,
  },
  tabTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
