import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface LiquidGlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({
  children,
  style,
  intensity = 60,
  tint = 'light',
  borderRadius = 20,
}) => {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webGlassBase,
          { borderRadius },
          style,
        ]}
      >
        {/* Specular glare reflection at the top */}
        <View style={[styles.topGlare, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} pointerEvents="none" />
        {children}
      </View>
    );
  }

  // Native iOS / Android with Expo BlurView
  return (
    <View style={[styles.nativeWrapper, { borderRadius }, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View style={[styles.nativeGlassOverlay, { borderRadius }]} pointerEvents="none">
        <View style={[styles.topGlare, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  webGlassBase: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(190%) contrast(102%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%) contrast(102%)',
          boxShadow:
            '0 12px 32px 0 rgba(31, 38, 135, 0.14), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04)',
        } as any)
      : {}),
  },
  nativeWrapper: {
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  nativeGlassOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  topGlare: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
