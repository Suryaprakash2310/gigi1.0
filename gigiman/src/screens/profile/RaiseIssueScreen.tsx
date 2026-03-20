import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { EmpProfileStackParamList } from '@/navigation/EmpProfileStack';
import { AuthContext } from '@/context/AuthContext';
import { ProfileContext } from '@/context/ProfileContext';

type RaiseIssueRouteProp = RouteProp<EmpProfileStackParamList, 'RaiseIssue'>;

export default function RaiseIssueScreen() {
  const navigation = useNavigation();
  const route = useRoute<RaiseIssueRouteProp>();
  const initialCategory = route.params?.category || '';
  const bookingId = route.params?.bookingId || '';
  
  const { profile } = useContext(ProfileContext);

  const [category, setCategory] = useState<string>(initialCategory);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const issueCategories = [
    'Customer not available',
    'Payment issue',
    'Wrong booking',
    'App issue',
    'Safety issue',
    'Other'
  ];

  const getPriority = (cat: string) => {
    if (cat === 'Safety issue') return 'HIGH';
    if (cat === 'Payment issue') return 'MEDIUM';
    return 'LOW';
  };

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Missing Field', 'Please select an issue category.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        providerId: profile?.empId || profile?.TeamId || 'UNKNOWN',
        bookingId: bookingId || undefined,
        category: category,
        description: description,
        priority: getPriority(category),
        status: 'OPEN'
      };

      // Mock backend submission logic
      console.log('--- COMPLAINT SUBMITTED ---');
      console.log(JSON.stringify(payload, null, 2));
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));

      Alert.alert(
        'Complaint Submitted', 
        'Support team will reach out to you shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again or use phone support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Raise Issue</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {bookingId ? (
            <View style={styles.contextCard}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.contextText}>Reporting issue for Booking ID: #{bookingId}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Select Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipContainer}>
            {issueCategories.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  category === item && styles.chipSelected
                ]}
                onPress={() => setCategory(item)}
              >
                <Text style={[
                  styles.chipText,
                  category === item && styles.chipTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>Description (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type extra details here..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading || !category ? styles.submitBtnDisabled : null]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  contextText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '500',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: 'red',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary + '1A', // Optional transparency
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#b0bec5',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
