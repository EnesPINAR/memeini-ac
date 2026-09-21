import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Text as SvgText, TSpan } from 'react-native-svg';

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

export const ColorfulTitle: React.FC<ColorfulTitleProps> = ({ fontSize = 38 }) => {
  const svgWidth = fontSize * 7.5;
  const svgHeight = fontSize * 1.5;

  return (
    <View style={styles.container}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={styles.svg}
      >
        {/* Pass 1: Thick black stroke outline behind the letters */}
        <SvgText
          x="50%"
          y="72%"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="900"
          fontFamily={Platform.OS === 'ios' ? 'Arial Rounded MT Bold' : 'sans-serif-medium'}
          stroke="#000000"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {LETTERS.map((item, index) => (
            <TSpan key={`stroke-${index}`} fill="#000000">
              {item.char}
            </TSpan>
          ))}
        </SvgText>

        {/* Pass 2: Vibrant colorful fill on top */}
        <SvgText
          x="50%"
          y="72%"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="900"
          fontFamily={Platform.OS === 'ios' ? 'Arial Rounded MT Bold' : 'sans-serif-medium'}
        >
          {LETTERS.map((item, index) => (
            <TSpan key={`fill-${index}`} fill={item.color}>
              {item.char}
            </TSpan>
          ))}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'visible',
  },
});
