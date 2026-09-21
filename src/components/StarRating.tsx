import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  size = 20,
}) => {
  const [rating, setRating] = useState(initialRating);

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
        return (
          <TouchableOpacity
            key={starIndex}
            activeOpacity={0.65}
            disabled={readOnly}
            onPress={() => handlePress(starIndex)}
            style={styles.starTouch}
          >
            <Ionicons
              name={isFilled ? 'star' : 'star'}
              size={size}
              color={isFilled ? '#FF9500' : '#E5E5EA'}
            />
          </TouchableOpacity>
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
    marginRight: 2,
    padding: 2,
  },
});
