import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from './LiquidGlassView';

export interface ExpoUIButtonProps {
  label: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const ExpoUIButton: React.FC<ExpoUIButtonProps> = ({
  label,
  onPress,
  iconName = 'add-circle',
}) => {
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
