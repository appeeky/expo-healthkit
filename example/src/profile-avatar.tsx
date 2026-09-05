import { Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';

export function ProfileAvatar() {
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: '100%',
        backgroundColor: colors.avatar,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '500', fontSize: 20 }}>EA</Text>
    </View>
  );
}
