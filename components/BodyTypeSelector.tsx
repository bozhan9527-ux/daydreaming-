import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BodyType } from '../game/sprites/heroSilhouette';
import { useGameState } from '../hooks/useGameState';

const BODY_TYPE_LABELS: Record<BodyType, string> = {
  thin: '瘦',
  normal: '標準',
  fat: '胖',
};

const BODY_TYPES: BodyType[] = ['thin', 'normal', 'fat'];

export function BodyTypeSelector() {
  const bodyType = useGameState((state) => state.bodyType);
  const setBodyType = useGameState((state) => state.setBodyType);

  return (
    <View style={styles.row}>
      {BODY_TYPES.map((type) => (
        <Pressable
          key={type}
          style={[styles.button, bodyType === type && styles.buttonActive]}
          onPress={() => setBodyType(type)}
        >
          <Text style={styles.label}>{BODY_TYPE_LABELS[type]}</Text>
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
