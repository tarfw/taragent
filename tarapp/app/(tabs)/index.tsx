import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import StateForm from '../../src/screens/StateForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <StateForm />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

