import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import rough from 'roughjs';

// Color Palette for Cartoon Pop UI
export const CARTOON_COLORS = {
  yellow: '#FFE600',
  pink: '#FF5E99',
  cyan: '#00E5FF',
  green: '#4ADE80',
  purple: '#C084FC',
  orange: '#FF9F1C',
  white: '#FFFFFF',
  cream: '#FFFDF5',
  black: '#000000',
  pastelYellow: '#FEF08A',
  pastelBlue: '#BAE6FD',
  pastelPink: '#FBCFE8',
  pastelGreen: '#BBF7D0',
  pastelPurple: '#E9D5FF',
};

const TAG_PALETTE = [
  CARTOON_COLORS.pastelYellow,
  CARTOON_COLORS.pastelBlue,
  CARTOON_COLORS.pastelPink,
  CARTOON_COLORS.pastelGreen,
  CARTOON_COLORS.pastelPurple,
];

/**
 * Hand-drawn SVG ornament generated via Rough.js
 */
export const RoughCornerAccent: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 60,
  height = 20,
  color = '#000000',
}) => {
  const paths = useMemo(() => {
    try {
      const gen = rough.generator();
      const drawable = gen.line(4, height / 2, width - 4, height / 2, {
        roughness: 1.8,
        bowing: 2,
        stroke: color,
        strokeWidth: 2.5,
      });
      return gen.toPaths(drawable);
    } catch {
      return [];
    }
  }, [width, height, color]);

  return (
    <Svg width={width} height={height} style={{ opacity: 0.25 }}>
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill={p.fill || 'none'}
        />
      ))}
    </Svg>
  );
};

interface CartoonCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bgColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
}

/**
 * 3D Comic / Cartoon Card with thick ink border and hard offset shadow
 */
export const CartoonCard: React.FC<CartoonCardProps> = ({
  children,
  style,
  contentStyle,
  bgColor = '#FFFFFF',
  shadowOffset = 5,
  borderRadius = 24,
}) => {
  return (
    <View style={[styles.cardWrapper, style]}>
      {/* Hard Black 3D Cartoon Shadow Block */}
      <View
        style={[
          styles.shadowBlock,
          {
            borderRadius,
            top: shadowOffset,
            left: shadowOffset,
          },
        ]}
      />
      {/* Main Inked Foreground Card */}
      <View
        style={[
          styles.cardBody,
          {
            backgroundColor: bgColor,
            borderRadius,
          },
          contentStyle,
        ]}
      >
        {/* Cartoon Specular Shine Mark */}
        <View style={styles.cardShine} pointerEvents="none" />
        {children}
      </View>
    </View>
  );
};

interface CartoonButtonProps {
  label?: string;
  onPress: () => void;
  bgColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderRadius?: number;
  shadowSize?: number;
}

/**
 * Interactive Bouncy Cartoon Button with Press-In Physics
 */
export const CartoonButton: React.FC<CartoonButtonProps> = ({
  label,
  onPress,
  bgColor = CARTOON_COLORS.yellow,
  textColor = '#000000',
  icon,
  rightIcon,
  style,
  textStyle,
  borderRadius = 24,
  shadowSize = 4,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.btnContainer, style]}
    >
      {/* Hard Black Cartoon Shadow */}
      <View
        style={[
          styles.btnShadow,
          {
            borderRadius,
            top: shadowSize,
            left: shadowSize,
          },
        ]}
      />

      {/* Button Face that physically pushes into the shadow when pressed */}
      <View
        style={[
          styles.btnFace,
          {
            backgroundColor: bgColor,
            borderRadius,
            transform: pressed
              ? [{ translateX: shadowSize - 1 }, { translateY: shadowSize - 1 }]
              : [{ translateX: 0 }, { translateY: 0 }],
          },
        ]}
      >
        {/* Top Cartoon Gloss Bubble */}
        <View style={styles.btnShine} pointerEvents="none" />

        {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
        {label ? (
          <Text style={[styles.btnText, { color: textColor }, textStyle]}>
            {label}
          </Text>
        ) : null}
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
};

interface CartoonBadgeProps {
  tag: string;
  index?: number;
  onPress?: () => void;
}

/**
 * Playful Cartoon Tag Chip (#tag)
 */
export const CartoonBadge: React.FC<CartoonBadgeProps> = ({
  tag,
  index = 0,
  onPress,
}) => {
  const [pressed, setPressed] = useState(false);
  const bgColor = TAG_PALETTE[index % TAG_PALETTE.length];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.badgeWrapper}
    >
      <View style={styles.badgeShadow} />
      <View
        style={[
          styles.badgeFace,
          {
            backgroundColor: bgColor,
            transform: pressed
              ? [{ translateX: 2 }, { translateY: 2 }]
              : [{ translateX: 0 }, { translateY: 0 }],
          },
        ]}
      >
        <Text style={styles.badgeText}>#{tag}</Text>
      </View>
    </Pressable>
  );
};

interface CartoonSearchInputProps extends TextInputProps {
  onSearchPress?: () => void;
  onClearPress?: () => void;
  rightElement?: React.ReactNode;
}

/**
 * Cartoon Pill Search Bar with 3D Ink Shadow
 */
export const CartoonSearchInput: React.FC<CartoonSearchInputProps> = ({
  value,
  onSearchPress,
  onClearPress,
  rightElement,
  ...rest
}) => {
  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchShadow} />
      <View style={styles.searchBody}>
        <TextInput
          value={value}
          style={styles.searchInput}
          placeholderTextColor="#555555"
          {...rest}
        />
        {rightElement}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  shadowBlock: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  cardBody: {
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  cardShine: {
    position: 'absolute',
    top: 6,
    left: 14,
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    zIndex: 10,
  },
  btnContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  btnShadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  btnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
  },
  btnShine: {
    position: 'absolute',
    top: 3,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  btnText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  badgeWrapper: {
    position: 'relative',
    marginBottom: 4,
    marginRight: 4,
  },
  badgeShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  badgeFace: {
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
  },
  searchShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#000000',
  },
  searchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#000000',
    paddingHorizontal: 18,
    height: 54,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 8,
  },
});
