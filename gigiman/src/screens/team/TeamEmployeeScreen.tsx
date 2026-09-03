import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { EmployeeSearchCard } from "../../components/team/EmployeeSearchCard";
import { TeamAPI } from "@/api/team";
import { AppText } from "@/components/ui/Text";
import { useTeam } from "../../hooks/useTeam";
import debounce from "lodash.debounce";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "@/components/AppHeader";
import { useNavigation } from "@react-navigation/native";
import { EmpProfileStackParamList } from "@/navigation/EmpProfileStack";

export const AddEmployeeScreen: React.FC = () => {
  const { members, pendingRequests, refreshTeam } = useTeam();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation<any>();

  // ==============================
  // 🔍 BACKEND SEARCH FUNCTION
  // ==============================
  const searchEmployees = async (text: string) => {
    if (text.trim().length === 0) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const res = await TeamAPI.searchSingleEmployee(text);
      setResults(res.singleemployee);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchEmployees, 400), []);

  const onChangeQuery = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleAdd = async (empId: string) => {
    try {
      setIsSubmitting(true);

      const res = await TeamAPI.requestAddMember(empId);

      if (res.success) {
        if (res.action === "sent") {
          // ✅ Request sent → mark as pending
          setResults((prev) =>
            prev.map((emp) =>
              emp.empId === empId ? { ...emp, teamAccepted: true } : emp
            )
          );
        } else if (res.action === "removed") {
          // ✅ Request removed → mark as addable again
          setResults((prev) =>
            prev.map((emp) =>
              emp.empId === empId ? { ...emp, teamAccepted: false } : emp
            )
          );
        }

        await refreshTeam(); // sync with backend
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const getStatus = (empId: string, teamAccepted?: boolean) => {
    if (members.some((m) => m.empId === empId)) return "member";
    if (pendingRequests.some((p) => p.empId === empId)) return "pending";
    if (teamAccepted) return "pending"; // local optimistic toggle
    return "addable";
  };
  return (
    <View style={styles.container}>
      <AppHeader
        title="Add Employee"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        subtitle="Search and add members to your team"
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or Emp ID"
            placeholderTextColor="#999"
            value={query}
            onChangeText={onChangeQuery}
          />
        </View>

        {loading || isSubmitting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {results.map((emp: any) => (
              <View key={emp.empId} style={styles.cardWrapper}>
                <EmployeeSearchCard
                  empId={emp.empId}
                  fullname={emp.fullname}
                  status={getStatus(emp.empId, emp.teamAccepted)}
                  onAdd={() => handleAdd(emp.empId)}
                />
              </View>
            ))}

            {query && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <AppText style={styles.emptyText}>No employee found</AppText>
                <AppText style={styles.emptySubText}>Try searching with a different name or ID</AppText>
              </View>
            )}

            {!query && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <AppText style={styles.emptyText}>Search for employees</AppText>
                <AppText style={styles.emptySubText}>Type above to find people to add</AppText>
              </View>
            )}

          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  listContent: {
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
    textAlign: 'center',
  }
});
