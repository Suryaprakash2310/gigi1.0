// // components/PartCard.tsx






// // ✅ Quantity Increment
//   const increaseQty = (id: string) => {
//     setParts(prev =>
//       prev.map(item => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
//     );
//   };

//   const decreaseQty = (id: string) => {
//     setParts(prev =>
//       prev.map(item =>
//         item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item
//       )
//     );
//   };
  
// export const PartCard = ({ item, increaseQty, decreaseQty }) => (
//   <View style={styles.card}>
//     <Text style={styles.partName}>{item.name}</Text>
//     <View style={styles.quantityRow}>
//       <TouchableOpacity onPress={() => decreaseQty(item.id)} style={styles.circleBtn}>
//         <Ionicons name="remove" size={18} />
//       </TouchableOpacity>

//       <Text style={styles.qtyText}>{item.quantity}</Text>

//       <TouchableOpacity onPress={() => increaseQty(item.id)} style={styles.circleBtn}>
//         <Ionicons name="add" size={18} />
//       </TouchableOpacity>

//       <Text style={styles.price}>₹{item.price}</Text>
//     </View>
//   </View>
// );
