export type AvatarOption = {
  key: string;
  emoji: string;
  label: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "lion", emoji: "🦁", label: "Løve" },
  { key: "fox", emoji: "🦊", label: "Rev" },
  { key: "panda", emoji: "🐼", label: "Panda" },
  { key: "tiger", emoji: "🐯", label: "Tiger" },
  { key: "koala", emoji: "🐨", label: "Koala" },
  { key: "penguin", emoji: "🐧", label: "Pingvin" },
  { key: "unicorn", emoji: "🦄", label: "Enhjørning" },
  { key: "dragon", emoji: "🐲", label: "Drage" },
  { key: "rocket", emoji: "🚀", label: "Rakett" },
  { key: "star", emoji: "⭐", label: "Stjerne" },
  { key: "soccer", emoji: "⚽", label: "Fotball" },
  { key: "music", emoji: "🎵", label: "Musikk" },
];

export const DEFAULT_AVATAR_KEY = AVATAR_OPTIONS[0].key;

export function getAvatarByKey(key?: string | null): AvatarOption {
  return AVATAR_OPTIONS.find((item) => item.key === key) ?? AVATAR_OPTIONS[0];
}
