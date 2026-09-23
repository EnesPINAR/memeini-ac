import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { CARTOON_COLORS } from './cartoon/CartoonUI';

interface StarRatingProps {
  initialRating?: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  onRate,
  readOnly = false,
  size = 25,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [pressedStar, setPressedStar] = useState<number | null>(null);

  const handlePress = (selectedStar: number) => {
    if (readOnly) return;
    const newRating = selectedStar === rating ? 0 : selectedStar;
    setRating(newRating);
    if (onRate) {
      onRate(newRating);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= rating;
        const isPressed = pressedStar === starIndex;

        return (
          <Pressable
            key={starIndex}
            disabled={readOnly}
            onPress={() => handlePress(starIndex)}
            onPressIn={() => setPressedStar(starIndex)}
            onPressOut={() => setPressedStar(null)}
            style={[
              styles.starTouch,
              isPressed && { transform: [{ scale: 1.25 }, { rotate: '-8deg' }] },
            ]}
          >
            <Star
              size={size}
              color="#000000"
              fill={isFilled ? CARTOON_COLORS.yellow : '#FFFFFF'}
              strokeWidth={2.5}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouch: {
    marginRight: 4,
    padding: 2,
  },
});
