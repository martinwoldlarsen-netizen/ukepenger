// Gir hver oppgave et bilde ut fra navnet, så barn som ikke kan lese ennå
// (4–6 år) kjenner igjen oppgaven. Ingen lagring: samme navn gir alltid
// samme bilde, og ukjente oppgaver får en stjerne.

import { LIBRARY_EMOJI } from "@/lib/task-packs";
import { knownTaskKey } from "@/lib/task-packs-i18n";

// Norsk, engelsk og ukrainsk (kyrilliske ord står uten \b).
const RULES: Array<[RegExp, string]> = [
  [/pant|flaske|bottle|deposit|пляшк/i, "🥤"],
  [/sokk|\bsocks?\b|шкарпет/i, "🧦"],
  [/\bved\b|firewood|дров/i, "🪵"],
  [/oppvaskmaskin|dishwasher|посудомий/i, "🍽️"],
  [/oppvask|vaske opp|tallerken|\bdishes\b|washing.up|посуд/i, "🧽"],
  [/søppel|søppl|soppel|søpla|resirk|rubbish|trash|garbage|\bbins?\b|recycl|смітт|сортува/i, "🗑️"],
  [/støvsug|stovsug|vacuum|hoover|пилосос/i, "🧹"],
  [/feie|kost|\bsweep|broom|підмест|віник|вінник/i, "🧹"],
  [/rydd|\btidy|прибра/i, "🧸"],
  [/seng|re opp|\bbed\b|ліжк|постіл/i, "🛏️"],
  [/klær|klaer|henge|skittentøy|vask(e)? ?tøy|tøy|cloth|laundry|washing|hang up|одяг|прання|білизн|повісити/i, "👕"],
  [/dekke|bord|table|накри|стіл|стол/i, "🍴"],
  [/lage mat|middag|frokost|bake|matlag|\bcook|dinner|breakfast|готува|сніданок|вечер|обід|пекти/i, "🍳"],
  [/hund|lufte|\bdogs?\b|собак/i, "🐕"],
  [/katt|\bcats?\b|кіт|кота|кішк/i, "🐈"],
  [/mate|dyr|fisk|\bfeed|\bpets?\b|\bfish|нагодува|тварин|рибк/i, "🐾"],
  [/snø|sno|måke|make|\bsnow|сніг/i, "☃️"],
  [/løv|lov|rake|hage|plen|gress|ugress|blomst|vanne|leaves|garden|lawn|\bmow|\bweed|flower|plants?\b|листя|сад|газон|квіт|полити|рослин/i, "🍂"],
  [/\bbil(en)?\b|\bcar\b|машин|авто/i, "🚗"],
  [/lekse|skole|homework|school|домашн|урок|школ/i, "📝"],
  [/les(e|ing)|bok|\bread(ing)?\b|\bbooks?\b|читати|книж|книг/i, "📖"],
  [/øve|ove|instrument|piano|gitar|fiolin|practi[sc]e|guitar|violin|інструмент|піаніно|гітар|скрипк/i, "🎵"],
  [/sekk|pakke|\bbag\b|backpack|\bpack|рюкзак|портфел|зібрати/i, "🎒"],
  [/tann|pusse|teeth|tooth|зуб/i, "🪥"],
  [/dusj|bad|shower|bath|душ|ванн/i, "🛁"],
  [/sko|\bshoes?\b|взутт/i, "👟"],
  [/vindu|window|вікн/i, "🪟"],
  [/handle|butikk|innkjøp|shopping|покуп|магазин/i, "🛒"],
  [/søsken|passe på|barnevakt|lillebror|lillesøster|sibling|babysit|look after|молодш|брат|сестр/i, "🧒"],
  [/trening|løpe|sykle|sport|training|\brun\b|cycl|тренуван|бігати|спорт/i, "⚽"],
  [/hjelp|\bhelp|допомог/i, "🤝"],
];

export function taskEmoji(title: string) {
  // Kjente forslag på engelsk/ukrainsk slås opp via det norske navnet.
  const text = knownTaskKey(title) ?? title;
  const fixed = LIBRARY_EMOJI[text.trim().toLowerCase()];
  if (fixed) return fixed;
  for (const [re, emoji] of RULES) if (re.test(text)) return emoji;
  return "⭐";
}

// Emojier forelderen kan velge mellom når en oppgave ikke har et passende tegnet bilde.
export const TASK_EMOJI_CHOICES = [
  "⭐", "🧸", "🧹", "🧽", "🧺", "🧦", "👕", "🧥", "👟", "🛏️", "🚪", "🪟",
  "🍽️", "🍴", "🍳", "🥪", "🥕", "🛒", "🗑️", "♻️", "🥤", "🪴", "🌷", "🍂",
  "☃️", "🪵", "🚗", "🚲", "🐕", "🐈", "🐟", "🐇", "🐾", "📝", "📖", "🎒",
  "🎵", "⚽", "🏊", "🪥", "🛁", "🚿", "🧻", "🤝", "💛", "🧒", "👶", "📦",
] as const;
