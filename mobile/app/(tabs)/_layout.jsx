import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontFamily, FontSize } from '../../theme/tokens'

const TAB_CONFIG = [
  { name: 'dashboard',  label: 'Home',      icon: 'home'        },
  { name: 'my-cats',    label: 'My Cats',   icon: 'paw'         },
  { name: 'hospitals',  label: 'Hospitals', icon: 'business'    },
  { name: 'ai-chat',    label: 'AI Chat',   icon: 'chatbubbles' },
  { name: 'stores',     label: 'Stores',    icon: 'storefront'  },
]

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.olive,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          paddingTop:       6,
          paddingBottom:    10,
          height:           70,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.bodySemiBold,
          fontSize:   FontSize.xs,
          marginTop:  2,
        },
        tabBarIcon: ({ focused, color }) => {
          const cfg  = TAB_CONFIG.find(t => t.name === route.name)
          const icon = cfg ? (focused ? cfg.icon : `${cfg.icon}-outline`) : 'ellipse'
          return <Ionicons name={icon} size={22} color={color} />
        },
      })}
    >
      {TAB_CONFIG.map(t => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  )
}
