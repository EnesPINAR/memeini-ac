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
  Platform,
} from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import rough from 'roughjs';

// Cross-platform font presets:
// On native (iOS/Android), omitting fontWeight when using static PostScript font names
// prevents React Native from failing font-weight descriptor lookups and falling back to system fonts.
export const CARTOON_FONTS = {
  extraBold: Platform.select<TextStyle>({
    web: {
      fontFamily: "'Baloo 2', 'Baloo2-ExtraBold', 'Fredoka', sans-serif",
      fontWeight: '800',
    },
    default: {
      fontFamily: 'Baloo2-ExtraBold',
    },
  })!,
  bold: Platform.select<TextStyle>({
    web: {
      fontFamily: "'Baloo 2', 'Baloo2-Bold', 'Fredoka', sans-serif",
      fontWeight: '700',
    },
    default: {
      fontFamily: 'Baloo2-Bold',
    },
  })!,
  semiBold: Platform.select<TextStyle>({
    web: {
      fontFamily: "'Baloo 2', 'Baloo2-SemiBold', 'Fredoka', sans-serif",
      fontWeight: '600',
    },
    default: {
      fontFamily: 'Baloo2-SemiBold',
    },
  })!,
};

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

export type GlossSize = 'xs' | 'sm' | 'md' | 'lg';

const GLOSS_PRESETS: Record<
  GlossSize,
  { width: number; height: number; top: number; left: number }
> = {
  xs: { width: 13, height: 11, top: 2, left: 3 },
  sm: { width: 13, height: 11, top: 2, left: 3 },
  md: { width: 14, height: 12, top: 2.5, left: 3.5 },
  lg: { width: 15, height: 13, top: 3, left: 4 },
};

/**
 * Organic Top-Left Cartoon Bubble Gloss (Plump Curved Jelly-Bean + Companion Droplet Dot)
 * Sized compactly like tag badges across all buttons and UI elements.
 */
export const CartoonCornerGloss: React.FC<{
  size?: GlossSize;
  top?: number;
  left?: number;
  opacity?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}> = ({
  size = 'xs',
  top,
  left,
  opacity = 0.85,
  color = '#FFFFFF',
  style,
}) => {
  const preset = GLOSS_PRESETS[size];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.cornerGlossWrap,
        {
          top: top ?? preset.top,
          left: left ?? preset.left,
        },
        style,
      ]}
    >
      <Svg
        width={preset.width}
        height={preset.height}
        viewBox="0 0 28 24"
      >
        {/* Main plump curved jelly-bean highlight hugging the top-left corner arc */}
        <Path
          d="M 6.6 11.4 C 5.6 7.4, 10.4 2.6, 17.0 2.3 C 20.8 2.1, 23.0 4.4, 22.0 7.3 C 21.1 10.1, 17.2 11.1, 13.4 12.3 C 9.7 13.5, 7.4 14.2, 6.6 11.4 Z"
          fill={color}
          fillOpacity={opacity}
        />
        {/* Lower-left soft round companion bubble dot along the curve */}
        <Ellipse
          cx="5.2"
          cy="17.0"
          rx="2.6"
          ry="2.8"
          transform="rotate(-14 5.2 17.0)"
          fill={color}
          fillOpacity={opacity}
        />
      </Svg>
    </View>
  );
};

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
  onPress?: () => void;
  interactive?: boolean;
  showGloss?: boolean;
}

/**
 * 3D Comic / Cartoon Card with thick ink border, hard offset shadow, and optional 3D hover/press physics.
 * By default showGloss is false so meme images/videos have no artificial shine overlay.
 */
export const CartoonCard: React.FC<CartoonCardProps> = ({
  children,
  style,
  contentStyle,
  bgColor = '#FFFFFF',
  shadowOffset = 5,
  borderRadius = 24,
  onPress,
  interactive = false,
  showGloss = false,
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isInteractive = interactive || Boolean(onPress);

  const offsetXY = isInteractive
    ? pressed
      ? shadowOffset - 1
      : hovered
      ? Math.max(2, Math.round(shadowOffset * 0.6))
      : 0
    : 0;

  const cardInner = (
    <>
      {/* Hard Black 3D Cartoon Shadow Block */}
      <View
        pointerEvents="none"
        style={[
          styles.shadowBlock,
          {
            borderRadius,
            top: shadowOffset,
            left: shadowOffset,
            right: -shadowOffset,
            bottom: -shadowOffset,
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
            transform: [{ translateX: offsetXY }, { translateY: offsetXY }],
          },
          contentStyle,
        ]}
      >
        {showGloss && <CartoonCornerGloss size="xs" top={3} left={4} />}
        {children}
      </View>
    </>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.cardWrapper, style]}
      >
        {cardInner}
      </Pressable>
    );
  }

  return <View style={[styles.cardWrapper, style]}>{cardInner}</View>;
};

