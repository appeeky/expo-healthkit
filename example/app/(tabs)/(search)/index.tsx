import { Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { colors } from '@/src/theme/colors';

export default function SearchScreen() {
  return (
    <>
      <Stack.Title>Search</Stack.Title>
      <Stack.SearchBar
        placement="automatic"
        allowToolbarIntegration
        placeholder="Search health data"
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 8 }}
      >
        <Text style={{ fontSize: 34, fontWeight: '700', color: colors.label, letterSpacing: 0.3 }}>
          Search
        </Text>
        <Text style={{ fontSize: 17, color: colors.secondaryLabel, lineHeight: 22 }}>
          Native search tab for browsing HealthKit identifiers in this example.
        </Text>
      </ScrollView>
    </>
  );
}
