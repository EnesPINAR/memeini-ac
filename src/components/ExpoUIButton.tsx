import React from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Host, Button } from '@expo/ui/swift-ui';
import { buttonStyle, tint, controlSize } from '@expo/ui/swift-ui/modifiers';
import { LiquidGlassView } from './LiquidGlassView';

interface ExpoUIButtonProps {
  label: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const ExpoUIButton: React.FC<ExpoUIButtonProps> = ({
  label,
  onPress,
  iconName = 'add-circle',
}) => {
  // Native iOS: Use real SwiftUI Button with Expo UI
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.hostWrapper}>
        <Host style={styles.host}>
          <Button
            label={label}
            systemImage="plus.circle.fill"
            onPress={onPress}
            modifiers={[
              buttonStyle('borderedProminent'),
              tint('#0284C7'),
              controlSize('regular'),
            ]}
          />
        </Host>
      </View>
    );
  }

  // Web & Android: Premium Liquid Glass Button with iOS styling
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <LiquidGlassView borderRadius={20} intensity={70} style={styles.liquidBtn}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" style={styles.btnIcon} />
        <Text style={styles.btnText}>{label}</Text>
      </LiquidGlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hostWrapper: {
    height: 38,
    minWidth: 110,
    justifyContent: 'center',
  },
  host: {
    height: 38,
    minWidth: 110,
  },
  liquidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
