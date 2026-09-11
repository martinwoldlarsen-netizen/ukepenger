import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

type Child = {
  id: string;
  name: string;
};

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
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : session ? (
        <ChildrenScreen session={session} />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    setErrorMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  }, [email, password]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Ukepenger</Text>
        <Text style={styles.subtitle}>Logg inn med kontoen din</Text>

        <TextInput
          style={styles.input}
          placeholder="E-post"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Passord"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Logg inn</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChildrenScreen({ session }: { session: Session }) {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChildren() {
      setErrorMessage(null);

      const profileRes = await supabase
        .from("profiles")
        .select("family_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileRes.error || !profileRes.data?.family_id) {
        setErrorMessage(profileRes.error?.message ?? "Fant ingen familie for denne kontoen.");
        setChildren([]);
        return;
      }

      const childrenRes = await supabase
        .from("children")
        .select("id, name")
        .eq("family_id", profileRes.data.family_id)
        .order("name");

      if (cancelled) return;

      if (childrenRes.error) {
        setErrorMessage(childrenRes.error.message);
        setChildren([]);
        return;
      }

      setChildren(childrenRes.data ?? []);
    }

    loadChildren();
    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barna mine</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Logg ut</Text>
        </Pressable>
      </View>

      {children === null ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.subtitle}>Ingen barn registrert enda.</Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.childRow}>
              <Text style={styles.childName}>{item.name}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#c00",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  signOut: {
    color: "#c00",
    fontSize: 15,
  },
  list: {
    padding: 20,
    gap: 10,
  },
  childRow: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  childName: {
    fontSize: 17,
    fontWeight: "600",
  },
});
