import { AppStackParamList } from "@/navigation/EmployeeStack";
import { socket } from "./socket";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
type TabNavProp = BottomTabNavigationProp<AppStackParamList, 'Booking'>;

export const initProviderSocketListeners = () => {
  console.log("🧠 Initializing PROVIDER socket listeners");
    const navigation = useNavigation<TabNavProp>();
  

  socket.on("new-booking-request", (data) => {
    console.log("📥 New booking request:", data);

    // TODO: open modal / navigate
  });

  socket.on("booking-confirmed", booking => {
  console.log("✅ Booking confirmed:", booking._id);

  
});


  return () => {
    console.log("🧹 Removing PROVIDER socket listeners");
    socket.off("new-booking-request");
    socket.off("booking-confirmed");
  };
};
