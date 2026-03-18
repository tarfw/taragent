import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentState } from '@/hooks/useAgentState';
import { StateTypePickerModal } from '@/components/StateTypePickerModal';
import { StateFormModal } from '@/components/StateFormModal';
import { STATE_TYPES, StateTypeDef, getStateType } from '../config/stateSchemas';

export default function MemoriesScreen() {
  const { loading, result, createState, updateState, deleteState, setResult } = useAgentState();

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<StateTypeDef | null>(null);
  const [editingState, setEditingState] = useState<any>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);

  // --- CRUD Handlers ---
  const handlePressAdd = () => {
    setEditingState(null);
    setShowTypePicker(true);
  };

  const handleTypeSelect = (type: StateTypeDef) => {
    setSelectedType(type);
    setShowTypePicker(false);
    setShowForm(true);
  };

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
    Alert.alert('Delete Memory', `Delete "${ucode}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteState(ucode),
      },
    ]);
  };

  const handleSubmit = async (ucode: string, title: string, payload: Record<string, any>) => {
    if (editingState) {
      await updateState(ucode, title, payload);
    } else {
      await createState(ucode, title, payload);
    }
  };

  // --- Derive items list ---
  let items: any[] = [];
  if (result?.result?.action === 'SEARCH' && Array.isArray(result.result.results)) {
    items = result.result.results;
  } else if (Array.isArray(result?.result)) {
    items = result.result;
  } else if (result?.result && typeof result.result === 'object' && result.result.ucode) {
    items = [result.result];
  }

  const filteredItems = activeTypeFilter
    ? items.filter((item) => (item.ucode || item.streamid)?.startsWith(activeTypeFilter + ':'))
    : items;

  // --- Render ---
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="albums-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyText}>No memories yet</Text>
      <Text style={styles.emptySubText}>
        Tap + to create your first state — products, brands, campaigns and more.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handlePressAdd}>
        <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 6 }} />
        <Text style={styles.emptyButtonText}>Create Memory</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTypeFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      <TouchableOpacity
        style={[styles.filterChip, !activeTypeFilter && styles.filterChipActive]}
        onPress={() => setActiveTypeFilter(null)}
      >
        <Text style={[styles.filterChipText, !activeTypeFilter && styles.filterChipTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {STATE_TYPES.map((t) => (
        <TouchableOpacity
          key={t.type}
          style={[
            styles.filterChip,
            activeTypeFilter === t.type && { backgroundColor: t.color + '20', borderColor: t.color },
          ]}
          onPress={() => setActiveTypeFilter(activeTypeFilter === t.type ? null : t.type)}
        >
          <Ionicons
            name={t.icon as any}
            size={12}
            color={activeTypeFilter === t.type ? t.color : '#8E8E93'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterChipText,
              activeTypeFilter === t.type && { color: t.color, fontWeight: '700' },
            ]}
          >
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCard = (item: any, i: number) => {
    const ucode = item.ucode || item.streamid;
    const typeKey = ucode?.split(':')[0];
    const typeDef = getStateType(typeKey);
    const parsedPayload =
      item.payload
        ? typeof item.payload === 'string'
          ? JSON.parse(item.payload)
          : item.payload
        : {};

    return (
      <View key={i} style={styles.card}>
        {/* Type tag + actions row */}
        <View style={styles.cardTop}>
          {typeDef ? (
            <View style={[styles.typeTag, { backgroundColor: typeDef.color + '18' }]}>
              <Ionicons name={typeDef.icon as any} size={13} color={typeDef.color} />
              <Text style={[styles.typeTagText, { color: typeDef.color }]}>{typeDef.label}</Text>
            </View>
          ) : (
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{typeKey}</Text>
            </View>
          )}
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit({ ...item, ucode })} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={17} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(ucode)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={17} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{item.title || '—'}</Text>
        <Text style={styles.cardUcode}>{ucode}</Text>

        {/* Key payload fields preview */}
        {Object.keys(parsedPayload).length > 0 && (
          <View style={styles.payloadRow}>
            {Object.entries(parsedPayload)
              .slice(0, 3)
              .map(([key, val]) => (
                <View key={key} style={styles.payloadChip}>
                  <Text style={styles.payloadChipKey}>{key}</Text>
                  <Text style={styles.payloadChipVal} numberOfLines={1}>
                    {String(val)}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handlePressAdd}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Type filter chips */}
      {items.length > 0 && renderTypeFilters()}

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, filteredItems.length === 0 && { flex: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loadingText}>Working…</Text>
          </View>
        )}

        {!loading && filteredItems.length === 0 && renderEmpty()}

        {filteredItems.length > 0 && (
          <View style={styles.list}>
            {filteredItems.map((item, i) => renderCard(item, i))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <StateTypePickerModal
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        onSelect={handleTypeSelect}
      />
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
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

  filterScroll: { maxHeight: 48 },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F8F8',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },

  scrollContent: { padding: 20, paddingBottom: 160 },

  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: { fontSize: 14, color: '#8E8E93' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
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
    backgroundColor: '#EDEDF0',
  },
  typeTagText: { fontSize: 12, fontWeight: '600', color: '#636366' },
  cardActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { padding: 2 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  cardUcode: { fontSize: 12, color: '#AEAEB2', marginBottom: 10 },

  payloadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  payloadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDF0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    maxWidth: 160,
  },
  payloadChipKey: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  payloadChipVal: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
    flexShrink: 1,
  },
});
