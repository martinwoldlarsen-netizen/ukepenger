import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { signInWithGoogle } from "../lib/google-auth";
import { colors } from "../theme";

export default function LoginScreen() {
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

  const primaryAction =
    mode === "password" ? handlePasswordLogin : codeSent ? handleVerifyCode : handleSendCode;
  const primaryLabel = mode === "password" ? "Logg inn" : codeSent ? "Logg inn" : "Send kode";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Ukepenger</Text>
        <Text style={styles.subtitle}>Logg inn med kontoen din</Text>

        <Pressable
          style={[styles.googleButton, googleLoading && styles.disabled]}
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
          placeholderTextColor={colors.muted}
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
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        ) : codeSent ? (
          <TextInput
            style={styles.input}
            placeholder="6-sifret kode fra e-post"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
        ) : null}

        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.disabled]}
          onPress={primaryAction}
          disabled={loading || !email}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{primaryLabel}</Text>
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
            {mode === "password" ? "Bruk engangskode på e-post i stedet" : "Bruk passord i stedet"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: { color: colors.muted, fontSize: 13 },
  info: { color: colors.success, textAlign: "center" },
  error: { color: colors.danger, textAlign: "center" },
  link: {
    color: colors.accent,
    textAlign: "center",
    fontSize: 15,
    paddingVertical: 8,
  },
});
