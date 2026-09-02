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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.safeArea}>
      <AppHeader
        title="Privacy Policy"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            This Privacy Policy explains the information Gigiman may collect through the mobile app,
            how it is used, and how it is protected while supporting service booking and account access.
          </Text>
        </View>

        <SectionCard title="1. Introduction">
          <Text style={styles.bodyText}>
            Gigiman processes personal and service-related information to provide account access,
            booking management, service updates, payment steps, and support for users of the app.
            This policy is intended to be clear and practical, and it reflects how the current app is
            designed and used.
          </Text>
        </SectionCard>

        <SectionCard title="2. Information We Collect">
          <Text style={styles.bodyText}>
            The app may collect and process information such as:
          </Text>
          <View style={styles.listWrap}>
            <Text style={styles.listItem}>• Name and profile information entered in the app</Text>
            <Text style={styles.listItem}>• Mobile number used for login and OTP verification</Text>
            <Text style={styles.listItem}>• Address and location information needed for booking/service delivery</Text>
            <Text style={styles.listItem}>• Booking details, service category, status, and related activity</Text>
            <Text style={styles.listItem}>• Payment-related information used in the platform payment flow</Text>
            <Text style={styles.listItem}>• Support ticket content and communications</Text>
            <Text style={styles.listItem}>• Device and app usage information necessary for operation and support</Text>
          </View>
        </SectionCard>

        <SectionCard title="3. How We Use Information">
          <Text style={styles.bodyText}>
            Gigiman uses information to create and maintain user accounts, verify phone numbers via
            OTP, manage bookings and service requests, connect customers with service providers or tool
            shops, support payments, send app notifications, and help resolve support issues. The app
            also uses profile and service data to display user status and booking history in the app.
          </Text>
        </SectionCard>

        <SectionCard title="4. How We Share Information">
          <Text style={styles.bodyText}>
            Information may be shared with service providers, teams, or tool shops involved in a
            booking so they can process the request and complete the service. We may also share data
            with support personnel and trusted third-party services used for authentication, payment,
            and backend infrastructure.
          </Text>
        </SectionCard>

        <SectionCard title="5. Service Providers and Third Parties">
          <Text style={styles.bodyText}>
            Gigiman relies on services such as Firebase Authentication for phone verification, Razorpay
            for payment processing, and the app backend/API for profile, booking, and service data. These
            third-party systems may process data in line with their own policies and operational needs.
          </Text>
        </SectionCard>

        <SectionCard title="6. Data Storage and Security">
          <Text style={styles.bodyText}>
            Gigiman stores account and booking information in the application backend and related data
            stores used by the app. We use reasonable measures to protect data from unauthorised
            access, misuse, or loss, but no method of transmission or storage is completely risk-free.
          </Text>
        </SectionCard>

        <SectionCard title="7. Location Information">
          <Text style={styles.bodyText}>
            If location details are used for service booking or dispatch-related functionality, they are
            used to identify service areas, assist the booking flow, and support service providers.
            Location access is only processed when required for the specific feature in the app.
          </Text>
        </SectionCard>

        <SectionCard title="8. Communications and Notifications">
          <Text style={styles.bodyText}>
            The app may send booking updates, service alerts, and support-related notifications to the
            device. Users may receive notifications related to service status, profile activity, and the
            use of the app’s feature set.
          </Text>
        </SectionCard>

        <SectionCard title="9. User Choices and Controls">
          <Text style={styles.bodyText}>
            Users can manage their profile, review booking-related information, and contact support
            within the app. If a notification or access setting is made available by the app, users
            may use it to adjust notifications or account-related preferences.
          </Text>
        </SectionCard>

        <SectionCard title="10. Data Retention">
          <Text style={styles.bodyText}>
            Data is retained for as long as required to provide the platform, maintain account access,
            support bookings, and meet operational or support requirements. When information is no
            longer needed, it may be deleted or anonymised in line with the platform’s data operations.
          </Text>
        </SectionCard>

        <SectionCard title="11. Children's Privacy">
          <Text style={styles.bodyText}>
            Gigiman is intended for users who are legally able to use the app and transact through the
            service. The platform should not be used by children without appropriate parental or legal
            consent where required by local law.
          </Text>
        </SectionCard>

        <SectionCard title="12. Third-Party Services">
          <Text style={styles.bodyText}>
            Gigiman may use external systems for secure authentication, payment processing, notifications,
            and hosting of backend services. Each provider has its own data handling practices, and user
            data may be processed by those services to support the features described in this app.
          </Text>
        </SectionCard>

        <SectionCard title="13. Changes to This Policy">
          <Text style={styles.bodyText}>
            This policy may be updated as app features evolve or as the business requirements of the
            platform change. Continued use of the app after an update indicates your acceptance of the
            revised policy.
          </Text>
        </SectionCard>

        <SectionCard title="14. Contact Us">
          <Text style={styles.bodyText}>
            For questions, privacy concerns, or support requests, use the in-app support flow or call
            the support line available in the app: {supportNumber}.
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
  summaryCard: {
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
  summaryText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 24,
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
  listWrap: {
    marginTop: 8,
  },
  listItem: {
    color: '#4a4a4a',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
});
