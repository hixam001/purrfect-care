import { Redirect } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { View, ActivityIndicator } from 'react-native'
import { Colors } from '../theme/tokens'

export default function Index() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.olive} size="large" />
      </View>
    )
  }

  return <Redirect href={isLoggedIn ? '/(tabs)/dashboard' : '/(auth)/login'} />
}
