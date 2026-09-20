import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/design';
import { hasCompletedOnboarding } from '@/services/onboarding';

export default function Index() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    void hasCompletedOnboarding().then((value) => {
      if (active) setCompleted(value);
    });

    return () => {
      active = false;
    };
  }, []);

  if (completed === null) {
    return <View style={styles.loading} />;
  }

  return <Redirect href={completed ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: palette.ink,
  },
});
