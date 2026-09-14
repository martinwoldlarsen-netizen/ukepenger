import { StyleSheet } from "react-native";

export const colors = {
  background: "#ffffff",
  surface: "#f6f7f9",
  border: "#e4e7ec",
  text: "#0f172a",
  muted: "#667085",
  primary: "#0f172a",
  accent: "#4d7c0f",
  danger: "#b42318",
  success: "#15803d",
};

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  cardMeta: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  amount: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
  },
});
