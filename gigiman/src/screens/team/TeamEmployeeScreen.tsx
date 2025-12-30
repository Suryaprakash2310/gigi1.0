import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { EmployeeSearchCard } from "../../components/team/EmployeeSearchCard";
import { TeamAPI } from "@/api/team";
import { AppText } from "@/components/ui/Text";
import { useTeam } from "../../hooks/useTeam";
import debounce from "lodash.debounce";
import { get } from "axios";
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
    <>
    <AppHeader showBack={true} onBackPress={() => navigation.goBack()} />
    <Screen>   
      <AppText variant="titleLarge" style={styles.title}>
        Add Employee
      </AppText>

      <TextInput
        style={styles.search}
        placeholder="Search by name or Emp ID"
        value={query}
        onChangeText={onChangeQuery}
      />

      {loading || isSubmitting ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {results.map((emp: any) => (
            <EmployeeSearchCard
              key={emp.empId}
              empId={emp.empId}
              fullname={emp.fullname}
              status={getStatus(emp.empId, emp.teamAccepted)}
              onAdd={() => handleAdd(emp.empId)}
            />

          ))}

          {query && results.length === 0 && (
            <AppText style={{ opacity: 0.6, textAlign: "center", marginTop: 30 }}>
              No employee found
            </AppText>
          )}
        </ScrollView>
      )}
    </Screen>
    </>
  );
};

const styles = StyleSheet.create({
  title: { marginBottom: 20, fontWeight: "700" },
  search: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});