interface CartoonButtonProps {
  label?: string;
  onPress: () => void;
  bgColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderRadius?: number;
  shadowSize?: number;
}

/**
 * Interactive Bouncy Cartoon Button with Hover & Press-In Physics
 */
export const CartoonButton: React.FC<CartoonButtonProps> = ({
  label,
  onPress,
  bgColor = CARTOON_COLORS.yellow,
  textColor = '#000000',
  icon,
  rightIcon,
  style,
  faceStyle,
  textStyle,
  borderRadius = 24,
  shadowSize = 4,
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const offsetXY = pressed
    ? shadowSize - 1
    : hovered
    ? Math.max(1.5, shadowSize - 1.5)
    : 0;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.btnContainer, style]}
    >
      {/* Hard Black Cartoon Shadow (anchored to exact 4 edges of btnContainer shifted by shadowSize) */}
      <View
        pointerEvents="none"
        style={[
          styles.btnShadow,
          {
            backgroundColor: '#000000',
            borderRadius,
            top: shadowSize,
            left: shadowSize,
            right: -shadowSize,
            bottom: -shadowSize,
          },
        ]}
      />

      {/* Button Face that physically pushes into the shadow when hovered or pressed */}
      <View
        style={[
          styles.btnFace,
          {
            backgroundColor: bgColor,
            borderRadius,
            transform: [{ translateX: offsetXY }, { translateY: offsetXY }],
          },
          faceStyle,
        ]}
      >
        {/* Small Tag-Sized Top-Left Cartoon Bubble Gloss */}
        <CartoonCornerGloss size="xs" top={2} left={3} opacity={0.85} />

        {icon ? <View style={label ? styles.iconLeft : undefined}>{icon}</View> : null}
        {label ? (
          <Text style={[styles.btnText, { color: textColor }, textStyle]}>
            {label}
          </Text>
        ) : null}
        {rightIcon ? <View style={label ? styles.iconRight : undefined}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
};

interface CartoonBadgeProps {
  tag: string;
  index?: number;
  onPress?: () => void;
  selected?: boolean;
}

/**
 * Playful Cartoon Tag Chip (#tag)
 */
export const CartoonBadge: React.FC<CartoonBadgeProps> = ({
  tag,
  index = 0,
  onPress,
  selected = false,
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bgColor = selected
    ? CARTOON_COLORS.yellow
    : TAG_PALETTE[index % TAG_PALETTE.length];
  const offsetXY = pressed ? 2 : selected || hovered ? 1.5 : 0;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.badgeWrapper}
    >
      <View pointerEvents="none" style={styles.badgeShadow} />
      <View
        style={[
          styles.badgeFace,
          {
            backgroundColor: bgColor,
            borderWidth: selected ? 3 : 2.5,
            transform: [{ translateX: offsetXY }, { translateY: offsetXY }],
          },
        ]}
      >
        <CartoonCornerGloss size="xs" top={2} left={3} opacity={0.85} />
        <Text style={styles.badgeText}>
          #{tag}
          {selected ? ' ✓' : ''}
        </Text>
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
      <View pointerEvents="none" style={styles.searchShadow} />
      <View style={styles.searchBody}>
        <CartoonCornerGloss size="xs" top={3} left={6} opacity={0.85} />
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
  cornerGlossWrap: {
    position: 'absolute',
    zIndex: 10,
  },
  cardWrapper: {
    position: 'relative',
  },
  shadowBlock: {
    position: 'absolute',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  cardBody: {
    position: 'relative',
    zIndex: 2,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  btnContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  btnShadow: {
    position: 'absolute',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  btnFace: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  btnText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 15,
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
    right: -3,
    bottom: -3,
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  badgeFace: {
    position: 'relative',
    zIndex: 2,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    ...CARTOON_FONTS.extraBold,
    fontSize: 13,
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
    zIndex: 1,
  },
  searchBody: {
    position: 'relative',
    zIndex: 2,
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
    ...CARTOON_FONTS.semiBold,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
  },
});
