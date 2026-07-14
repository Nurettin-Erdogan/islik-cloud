import React from "react";
import { StyleSheet, Text, View } from "react-native";

const steps = [
  { value: "pending", label: "Alındı" },
  { value: "in_progress", label: "İncelemede" },
  { value: "completed", label: "Tamamlandı" }
];

export function JobStatusTrail({ status }) {
  const activeIndex = status === "cancelled" ? -1 : Math.max(steps.findIndex((step) => step.value === status), 0);

  if (status === "cancelled") {
    return (
      <View style={styles.trail}>
        <View style={[styles.step, styles.stepDanger]}>
          <Text style={[styles.stepText, styles.stepTextDanger]}>İptal edildi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.trail}>
      {steps.map((step, index) => {
        const active = index <= activeIndex;
        return (
          <View key={step.value} style={[styles.step, active && styles.stepActive]}>
            <Text style={[styles.stepText, active && styles.stepTextActive]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trail: {
    flexDirection: "row",
    gap: 6
  },
  step: {
    flex: 1,
    minHeight: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 4
  },
  stepActive: {
    backgroundColor: "#0f766e"
  },
  stepDanger: {
    backgroundColor: "#fee2e2"
  },
  stepText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  stepTextActive: {
    color: "#ffffff"
  },
  stepTextDanger: {
    color: "#991b1b"
  }
});
