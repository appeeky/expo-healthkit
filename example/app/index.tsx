import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as HealthKit from '@appeeky/expo-healthkit';

import healthRing from '@/assets/health-ring.png';
import { READ_TYPES, WRITE_TYPES, requestHealthAccess } from '@/src/health';
import { usePermissionSheet } from '@/src/permission-context';
import { colors } from '@/src/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bumpAuth } = usePermissionSheet();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!HealthKit.isAvailable()) {
      return;
    }

    void HealthKit.getRequestStatusForAuthorization({
      toRead: READ_TYPES,
      toShare: WRITE_TYPES,
    })
      .then((status) => {
        if (status === HealthKit.AuthorizationRequestStatus.unnecessary) {
          router.replace('/(tabs)/(summary)');
        }
      })
      .catch(() => {
        // First launch can fail before HealthKit has been prompted.
      });
  }, [router]);

  async function allow() {
    if (isRequesting) {
      return;
    }
    setIsRequesting(true);
    setError(null);
    try {
      await requestHealthAccess();
      bumpAuth();
      router.replace('/(tabs)/(summary)');
    } catch (requestError) {
      setError(String(requestError));
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.peach, justifyContent: 'flex-end' }}>
      <View
        style={{
          backgroundColor: colors.systemBackground,
          borderTopLeftRadius: 38,
          borderTopRightRadius: 38,
          borderCurve: 'continuous',
          paddingHorizontal: 28,
          paddingTop: 36,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          minHeight: '82%',
          gap: 12,
        }}
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Image source={healthRing} style={{ width: 268, height: 268 }} contentFit="contain" />
        </View>
        <View style={{ flexGrow: 1, gap: 12 }}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              color: colors.label,
              letterSpacing: 0.3,
            }}
          >
            expo-healthkit
          </Text>
          <Text style={{ fontSize: 17, lineHeight: 24, color: colors.secondaryLabel }}>
            This app brings your health information together in one place.
          </Text>
          <Text style={{ fontSize: 17, lineHeight: 24, color: colors.secondaryLabel }}>
            You can see important changes or alerts, get insights from your data, and learn about
            essential topics.
          </Text>
          {error ? (
            <Text selectable style={{ fontSize: 15, lineHeight: 20, color: colors.systemRed }}>
              {error}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => {
            void allow();
          }}
          disabled={isRequesting}
          style={({ pressed }) => ({
            height: 50,
            width: '100%',
            borderRadius: 25,
            backgroundColor: pressed || isRequesting ? '#0066D6' : colors.systemBlue,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isRequesting ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
            {isRequesting ? 'Asking Health…' : 'Allow'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
