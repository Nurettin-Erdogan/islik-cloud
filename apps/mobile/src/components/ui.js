import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export function Card({ children, accent }) {
  return <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null]}>{children}</View>;
}

export function Message({ text, compact }) {
  return (
    <View style={[styles.message, compact && styles.messageCompact]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

export function EmptyState({ text }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function Input({ label, multiline, style, ...props }) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline && styles.textarea, style]}
      />
    </View>
  );
}

export function SearchInput(props) {
  return <Input {...props} label="Arama" autoCapitalize="none" />;
}

export function PrimaryButton({ title, onPress, disabled }) {
  return (
    <Pressable style={[styles.primaryAction, disabled && styles.disabledAction]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryActionText}>{title}</Text>
    </Pressable>
  );
}

export function SmallButton({ title, onPress, danger, disabled }) {
  return (
    <Pressable
      style={[styles.smallButton, danger && styles.smallButtonDanger, disabled && styles.disabledAction]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.smallButtonText, danger && styles.smallButtonDangerText]}>{title}</Text>
    </Pressable>
  );
}

export function Badge({ text, danger }) {
  return (
    <View style={[styles.badge, danger && styles.badgeDanger]}>
      <Text style={[styles.badgeText, danger && styles.badgeDangerText]}>{text}</Text>
    </View>
  );
}

export function SegmentedControl({ items, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {items.map((item) => (
        <Pressable
          key={item.value}
          style={[styles.choiceChip, value === item.value && styles.choiceChipActive]}
          onPress={() => onChange(item.value)}
        >
          <Text style={[styles.choiceChipText, value === item.value && styles.choiceChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "#dce2e7",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#17211f",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1
  },
  message: {
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ecfdf5"
  },
  messageCompact: {
    margin: 12
  },
  messageText: {
    color: "#115e59",
    fontWeight: "800"
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#ffffff"
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontWeight: "800"
  },
  inputGroup: {
    gap: 6
  },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900"
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#111827",
    backgroundColor: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  textarea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f766e"
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  disabledAction: {
    opacity: 0.5
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  smallButtonDanger: {
    backgroundColor: "#fee2e2"
  },
  smallButtonText: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "900"
  },
  smallButtonDangerText: {
    color: "#991b1b"
  },
  badge: {
    minHeight: 26,
    borderRadius: 6,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  badgeDanger: {
    backgroundColor: "#fee2e2"
  },
  badgeText: {
    color: "#115e59",
    fontSize: 12,
    fontWeight: "900"
  },
  badgeDangerText: {
    color: "#991b1b"
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2
  },
  choiceChip: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff"
  },
  choiceChipActive: {
    borderColor: "#0f766e",
    backgroundColor: "#0f766e"
  },
  choiceChipText: {
    color: "#334155",
    fontWeight: "900"
  },
  choiceChipTextActive: {
    color: "#ffffff"
  }
});
