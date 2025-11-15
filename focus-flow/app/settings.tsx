import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore, ViewDensity } from '../src/store/settingsStore';
import { useTheme } from '../src/theme/useTheme';
import { haptics } from '../src/utils/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const {
    viewDensity,
    setViewDensity,
    showCompletedTasks,
    setShowCompletedTasks,
  } = useSettingsStore();

  const handleDensityChange = (density: ViewDensity) => {
    haptics.light();
    setViewDensity(density);
  };

  const handleToggle = (value: boolean, setter: (value: boolean) => void) => {
    haptics.light();
    setter(value);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backText, { color: colors.primary, ...typography.body }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.title1 }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* View Density Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            View Density
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
            Adjust how much information is displayed in your task list
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            {(['compact', 'comfortable', 'cozy'] as ViewDensity[]).map((density, index, arr) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.optionRow,
                  {
                    borderBottomWidth: index < arr.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.separator,
                  },
                ]}
                onPress={() => handleDensityChange(density)}
                accessibilityRole="radio"
                accessibilityState={{ checked: viewDensity === density }}
                accessibilityLabel={`${density.charAt(0).toUpperCase() + density.slice(1)} density`}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                    {density === 'compact' && 'See more tasks, less detail'}
                    {density === 'comfortable' && 'Balanced view (recommended)'}
                    {density === 'cozy' && 'Spacious with full details'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: viewDensity === density ? colors.primary : colors.separator,
                      backgroundColor: viewDensity === density ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {viewDensity === density && (
                    <View style={[styles.radioInner, { backgroundColor: '#FFFFFF' }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Display Options Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Display Options
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            <View style={[styles.optionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                  Show Completed Tasks
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Display completed tasks in the main list
                </Text>
              </View>
              <Switch
                value={showCompletedTasks}
                onValueChange={(value) => handleToggle(value, setShowCompletedTasks)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Show completed tasks toggle"
                accessibilityRole="switch"
              />
            </View>

          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Preview
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, padding: 16 }]}>
            <Text style={[styles.previewText, { color: colors.secondaryText, ...typography.caption1 }]}>
              Current density: <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {viewDensity.charAt(0).toUpperCase() + viewDensity.slice(1)}
              </Text>
            </Text>
            <Text style={[styles.previewText, { color: colors.secondaryText, ...typography.caption1, marginTop: 8 }]}>
              {viewDensity === 'compact' && 'Compact mode hides some metadata to fit more tasks on screen'}
              {viewDensity === 'comfortable' && 'Comfortable mode shows all important task details'}
              {viewDensity === 'cozy' && 'Cozy mode provides extra spacing for easier reading'}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            About
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, padding: 16 }]}>
            <Text style={[styles.aboutText, { color: colors.text, ...typography.body }]}>
              Focus Flow
            </Text>
            <Text style={[styles.aboutText, { color: colors.secondaryText, ...typography.caption1, marginTop: 4 }]}>
              Version 1.0.0
            </Text>
            <Text style={[styles.aboutText, { color: colors.secondaryText, ...typography.caption1, marginTop: 12 }]}>
              Designed for Apple Design Award excellence
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 17,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 20,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    lineHeight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewText: {
    lineHeight: 18,
  },
  aboutText: {
    lineHeight: 20,
  },
});
