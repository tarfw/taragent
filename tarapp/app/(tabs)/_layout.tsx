import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = 'light'; // Forced light theme per user request

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trace',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square" color={color} />,
        }}
      />
      <Tabs.Screen
        name="relay"
        options={{
          title: 'Relay',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="asterisk" color={color} />,
        }}
      />
    </Tabs>
  );
}
