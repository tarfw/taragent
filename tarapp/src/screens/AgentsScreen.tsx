import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { sendCommerceAction } from '../api/client';
import { Ionicons } from '@expo/vector-icons';

export default function AgentsScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAgentInput = async () => {
    if (!query) return;

    setLoading(true);
    setResult(null);

    try {
      // Hit the Semantic Search / AI interpreter endpoint.
      const r = await fetch("https://taragent.wetarteam.workers.dev/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "app_agent",
          userId: "mobile_user_01",
          scope: "shop:main",
          action: "SEARCH",
          text: query
        })
      });
      const response = await r.json();
      
      setResult(response);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="hardware-chip" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>AI Agents</Text>
          <Text style={styles.headerSubtitle}>Semantic search and natural language automation.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Agent Input / Search</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="sparkles" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="e.g. sell 2 running shoes"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable 
              style={({pressed}) => [styles.primaryButton, pressed && styles.buttonPressed]} 
              onPress={handleAgentInput} 
              disabled={loading}
            >
              <Ionicons name="send" size={20} color="#fff" style={{marginRight: 6}} />
              <Text style={styles.primaryButtonText}>Process Intent</Text>
            </Pressable>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </View>
        
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.resultTitle}>Agent Output</Text>
            </View>
            <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#000', 
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#000',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#000',
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 24,
    backgroundColor: '#282A36',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#44475A',
    paddingBottom: 10,
  },
  resultTitle: {
    color: '#F8F8F2',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultJson: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#50FA7B',
  }
});
