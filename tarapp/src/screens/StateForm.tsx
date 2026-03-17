import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { sendCommerceAction } from '../api/client';

export default function StateForm() {
  const [ucode, setUcode] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (action: "CREATE" | "READ") => {
    if (!ucode) {
      Alert.alert("Error", "UCode is required (e.g. product:milk)");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendCommerceAction({
        channel: "app",
        userId: "mobile_user_01",
        scope: "shop:main",
        action: action,
        data: {
          ucode: ucode.toLowerCase(),
          title: title,
          payload: action === "CREATE" ? { price: parseFloat(price) || 0, currency: 'USD' } : undefined,
        }
      });
      
      setResult(response);
      if (action === "CREATE") Alert.alert("Success", "State created successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Universal Commerce State</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>UCode (e.g. product:shoe)</Text>
        <TextInput
          style={styles.input}
          value={ucode}
          onChangeText={setUcode}
          placeholder="product:id"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Running Shoe"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Price (USD)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="99.99"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.actions}>
        <Button title="Save (CREATE)" onPress={() => handleSubmit("CREATE")} disabled={loading} />
        <View style={{ width: 10 }} />
        <Button title="Fetch (READ)" onPress={() => handleSubmit("READ")} disabled={loading} color="#4Caf50" />
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>API Response:</Text>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultJson: {
    fontFamily: 'monospace',
    fontSize: 12,
  }
});
