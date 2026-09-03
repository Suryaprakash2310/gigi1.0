import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmpProfileStackParamList } from '@/navigation/EmpProfileStack';

type SupportScreenNavigationProp = NativeStackNavigationProp<EmpProfileStackParamList, 'Support'>;

export default function SupportScreen() {
  const navigation = useNavigation<SupportScreenNavigationProp>();

  const handleCallSupport = () => {
    Linking.openURL('tel:+916379375619'); // Placeholder number
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/916379375619?text=Hello Gigiman Support, I need help regarding my job.');
  };

  const commonIssues = [
    'Customer not available',
    'Payment issue',
    'Wrong booking',
    'App issue',
    'Safety issue'
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support 🛠</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('RaiseIssue', {})}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Raise Issue</Text>
              <Text style={styles.actionDesc}>Submit a detailed complaint</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('SupportTickets' as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="copy-outline" size={24} color="#9C27B0" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>My Tickets</Text>
              <Text style={styles.actionDesc}>View status of your complaints</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleCallSupport}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="call-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Call Support</Text>
              <Text style={styles.actionDesc}>Instant voice call</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={handleWhatsAppSupport}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>WhatsApp Support</Text>
              <Text style={styles.actionDesc}>Chat with us on WhatsApp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Common Issues */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Common Issues</Text>
        <View style={styles.card}>
          {commonIssues.map((issue, index) => (
            <React.Fragment key={issue}>
              <TouchableOpacity 
                style={styles.issueBtn}
                onPress={() => navigation.navigate('RaiseIssue', { category: issue })}
              >
                <Text style={styles.issueText}>{issue}</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              {index < commonIssues.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  actionDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  issueText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
});
