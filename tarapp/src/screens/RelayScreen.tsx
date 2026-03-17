import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RelayScreen() {
  const handleCopy = (text: string) => {
    // In a real app we'd use expo-clipboard
    Alert.alert("Copied Endpoint", text);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="swap-horizontal" size={32} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Relay Endpoints</Text>
        <Text style={styles.headerSubtitle}>Connect your Universal Commerce OS to external channels like Telegram or Slack.</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Channels</Text>

      {/* Telegram Node */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="paper-plane" size={24} color="#0088cc" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Telegram Bot Integration</Text>
        </View>
        <Text style={styles.cardDescription}>
          Send AI commands securely from Telegram to manipulate commerce state.
        </Text>
        <View style={styles.endpointBox}>
          <Text style={styles.endpointUrl} numberOfLines={1} ellipsizeMode="middle">
            https://taragent.wetarteam.workers.dev/api/channel
          </Text>
        </View>
        <Pressable 
          style={({pressed}) => [styles.actionButton, pressed && styles.buttonPressed]} 
          onPress={() => handleCopy("https://taragent.wetarteam.workers.dev/api/channel")}
        >
          <Ionicons name="copy-outline" size={18} color="#1C1C1E" style={{marginRight: 6}} />
          <Text style={styles.actionButtonText}>Copy Webhook URL</Text>
        </Pressable>
      </View>

      {/* Slack Node */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="logo-slack" size={24} color="#4A154B" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Slack Command Relay</Text>
        </View>
        <Text style={styles.cardDescription}>
          Map slash commands (/sell, /stock) directly to the OS gateway.
        </Text>
        <View style={styles.endpointBox}>
          <Text style={styles.endpointUrl} numberOfLines={1} ellipsizeMode="middle">
            https://taragent.wetarteam.workers.dev/api/channel
          </Text>
        </View>
        <Pressable 
          style={({pressed}) => [styles.actionButton, pressed && styles.buttonPressed]} 
          onPress={() => handleCopy("https://taragent.wetarteam.workers.dev/api/channel")}
        >
          <Ionicons name="copy-outline" size={18} color="#1C1C1E" style={{marginRight: 6}} />
          <Text style={styles.actionButtonText}>Copy Webhook URL</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
    marginTop: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#34C759', 
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
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  endpointBox: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  endpointUrl: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#3A3A3C',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  buttonPressed: {
    opacity: 0.7,
  }
});
