import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

interface DebugPanelProps {
  bouquetCount: number;
  seedCount: number;
  onAddBouquet: () => void;
  onReset: () => void;
}

export function DebugPanel({
  bouquetCount,
  seedCount,
  onAddBouquet,
  onReset,
}: DebugPanelProps) {
  return (
    <View style={styles.panel}>
      <TouchableOpacity style={styles.btn} onPress={onAddBouquet}>
        <Text style={styles.btnText}>+ bouquet</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onReset}>
        <Text style={styles.btnText}>reset</Text>
      </TouchableOpacity>
      <Text style={styles.info}>
        💐
        {bouquetCount} 🌱
        {seedCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 40,
  },
  btn: {
    backgroundColor: "#EEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 14,
    color: "#666",
  },
  info: {
    fontSize: 14,
    color: "#AAA",
  },
});
