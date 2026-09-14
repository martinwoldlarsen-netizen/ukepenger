import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PendingClaim } from "../lib/api";
import { formatDateTime, formatKr } from "../lib/format";
import { colors, shared } from "../theme";

type Props = {
  claims: PendingClaim[] | null;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onDecide: (claimId: string, status: "APPROVED" | "REJECTED") => Promise<void>;
};

export default function InboxScreen({ claims, error, refreshing, onRefresh, onDecide }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const decide = async (claimId: string, status: "APPROVED" | "REJECTED") => {
    setBusyId(claimId);
    try {
      await onDecide(claimId, status);
    } finally {
      setBusyId(null);
    }
  };

  if (claims === null) {
    return (
      <View style={shared.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={claims}
      keyExtractor={(claim) => claim.id}
      contentContainerStyle={shared.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={shared.header}>
          <Text style={shared.headerTitle}>Innboks</Text>
          <Text style={shared.headerSubtitle}>
            {claims.length === 0
              ? "Ingen krav venter"
              : `${claims.length} krav venter på godkjenning`}
          </Text>
          {error ? <Text style={[shared.errorText, styles.error]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={shared.centered}>
          <Text style={shared.emptyText}>Alt er gjort opp. Ingen krav å godkjenne.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const busy = busyId === item.id;
        return (
          <View style={shared.card}>
            <View style={styles.topRow}>
              <View style={styles.info}>
                <Text style={shared.cardTitle}>{item.childName}</Text>
                <Text style={shared.cardMeta}>{item.taskTitle}</Text>
                <Text style={shared.cardMeta}>{formatDateTime(item.createdAt)}</Text>
              </View>
              <Text style={shared.amount}>{formatKr(item.amountOre)}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.approve, busy && styles.disabled]}
                onPress={() => decide(item.id, "APPROVED")}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.approveText}>Godkjenn</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.reject, busy && styles.disabled]}
                onPress={() => decide(item.id, "REJECTED")}
                disabled={busy}
              >
                <Text style={styles.rejectText}>Avvis</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  info: { flex: 1 },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  approve: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  approveText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  reject: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rejectText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  error: { marginTop: 12, textAlign: "left" },
});
