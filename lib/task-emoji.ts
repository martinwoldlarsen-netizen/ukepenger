// Gir hver oppgave et bilde ut fra navnet, så barn som ikke kan lese ennå
// (4–6 år) kjenner igjen oppgaven. Ingen lagring: samme navn gir alltid
// samme bilde, og ukjente oppgaver får en stjerne.

const RULES: Array<[RegExp, string]> = [
  [/oppvaskmaskin/i, "🍽️"],
  [/oppvask|vaske opp|tallerken/i, "🧽"],
  [/søppel|soppel|søpla|resirk/i, "🗑️"],
  [/støvsug|stovsug/i, "🧹"],
  [/feie|kost/i, "🧹"],
  [/rydd/i, "🧸"],
  [/seng|re opp/i, "🛏️"],
  [/klær|klaer|henge|skittentøy|vask(e)? ?tøy|tøy/i, "👕"],
  [/dekke|bord/i, "🍴"],
  [/lage mat|middag|frokost|bake|matlag/i, "🍳"],
  [/hund|lufte/i, "🐕"],
  [/katt/i, "🐈"],
  [/mate|dyr|fisk/i, "🐾"],
  [/snø|sno|måke|make/i, "☃️"],
  [/løv|lov|rake|hage|plen|gress|ugress|blomst|vanne/i, "🍂"],
  [/bil/i, "🚗"],
  [/lekse|skole/i, "📝"],
  [/les(e|ing)|bok/i, "📖"],
  [/øve|ove|instrument|piano|gitar|fiolin/i, "🎵"],
  [/sekk|pakke/i, "🎒"],
  [/tann|pusse/i, "🪥"],
  [/dusj|bad/i, "🛁"],
  [/sko/i, "👟"],
  [/vindu/i, "🪟"],
  [/handle|butikk|innkjøp/i, "🛒"],
  [/søsken|passe på|barnevakt|lillebror|lillesøster/i, "🧒"],
  [/trening|løpe|sykle|sport/i, "⚽"],
  [/hjelp/i, "🤝"],
];

export function taskEmoji(title: string) {
  for (const [re, emoji] of RULES) if (re.test(title)) return emoji;
  return "⭐";
}
