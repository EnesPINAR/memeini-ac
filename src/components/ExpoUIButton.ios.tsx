import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Host, Button } from '@expo/ui/swift-ui';
import { buttonStyle, tint, controlSize } from '@expo/ui/swift-ui/modifiers';
import { Ionicons } from '@expo/vector-icons';

export interface ExpoUIButtonProps {
  label: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const ExpoUIButton: React.FC<ExpoUIButtonProps> = ({
  label,
  onPress,
}) => {
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
});
