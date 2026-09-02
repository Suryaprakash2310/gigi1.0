import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';
import { theme } from '@/theme/theme';

const LAST_UPDATED = '02/09/2026';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.safeArea}>
      <AppHeader
        title="Terms & Conditions"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            These Terms and Conditions govern access to and use of the Gigiman mobile application,
            including service discovery, booking, payment, support, and profile management features.
          </Text>
          <Text style={styles.lastUpdated}>Last Updated: {LAST_UPDATED}</Text>
        </View>

        <SectionCard title="1. Acceptance of Terms">
          <Text style={styles.bodyText}>
            By creating an account, using the Gigiman app, or booking a service through the platform,
            you agree to these Terms and Conditions. If you do not agree, you should not access or
            use the app.
          </Text>
        </SectionCard>

        <SectionCard title="2. Eligibility and Account Responsibility">
          <Text style={styles.bodyText}>
            You must provide accurate information when creating a profile or signing in. The app uses
            phone-based OTP authentication and user profile data to support service booking and
            account access. You are responsible for keeping your account credentials and phone number
            secure and for notifying us if there is unauthorised account use.
          </Text>
        </SectionCard>

        <SectionCard title="3. OTP and Authentication">
          <Text style={styles.bodyText}>
            Access to the app may require OTP verification through mobile number authentication. This
            is used to validate the user account and help prevent unauthorised access to bookings,
            profile information, and service-related activity.
          </Text>
        </SectionCard>

        <SectionCard title="4. Booking Services">
          <Text style={styles.bodyText}>
            Gigiman allows customers to request services, service providers to manage their work, and
            tool shops and teams to participate in the booking flow. Availability, scheduling, and
            service details are subject to the real-time status of the platform and the service
            provider associated with the booking.
          </Text>
        </SectionCard>

        <SectionCard title="5. Service Provider and Customer Responsibilities">
          <Text style={styles.bodyText}>
            Customers are responsible for providing accurate service details, address information,
            and timely communication about the booking. Service providers are responsible for
            operating within the service categories they list, responding to assignments, and
            maintaining the quality and professionalism expected in their work.
          </Text>
        </SectionCard>

        <SectionCard title="6. Pricing, Payments and Charges">
          <Text style={styles.bodyText}>
            Pricing, service charges, and payment steps may be defined through the app and the
            booking flow. The app supports payment processing through third-party services and may
            include Razorpay-based payment flows. Gigiman may update pricing or service details as
            the platform evolves, but any final amount for a service is subject to the booking record
            and the payment process in effect at that time.
          </Text>
        </SectionCard>

        <SectionCard title="7. Booking Confirmation, Cancellation and Refunds">
          <Text style={styles.bodyText}>
            A booking is only confirmed when the relevant status is reached in the app. Cancellation
            may be initiated through the booking flow when available. Refunds, credits, or payment
            adjustments depend on the booking status, the applicable payment flow, and the platform
            policy that is in force for that booking. Gigiman does not guarantee a refund in all
            cases.
          </Text>
        </SectionCard>

        <SectionCard title="8. Service Quality and Disputes">
          <Text style={styles.bodyText}>
            Gigiman provides the platform for connecting customers and service providers. We do not
            guarantee the outcome of a service or the quality of work beyond the functionality of the
            app itself. If there is a dispute, users may raise an issue through the support features
            available in the application.
          </Text>
        </SectionCard>

        <SectionCard title="9. User Conduct and Provider Conduct">
          <Text style={styles.bodyText}>
            Users must provide truthful information and use the app lawfully and respectfully. Any
            misuse, harassment, fraudulent activity, abusive conduct, or attempt to manipulate a
            booking, payment, verification process, or support request may result in suspension or
            restricted access to the platform.
          </Text>
        </SectionCard>

        <SectionCard title="10. Third-Party Services">
          <Text style={styles.bodyText}>
            Gigiman may rely on third-party services for authentication, payment processing,
            notifications, and backend operations. This includes mobile authentication and payment
            infrastructure used by the app. Your use of those services is subject to their own terms
            and conditions.
          </Text>
        </SectionCard>

        <SectionCard title="11. Intellectual Property">
          <Text style={styles.bodyText}>
            The app, branding, design, and related content are the property of Gigiman or its
            authorised partners, unless otherwise indicated. You may use the app for personal,
            non-commercial use in line with these Terms, but you may not reproduce, distribute, or
            misuse platform content without permission.
          </Text>
        </SectionCard>

        <SectionCard title="12. Availability and Changes">
          <Text style={styles.bodyText}>
            Gigiman may change, suspend, or discontinue parts of the app or service features at any
            time. We may update these Terms and the app experience as functionality evolves. Continued
            use after changes means you accept the revised terms.
          </Text>
        </SectionCard>

        <SectionCard title="13. Limitation of Liability">
          <Text style={styles.bodyText}>
            Gigiman is provided on an “as is” basis for service coordination and booking management.
            To the extent permitted by applicable law, Gigiman shall not be liable for indirect,
            incidental, or consequential losses arising from the use of the platform, service
            disruption, delayed booking activity, or communication issues.
          </Text>
        </SectionCard>

        <SectionCard title="14. Termination">
          <Text style={styles.bodyText}>
            Gigiman may suspend or terminate access to the platform where there is misuse of the app,
            fraudulent activity, repeated violations of these Terms, or other conduct that risks the
            service, other users, or the integrity of bookings.
          </Text>
        </SectionCard>

        <SectionCard title="15. Governing Law and Contact">
          <Text style={styles.bodyText}>
            These Terms are governed by the applicable laws of the jurisdiction in which the service
            is offered, unless a stricter legal requirement applies. For questions, support, or
            concerns, please use the support features available in the app.
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
  lastUpdated: {
    marginTop: 10,
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
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
});
