import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { Task } from "../lib/api";
import { formatKr } from "../lib/format";
import { shared } from "../theme";

type Props = {
  tasks: Task[] | null;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
};

export default function TasksScreen({ tasks, error, refreshing, onRefresh }: Props) {
  if (tasks === null) {
    return (
      <View style={shared.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(task) => task.id}
      contentContainerStyle={shared.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={shared.header}>
          <Text style={shared.headerTitle}>Oppgaver</Text>
          <Text style={shared.headerSubtitle}>
            {tasks.length === 0 ? "Ingen oppgaver" : `${tasks.length} aktive oppgaver`}
          </Text>
          {error ? <Text style={[shared.errorText, styles.error]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={shared.centered}>
          <Text style={shared.emptyText}>Ingen oppgaver er laget enda.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[shared.card, styles.row]}>
          <Text style={[shared.cardTitle, styles.title]}>{item.title}</Text>
          <Text style={shared.amount}>{formatKr(item.amountOre)}</Text>
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
  title: { flex: 1 },
  error: { marginTop: 12, textAlign: "left" },
});
