import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CARTOON_FONTS } from './cartoon/CartoonUI';

interface ColorfulTitleProps {
  fontSize?: number;
}

// Letter definitions matching Figma exact colorful rainbow sequence
const LETTERS = [
  { char: 'M', color: '#22C55E' },
  { char: 'e', color: '#38D668' },
  { char: 'm', color: '#2563EB' },
  { char: 'e', color: '#0EA5E9' },
  { char: "'", color: '#8B5CF6' },
  { char: 'i', color: '#A855F7' },
  { char: 'n', color: '#7C3AED' },
  { char: 'i', color: '#D946EF' },
  { char: ' ', color: 'transparent' },
  { char: 'B', color: '#9333EA' },
  { char: 'u', color: '#EC4899' },
  { char: 'l', color: '#F43F5E' },
];

// Multi-directional circular offsets + 3D bottom cartoon shadow for thick ink outline
const STROKE_OFFSETS = [
  { x: -3, y: 0 },
  { x: 3, y: 0 },
  { x: 0, y: -3 },
  { x: 0, y: 3 },
  { x: -2.2, y: -2.2 },
  { x: 2.2, y: -2.2 },
  { x: -2.2, y: 2.2 },
  { x: 2.2, y: 2.2 },
  { x: -3, y: -1.2 },
  { x: 3, y: -1.2 },
  { x: -3, y: 1.2 },
  { x: 3, y: 1.2 },
  { x: -1.2, y: -3 },
  { x: 1.2, y: -3 },
  { x: -1.2, y: 3 },
  { x: 1.2, y: 3 },
  // 3D bottom cartoon drop stroke
  { x: 0, y: 4.2 },
  { x: 1.6, y: 4.2 },
  { x: -1.6, y: 4.2 },
];

export const ColorfulTitle: React.FC<ColorfulTitleProps> = ({ fontSize = 38 }) => {
  const lineHeight = Math.round(fontSize * 1.32);

  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        {/* Pass 1: Thick black cartoon stroke outline behind the letters */}
        {STROKE_OFFSETS.map((offset, idx) => (
          <Text
            key={`stroke-${idx}`}
             accessible={false}
            importantForAccessibility="no"
            style={[
              styles.baseText,
              styles.strokeLayer,
              {
                fontSize,
                lineHeight,
                transform: [{ translateX: offset.x }, { translateY: offset.y }],
              },
            ]}
          >
            {LETTERS.map((item, charIdx) => (
              <Text key={`s-${idx}-${charIdx}`} style={styles.strokeChar}>
                {item.char}
              </Text>
            ))}
          </Text>
        ))}

        {/* Pass 2: Vibrant colorful fill on top (defines exact layout bounds) */}
        <Text
          style={[
            styles.baseText,
            {
              fontSize,
              lineHeight,
            },
          ]}
        >
          {LETTERS.map((item, index) => (
            <Text key={`fill-${index}`} style={{ color: item.color }}>
              {item.char}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    ...CARTOON_FONTS.extraBold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    includeFontPadding: false,
    textAlign: 'center',
  },
  strokeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: '#000000',
  },
  strokeChar: {
    color: '#000000',
  },
});

