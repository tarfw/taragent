import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useAgentState } from '@/hooks/useAgentState';

export default function AgentsScreen() {
  const { loading, result } = useAgentState();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Agents</Text>

        {!result && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Ask anything</Text>
            <Text style={styles.emptySubtext}>sell 2 running shoes, check inventory...</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 160,
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  emptyState: {
    marginTop: '30%',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 6,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  resultJson: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#3A3A3C',
    lineHeight: 18,
  },
});
