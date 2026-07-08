import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gender } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';

const GENDER_LABELS: Record<Gender, string> = {
  male: '男性',
  female: '女性',
};

const GENDERS: Gender[] = ['male', 'female'];

export function GenderSelector() {
  const gender = useGameState((state) => state.gender);
  const setGender = useGameState((state) => state.setGender);

  return (
    <View style={styles.row}>
      {GENDERS.map((option) => (
        <Pressable
          key={option}
          style={[styles.button, gender === option && styles.buttonActive]}
          onPress={() => setGender(option)}
        >
          <Text style={styles.label}>{GENDER_LABELS[option]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  buttonActive: {
    backgroundColor: '#4a4456',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
