import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { activeAlertBillet } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: COLORS.interactive,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarItemStyle: {
          borderBottomWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      {/* Tab 1: Live inspection */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Live inspection',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'videocam' : 'videocam-outline'}
                size={22}
                color={color}
              />
              {Boolean(activeAlertBillet) && <View style={styles.alertDot} />}
            </View>
          ),
        }}
      />

      {/* Tab 2: Analytics */}
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Inspection log */}
      <Tabs.Screen
        name="log"
        options={{
          title: 'Inspection log',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden Settings screen */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.fail,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
});
