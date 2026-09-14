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
import { getRedirectUrl, signInWithGoogle } from "./lib/google-auth";

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
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<string | null>) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const info = await action();
      if (info) setInfoMessage(info);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePasswordLogin = useCallback(
    () =>
      run(async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return null;
      }),
    [run, email, password]
  );

  const handleSendCode = useCallback(
    () =>
      run(async () => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setCodeSent(true);
        return "Kode sendt. Sjekk e-posten din.";
      }),
    [run, email]
  );

  const handleVerifyCode = useCallback(
    () =>
      run(async () => {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "email",
        });
        if (error) throw error;
        return null;
      }),
    [run, email, code]
  );

  const handleGoogleLogin = useCallback(async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Google-innlogging feilet.");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Ukepenger</Text>
        <Text style={styles.subtitle}>Logg inn med kontoen din</Text>

        <Pressable
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.googleButtonText}>Logg inn med Google</Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>eller</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-post"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {mode === "password" ? (
          <TextInput
            style={styles.input}
            placeholder="Passord"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        ) : codeSent ? (
          <TextInput
            style={styles.input}
            placeholder="6-sifret kode fra e-post"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
        ) : null}

        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={
            mode === "password"
              ? handlePasswordLogin
              : codeSent
                ? handleVerifyCode
                : handleSendCode
          }
          disabled={loading || !email}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "password" ? "Logg inn" : codeSent ? "Logg inn" : "Send kode"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === "password" ? "code" : "password");
            setCodeSent(false);
            setCode("");
            setErrorMessage(null);
            setInfoMessage(null);
          }}
        >
          <Text style={styles.link}>
            {mode === "password"
              ? "Bruk engangskode på e-post i stedet"
              : "Bruk passord i stedet"}
          </Text>
        </Pressable>

        <Text style={styles.debug}>redirect: {getRedirectUrl()}</Text>
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
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
  },
  dividerText: {
    color: "#999",
    fontSize: 13,
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
  info: {
    color: "#0a7",
    textAlign: "center",
  },
  link: {
    color: "#06c",
    textAlign: "center",
    fontSize: 15,
    paddingVertical: 8,
  },
  debug: {
    color: "#bbb",
    textAlign: "center",
    fontSize: 11,
    marginTop: 12,
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
