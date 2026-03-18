import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentState } from '@/hooks/useAgentState';
import { StateTypePickerModal } from '@/components/StateTypePickerModal';
import { StateFormModal } from '@/components/StateFormModal';
import { StateTypeDef, getStateType } from '../config/stateSchemas';

export default function AgentsScreen() {
  const { loading, result, createState, updateState, deleteState } = useAgentState();

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<StateTypeDef | null>(null);
  const [editingState, setEditingState] = useState<any>(null);

  // Step 1: Open type picker
  const handlePressAdd = () => {
    setEditingState(null);
    setShowTypePicker(true);
  };

  // Step 2: Type selected → open form
  const handleTypeSelect = (type: StateTypeDef) => {
    setSelectedType(type);
    setShowTypePicker(false);
    setShowForm(true);
  };

  // Edit: resolve type from ucode prefix, open form
  const handleEdit = (item: any) => {
    const typeKey = item.ucode?.split(':')[0];
    const typeDef = getStateType(typeKey);
    if (!typeDef) {
      Alert.alert('Unknown type', `Cannot edit type: ${typeKey}`);
      return;
    }
    setSelectedType(typeDef);
    setEditingState({
      ...item,
      payload: typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload,
    });
    setShowForm(true);
  };

  const handleDelete = (ucode: string) => {
    Alert.alert('Delete State', `Delete "${ucode}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteState(ucode) },
    ]);
  };

  const handleSubmit = async (ucode: string, title: string, payload: Record<string, any>) => {
    if (editingState) {
      await updateState(ucode, title, payload);
    } else {
      await createState(ucode, title, payload);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    // 1. Determine the list of items based on action type
    let items: any[] = [];
    
    if (result.result?.action === "SEARCH" && Array.isArray(result.result.results)) {
      // It's a semantic search result
      items = result.result.results;
    } else if (Array.isArray(result.result)) {
      // It's a direct array result
      items = result.result;
    } else if (result.result) {
      // It's a single object result (e.g. from CREATE/UPDATE)
      items = [result.result];
    }

    if (items.length === 0) {
      // No items found or success but empty
      if (result.success && result.result?.action === "SEARCH") {
         return (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
         );
      }
      return (
        <View style={styles.resultRaw}>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      );
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
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit({ ...item, ucode })} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(ucode)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
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
          <TouchableOpacity style={styles.addBtn} onPress={handlePressAdd}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
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
      </ScrollView>

      {/* Step 1 — Type Picker */}
      <StateTypePickerModal
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        onSelect={handleTypeSelect}
      />

      {/* Step 2 — Type Form */}
      <StateFormModal
        visible={showForm}
        stateType={selectedType}
        existingState={editingState}
        onClose={() => {
          setShowForm(false);
          setEditingState(null);
        }}
        onSubmit={handleSubmit}
      />
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
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
});
