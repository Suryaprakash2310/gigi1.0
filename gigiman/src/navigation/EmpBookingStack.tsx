import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmpBookingScreen } from '../screens/EmpBooking';
import PartsBuying from '../screens/EmpBooking/BuyParts';
import RazorpayScreen from '@/screens/RazorPayScreen';
import BookingCompleted from '@/screens/EmpBooking/BookingCompleted';
//import { PartsBuying } from '../screens/EmpBooking/BuyParts';
export type BookingStackParamList = {
  Booking: {partsbuyed?: boolean, bookingId: string},
  PartBuying: {bookingId: string};
  Razorpay: {amount: number, bookingId: string, orderId: string};
  BookingCompleted: {bookingId?: string};
};

const Stack = createNativeStackNavigator<BookingStackParamList>();

export default function EmpBookingStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Booking" component={EmpBookingScreen} />
      <Stack.Screen name="PartBuying" component={PartsBuying} />
      <Stack.Screen name="Razorpay" component={RazorpayScreen} />
      <Stack.Screen name="BookingCompleted" component={BookingCompleted} />

    </Stack.Navigator>
  );
}