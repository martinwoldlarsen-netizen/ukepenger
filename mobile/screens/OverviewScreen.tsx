import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { Child } from "../lib/api";
import { formatKr } from "../lib/format";
import { colors, shared } from "../theme";

type Props = {
  items: Child[] | null;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
};

export default function OverviewScreen({ items, error, refreshing, onRefresh }: Props) {
  const total = (items ?? []).reduce((sum, child) => sum + child.balanceOre, 0);

  if (items === null) {
    return (
      <View style={shared.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(child) => child.id}
      contentContainerStyle={shared.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={shared.header}>
          <Text style={shared.headerTitle}>Oversikt</Text>
          <Text style={shared.headerSubtitle}>
            {total > 0 ? `${formatKr(total)} til gode totalt` : "Ingenting til gode"}
          </Text>
          {error ? <Text style={[shared.errorText, styles.error]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={shared.centered}>
          <Text style={shared.emptyText}>Ingen barn registrert enda.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[shared.card, styles.row]}>
          <View style={styles.nameBlock}>
            <Text style={shared.cardTitle}>{item.name}</Text>
            <Text style={shared.cardMeta}>
              {item.balanceOre > 0 ? "Til gode" : "Alt gjort opp"}
            </Text>
          </View>
          <Text style={[shared.amount, item.balanceOre > 0 && styles.owed]}>
            {formatKr(item.balanceOre)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nameBlock: { flex: 1 },
  owed: { color: colors.success },
  error: { marginTop: 12, textAlign: "left" },
});
