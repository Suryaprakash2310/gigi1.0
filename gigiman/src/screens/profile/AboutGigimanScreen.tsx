import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';
import { theme } from '@/theme/theme';

const supportNumber = '+91 6369285926';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AboutGigimanScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.safeArea}>
      <AppHeader
        title="About Gigiman"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Gigiman</Text>
          <Text style={styles.heroTitle}>Home service booking, made simpler.</Text>
          <Text style={styles.bodyText}>
            Gigiman is the mobile platform in this app for connecting customers with home service
            professionals, service providers, and tool shops for everyday service needs.
          </Text>
        </View>

        <SectionCard title="What Gigiman does">
          <Text style={styles.bodyText}>
            The app supports service discovery, service category selection, profile management,
            booking flow, live status updates, OTP-based verification, and support for service
            providers working across home service categories.
          </Text>
        </SectionCard>

        <SectionCard title="How Gigiman works">
          <View style={styles.stepsList}>
            <Text style={styles.stepText}><Text style={styles.stepNumber}>1.</Text> Customers browse or select the service they need.</Text>
            <Text style={styles.stepText}><Text style={styles.stepNumber}>2.</Text> Service providers, teams, or tool shops manage their availability and categories.</Text>
            <Text style={styles.stepText}><Text style={styles.stepNumber}>3.</Text> The booking flow confirms the request and records the work, pricing, and status.</Text>
            <Text style={styles.stepText}><Text style={styles.stepNumber}>4.</Text> OTP-based verification and app updates help keep the service process secure and trackable.</Text>
          </View>
        </SectionCard>

        <SectionCard title="Why Gigiman">
          <Text style={styles.bodyText}>
            Gigiman brings the booking experience into one place. Customers can request services,
            track progress, and complete payment while service providers can manage their work and
            profile within the same app. This reduces friction for home service bookings and keeps
            communication centralised.
          </Text>
        </SectionCard>

        <SectionCard title="Our purpose">
          <Text style={styles.bodyText}>
            Gigiman is designed to make home service booking more convenient, faster, and easier to
            manage for both customers and service providers. The app focuses on practical service
            coordination, user convenience, and transparent progress updates during a booking.
          </Text>
        </SectionCard>

        <SectionCard title="Support">
          <Text style={styles.bodyText}>
            For assistance, use the in-app support flow in the profile section or contact the support
            number shown in the app: {supportNumber}.
          </Text>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#1c1c1c',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#1c1c1c',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  bodyText: {
    color: '#4a4a4a',
    fontSize: 15,
    lineHeight: 24,
  },
  stepsList: {
    gap: 10,
  },
  stepText: {
    color: '#4a4a4a',
    fontSize: 15,
    lineHeight: 24,
  },
  stepNumber: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
