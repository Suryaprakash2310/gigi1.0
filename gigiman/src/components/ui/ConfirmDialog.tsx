import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '@/theme/theme';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const { width } = Dimensions.get('window');

export default function ConfirmDialog({
  visible,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel}>
        <View style={[styles.container, { width: Math.min(360, width - 48) }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 6 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: theme.colors.text },
  message: { fontSize: 14, color: '#666', marginBottom: 18 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  cancel: { backgroundColor: '#f1f1f1' },
  confirm: { backgroundColor: theme.colors.primary },
  cancelText: { color: '#444', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
