import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import RelayScreen from '../../src/screens/RelayScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RelayTab() {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <RelayScreen />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
