import React, { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    View,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";
import { AppText } from "@/components/ui/Text";
import { useWallet } from "@/hooks/useWallet";
import { useNavigation } from "@react-navigation/native";

export const WalletKycFormScreen = () => {
    const { setKycStatus } = useWallet(); // 👈 IMPORTANT
    const navigation = useNavigation<any>();
    const [pan, setPan] = useState("");
    const [aadhaar, setAadhaar] = useState("");
    const [account, setAccount] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [panImage, setPanImage] = useState<string | null>(null);
    const [aadhaarImage, setAadhaarImage] = useState<string | null>(null);


    const pickImage = async (setter: (v: string) => void) => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!res.canceled) {
            setter(res.assets[0].uri);
        }
    };


    const handleSubmit = () => {
        // UI-only for now
        setKycStatus("PENDING");
        navigation.goBack();
    };

    const { width } = Dimensions.get("window");

    return (
        <SafeAreaView style={styles.safe}>
            <AppHeader title="KYC Details" showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingHorizontal: Math.min(24, width * 0.06) }]}
                    showsVerticalScrollIndicator={false}
                >
                    <AppText style={styles.title}>KYC Details</AppText>

                    <AppText style={styles.label}>PAN Number</AppText>
                    <TextInput
                        style={styles.input}
                        value={pan}
                        onChangeText={setPan}
                        placeholder="ABCDE1234F"
                        placeholderTextColor={theme.colors.line}
                    />

                    <AppText style={styles.label}>PAN Card Photo</AppText>
                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={() => pickImage(setPanImage)}
                    >
                        {panImage ? (
                            <Image source={{ uri: panImage }} style={styles.preview} />
                        ) : (
                            <AppText style={styles.uploadText}>Upload PAN</AppText>
                        )}
                    </TouchableOpacity>

                    <AppText style={styles.label}>Aadhaar Number</AppText>
                    <TextInput
                        style={styles.input}
                        value={aadhaar}
                        onChangeText={setAadhaar}
                        placeholder="1234 5678 9012"
                        placeholderTextColor={theme.colors.line}
                    />

                    <AppText style={styles.label}>Bank Account Number</AppText>
                    <TextInput
                        style={styles.input}
                        value={account}
                        onChangeText={setAccount}
                        placeholder="Account number"
                        placeholderTextColor={theme.colors.line}
                    />

                    <AppText style={styles.label}>Aadhaar Card Photo</AppText>
                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={() => pickImage(setAadhaarImage)}
                    >
                        {aadhaarImage ? (
                            <Image source={{ uri: aadhaarImage }} style={styles.preview} />
                        ) : (
                            <AppText style={styles.uploadText}>Upload Aadhaar</AppText>
                        )}
                    </TouchableOpacity>

                    <AppText style={styles.label}>IFSC Code</AppText>
                    <TextInput
                        style={styles.input}
                        value={ifsc}
                        onChangeText={setIfsc}
                        placeholder="IFSC"
                        placeholderTextColor={theme.colors.line}
                    />

                    <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
                        <AppText style={styles.btnText}>Submit KYC</AppText>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    container: { paddingVertical: 20, paddingBottom: 40 },
    title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 14 },
    label: { marginBottom: 6, ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
    input: {
        backgroundColor: theme.colors.line,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        color: theme.colors.text,
    },
    btn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 6,
    },
    btnText: { color: theme.colors.background, fontWeight: "700" },
    uploadBox: {
        backgroundColor: theme.colors.line,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        marginBottom: 16,
    },
    uploadText: { opacity: 0.6, color: theme.colors.text },
    preview: { width: "100%", height: 180, borderRadius: 8 },
    containerRow: { flexDirection: 'row', gap: 12 },
});
