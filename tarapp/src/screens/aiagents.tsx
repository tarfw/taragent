import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
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
      setQuery(''); // Clear input on success
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Agents</Text>
          </View>

          {!result && !loading && (
            <View style={styles.emptyState}>
              <View style={styles.sparkleContainer}>
                <Ionicons name="sparkles" size={40} color="#007AFF" />
              </View>
              <Text style={styles.emptyText}>Ask your agent to perform actions</Text>
              <Text style={styles.emptySubtext}>"sell 2 running shoes" or "check inventory"</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}

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

        {/* Bottom Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Message Agent..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={200}
            />
            <Pressable 
              style={({pressed}) => [
                styles.sendButton, 
                (!query || loading) && styles.sendButtonDisabled,
                pressed && styles.buttonPressed
              ]} 
              onPress={handleAgentInput}
              disabled={!query || loading}
            >
              <Ionicons name="arrow-up" size={24} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
  },
  sparkleContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#007AFF10',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  resultJson: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#3A3A3C',
    lineHeight: 18,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    backgroundColor: '#000',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonPressed: {
    opacity: 0.7,
  }
});
