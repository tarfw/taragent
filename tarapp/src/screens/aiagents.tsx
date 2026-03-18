import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentState } from '@/hooks/useAgentState';
import { getStateType } from '../config/stateSchemas';
import { useLiveEvents } from '@/hooks/useLiveEvents';

export default function AgentsScreen() {
  const { loading, result } = useAgentState();
  const { events: traces } = useLiveEvents();

  // Agents screen: semantic search and AI inputs only.
  // State management is handled in the Memories tab.

  const renderResults = () => {
    if (!result) return null;

    // 1. Determine the list of items based on action type
    let items: any[] = [];
    
    if (result.result?.action === "SEARCH" && Array.isArray(result.result.results)) {
      // It's a semantic search result
      items = result.result.results;
    } 
    // Manual CRUD results and direct array results are no longer displayed here
    // to keep the agents screen focused on search/AI.

    if (items.length === 0) {
      // Only show "no results" for explicit SEARCH. All other actions (CRUD from Memories) = silent.
      if (result.success && result.result?.action === "SEARCH") {
         return (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
         );
      }
      return null; // CRUD results from Memories tab — don't render anything here
    }

    return (
      <View style={styles.list}>
        {items.map((item: any, i: number) => {
          // ucode might be in 'ucode' or 'streamid' depending on the action
          const ucode = item.ucode || item.streamid;
          const typeKey = ucode?.split(':')[0];
          const typeDef = getStateType(typeKey);

          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardTop}>
                {typeDef && (
                  <View style={[styles.typeTag, { backgroundColor: typeDef.color + '18' }]}>
                    <Ionicons name={typeDef.icon as any} size={13} color={typeDef.color} />
                    <Text style={[styles.typeTagText, { color: typeDef.color }]}>
                      {typeDef.label}
                    </Text>
                  </View>
                )}
                <Ionicons name="arrow-forward-outline" size={16} color="#C7C7CC" />
              </View>
              <Text style={styles.cardTitle}>{item.title || '—'}</Text>
              <Text style={styles.cardUcode}>{ucode}</Text>
              {item.payload && (
                <Text style={styles.cardPayload} numberOfLines={2}>
                  {JSON.stringify(
                    typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload
                  )}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Agents</Text>
        </View>

        {!result && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Ask anything</Text>
            <Text style={styles.emptySub}>sell 2 shoes, check inventory, search products…</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loadingText}>Thinking…</Text>
          </View>
        )}

        {renderResults()}

        {traces.length > 0 && (
          <View style={styles.traceSection}>
             <View style={styles.traceHeader}>
              <Ionicons name="flash" size={16} color="#FF9500" />
              <Text style={styles.traceTitle}>Live Traces</Text>
             </View>
             {traces.slice(0, 5).map((trace, i) => (
               <View key={i} style={styles.traceItem}>
                 <Text style={styles.traceId}>{trace.streamid}</Text>
                 <Text style={styles.traceStatus}>{trace.status}</Text>
                 <Text style={styles.traceTime}>{trace.timestamp}</Text>
               </View>
             ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 24, paddingBottom: 160, flexGrow: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  empty: { marginTop: '30%', alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#8E8E93' },
  emptySub: { fontSize: 14, color: '#C7C7CC', marginTop: 6 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  resultRaw: {
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
  list: { gap: 12 },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeTagText: { fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 14 },
  actionBtn: { padding: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  cardUcode: { fontSize: 12, color: '#AEAEB2', marginBottom: 6 },
  cardPayload: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
  traceSection: {
    marginTop: 32,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
  },
  traceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  traceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  traceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D1D6',
  },
  traceId: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  traceStatus: { fontSize: 12, color: '#34C759', marginRight: 10 },
  traceTime: { fontSize: 11, color: '#AEAEB2' },
});
