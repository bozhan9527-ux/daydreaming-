import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>勇者發呆中</Text>
      <Pressable style={styles.hero}>
        <Text style={styles.heroLabel}>戳戳看</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f14',
    gap: 24,
  },
  title: {
    fontSize: 20,
    color: '#f2f2f2',
  },
  hero: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: '#8a8a95',
  },
});
