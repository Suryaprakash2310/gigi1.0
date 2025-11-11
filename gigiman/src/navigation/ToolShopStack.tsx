import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ToolShopProfileScreen from '../screens/ShopProfileScreen';
import { ToolShopDashboard } from '../screens/ShopDashboard';
import { ToolShopBooking } from '../screens/ShopBooking';
//import ToolShopDashboard from '../screens/ShopDashboard/index'

export type ToolShopStackParamList = {
  Dashboard: undefined;
  Booking: { initialTab?: string };
  profile: undefined;
};

const Tab = createBottomTabNavigator<ToolShopStackParamList>();

export default function AppStack() {
  return (
    <Tab.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={ToolShopDashboard} />
      <Tab.Screen name="Booking" component={ToolShopBooking} />
      <Tab.Screen name="profile" component={ToolShopProfileScreen} />
    </Tab.Navigator>
  );
}

