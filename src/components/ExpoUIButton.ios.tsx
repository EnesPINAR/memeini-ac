import React from 'react';
import { PlusCircle } from 'lucide-react-native';
import { CartoonButton, CARTOON_COLORS } from './cartoon/CartoonUI';

export interface ExpoUIButtonProps {
  label: string;
  onPress: () => void;
  iconName?: string;
  bgColor?: string;
}

export const ExpoUIButton: React.FC<ExpoUIButtonProps> = ({
  label,
  onPress,
  bgColor = CARTOON_COLORS.yellow,
}) => {
  return (
    <CartoonButton
      label={label}
      onPress={onPress}
      bgColor={bgColor}
      textColor="#000000"
      rightIcon={<PlusCircle size={22} color="#000000" strokeWidth={2.5} />}
      borderRadius={24}
      shadowSize={4}
    />
  );
};
