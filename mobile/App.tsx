import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import {
  decideClaim,
  getChildren,
  getFamilyId,
  getPendingClaims,
  getTasks,
  type Child,
  type PendingClaim,
  type Task,
} from "./lib/api";
import LoginScreen from "./screens/LoginScreen";
import OverviewScreen from "./screens/OverviewScreen";
import InboxScreen from "./screens/InboxScreen";
import TasksScreen from "./screens/TasksScreen";
import { colors } from "./theme";

type Tab = "overview" | "inbox" | "tasks";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {session === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : session ? (
        <ParentApp session={session} />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

function ParentApp({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [children, setChildren] = useState<Child[] | null>(null);
  const [claims, setClaims] = useState<PendingClaim[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const familyId = await getFamilyId(session.user.id);
      const [nextChildren, nextClaims, nextTasks] = await Promise.all([
        getChildren(familyId),
        getPendingClaims(familyId),
        getTasks(familyId),
      ]);
      setChildren(nextChildren);
      setClaims(nextClaims);
      setTasks(nextTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente data.");
      setChildren((current) => current ?? []);
      setClaims((current) => current ?? []);
      setTasks((current) => current ?? []);
    }
  }, [session.user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDecide = useCallback(
    async (claimId: string, status: "APPROVED" | "REJECTED") => {
      try {
        await decideClaim(claimId, status, session.user.id);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunne ikke lagre avgjørelsen.");
      }
    },
    [session.user.id, load]
  );

  const pendingCount = claims?.length ?? 0;

  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Ukepenger</Text>
        <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8}>
          <Text style={styles.signOut}>Logg ut</Text>
        </Pressable>
      </View>

      <View style={styles.flex}>
        {tab === "overview" ? (
          <OverviewScreen
            items={children}
            error={error}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        ) : tab === "inbox" ? (
          <InboxScreen
            claims={claims}
            error={error}
            refreshing={refreshing}
            onRefresh={refresh}
            onDecide={handleDecide}
          />
        ) : (
          <TasksScreen tasks={tasks} error={error} refreshing={refreshing} onRefresh={refresh} />
        )}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Oversikt" active={tab === "overview"} onPress={() => setTab("overview")} />
        <TabButton
          label="Innboks"
          active={tab === "inbox"}
          badge={pendingCount}
          onPress={() => setTab("inbox")}
        />
        <TabButton label="Oppgaver" active={tab === "tasks"} onPress={() => setTab("tasks")} />
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  badge,
  onPress,
}: {
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <View style={styles.tabLabelRow}>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.muted,
  },
  signOut: {
    fontSize: 15,
    color: colors.muted,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: "700",
  },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
