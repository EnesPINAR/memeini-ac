import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface ColorfulTitleProps {
  fontSize?: number;
}

// Apple iOS System Palette colors matching the colorful name sequence
const LETTERS = [
  { char: 'M', color: '#34C759' }, // iOS System Green
  { char: 'e', color: '#30D158' },
  { char: 'm', color: '#007AFF' }, // iOS System Blue
  { char: 'e', color: '#5AC8FA' }, // iOS System Teal
  { char: "'", color: '#5856D6' }, // iOS System Indigo
  { char: 'i', color: '#AF52DE' }, // iOS System Purple
  { char: 'n', color: '#7857FF' },
  { char: 'i', color: '#FF2D55' }, // iOS System Pink
  { char: ' ', color: 'transparent' },
  { char: 'B', color: '#AF52DE' },
  { char: 'u', color: '#FF2D55' },
  { char: 'l', color: '#FF3B30' }, // iOS System Red
];

export const ColorfulTitle: React.FC<ColorfulTitleProps> = ({ fontSize = 34 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {LETTERS.map((item, index) => (
          <Text
            key={index}
            style={[
              styles.letter,
              {
                fontSize,
                color: item.color,
              },
            ]}
          >
            {item.char}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
