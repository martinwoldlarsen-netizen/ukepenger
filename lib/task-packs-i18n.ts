// Kategorier og forslag på Oppgaver-siden på engelsk og ukrainsk (nøkkel =
// norsk tekst). En oppgave som legges til, lagres med teksten forelderen ser.
import type { Lang } from "@/lib/i18n";

const CATEGORY: Record<"en" | "uk", Record<string, string>> = {
  en: {
    huset: "The house", bad: "The bathroom", kjokken: "Kitchen and food", avfall: "Rubbish and recycling", klaer: "Clothes and laundry",
    ute: "Outdoors and garden", dyr: "Animals", skole: "School and responsibility", minste: "For the little ones", snill: "Kind and helpful", andre: "Other tasks",
  },
  uk: {
    huset: "Дім", bad: "Ванна кімната", kjokken: "Кухня та їжа", avfall: "Сміття та сортування", klaer: "Одяг і прання",
    ute: "Надворі та в саду", dyr: "Тварини", skole: "Школа та відповідальність", minste: "Для найменших", snill: "Добрі справи", andre: "Інші завдання",
  },
};

const TASK: Record<"en" | "uk", Record<string, string>> = {
  en: {
    "Rydde rommet": "Tidy your room", "Re opp sengen": "Make your bed", "Henge opp klærne": "Hang up your clothes", Støvsuge: "Vacuum",
    "Ta oppvasken": "Do the dishes", "Dekke bordet": "Set the table", "Tømme oppvaskmaskinen": "Empty the dishwasher", "Ta ut søppel": "Take out the rubbish",
    "Lufte hunden": "Walk the dog", "Mate dyrene": "Feed the pets", "Måke snø": "Shovel snow", "Rake løv": "Rake leaves",
    "Lekser uten mas": "Homework without nagging", "Lese i 20 minutter": "Read for 20 minutes", "Øve på instrument": "Practise an instrument", "Pakke sekken selv": "Pack your school bag",
    "Støvsuge stua": "Vacuum the living room", "Tørke støv": "Dust", "Vaske gulvet": "Wash the floor", "Rydde stua": "Tidy the living room",
    "Vaske vinduer": "Clean the windows", "Vanne blomstene": "Water the plants", "Rydde gangen": "Tidy the hallway", "Rydde opp etter seg": "Clean up after yourself",
    "Lufte rommet": "Air your room", "Rydde skrivebordet": "Tidy your desk", "Bytte lyspære": "Change a light bulb", "Rydde bokhylla": "Tidy the bookshelf",
    "Vaske speil": "Clean the mirror", "Rydde i skapet": "Tidy the cupboard", "Rydde badet": "Tidy the bathroom", "Vaske badet": "Clean the bathroom",
    "Vaske vasken": "Clean the sink", "Vaske do": "Clean the toilet", "Henge opp håndklær": "Hang up towels", "Tørke av dusjveggen": "Wipe the shower wall",
    "Fylle på dopapir": "Refill toilet paper", "Rydde av bordet": "Clear the table", "Rydde bordet": "Tidy the table", "Fylle oppvaskmaskinen": "Load the dishwasher",
    "Tørke av bordet": "Wipe the table", "Tørke av benken": "Wipe the counter", "Smøre matpakke": "Make a packed lunch", "Lage frokost": "Make breakfast",
    "Hjelpe til med middagen": "Help with dinner", "Lage middag selv": "Make dinner yourself", Bake: "Bake", "Skrelle poteter": "Peel potatoes",
    "Kutte grønnsaker": "Chop vegetables", "Rydde kjøleskapet": "Tidy the fridge", "Lage salat": "Make a salad", "Tømme brødsmuler": "Empty the crumbs",
    "Sette bort maten": "Put the food away", "Tørke oppvask": "Dry the dishes", "Sortere søppel": "Sort the rubbish", "Pante flasker": "Return bottles for deposit",
    "Bære inn handleposene": "Carry in the shopping bags", "Ta ut papir": "Take out the paper", "Ta ut plast": "Take out the plastic", "Ta ut glass og metall": "Take out glass and metal",
    "Skylle melkekartonger": "Rinse milk cartons", "Trille søppeldunken ut": "Wheel out the bin", "Skittentøy i kurven": "Dirty clothes in the basket", "Brette klær": "Fold clothes",
    "Henge opp klesvask": "Hang up the washing", "Skifte på sengen": "Change the bed sheets", "Rydde i gangen og skoene": "Tidy the hallway and shoes", "Rydde klesskapet": "Tidy the wardrobe",
    "Sette på vaskemaskinen": "Start the washing machine", "Sortere klesvask": "Sort the laundry", "Pusse sko": "Polish shoes", "Legge bort rene klær": "Put away clean clothes",
    "Klippe plenen": "Mow the lawn", "Luke i hagen": "Weed the garden", "Bære inn ved": "Carry in firewood", "Vaske bilen": "Wash the car",
    "Rydde boden": "Tidy the shed", "Feie trappa": "Sweep the steps", "Vanne hagen": "Water the garden", "Plukke bær": "Pick berries",
    "Plante blomster": "Plant flowers", "Rydde lekeplassen i hagen": "Tidy the play area in the garden", "Strø med sand": "Spread grit on the path", "Vaske sykkelen": "Wash your bike",
    "Hente posten": "Fetch the post", "Gi dyrene vann": "Give the pets water", "Måke kattedoen": "Clean the litter box", "Rengjøre buret": "Clean the cage",
    "Mate fiskene": "Feed the fish", "Børste hunden": "Brush the dog", "Leke med katten": "Play with the cat", "Plukke hundebæsj i hagen": "Pick up dog poo in the garden",
    "Mate fuglene": "Feed the birds", "Stå opp selv": "Get up by yourself", "Legge seg uten mas": "Go to bed without nagging", "Pakke treningsbagen": "Pack your sports bag",
    "Øve på gangetabellen": "Practise times tables", "Skrive dagbok": "Write in your diary", "Skjermfri ettermiddag": "Screen-free afternoon", "Lage ukeplan": "Make a weekly plan",
    "Rydde lekene": "Tidy your toys", "Rydde legoen": "Tidy the LEGO", "Kle på seg selv": "Get dressed by yourself", "Pusse tennene selv": "Brush your teeth by yourself",
    "Sortere sokker": "Sort socks", "Hjelpe til med handleposene": "Help with the shopping bags", "Rydde tegnesakene": "Tidy the drawing things", "Legge bamser på plass": "Put the teddies away",
    "Henge opp jakka": "Hang up your jacket", "Sette skoene på plass": "Put your shoes away", "Vaske hendene før mat": "Wash your hands before eating", "Hjelpe et søsken med lekser": "Help a sibling with homework",
    "Passe småsøsken": "Look after a younger sibling", "Ringe besteforeldre": "Call your grandparents", "Hjelpe en nabo": "Help a neighbour", "Lese for småsøsken": "Read to a younger sibling",
    "Lage en tegning til noen": "Make a drawing for someone", "Hjelpe til uten å bli spurt": "Help without being asked", "Være med på handletur": "Come along shopping",
  },
  uk: {
    "Rydde rommet": "Прибрати в кімнаті", "Re opp sengen": "Застелити ліжко", "Henge opp klærne": "Повісити одяг", Støvsuge: "Пропилососити",
    "Ta oppvasken": "Помити посуд", "Dekke bordet": "Накрити на стіл", "Tømme oppvaskmaskinen": "Розвантажити посудомийку", "Ta ut søppel": "Винести сміття",
    "Lufte hunden": "Вигуляти собаку", "Mate dyrene": "Нагодувати тварин", "Måke snø": "Розчистити сніг", "Rake løv": "Згребти листя",
    "Lekser uten mas": "Домашнє завдання без нагадувань", "Lese i 20 minutter": "Читати 20 хвилин", "Øve på instrument": "Позайматися на інструменті", "Pakke sekken selv": "Самостійно зібрати рюкзак",
    "Støvsuge stua": "Пропилососити вітальню", "Tørke støv": "Витерти пил", "Vaske gulvet": "Помити підлогу", "Rydde stua": "Прибрати у вітальні",
    "Vaske vinduer": "Помити вікна", "Vanne blomstene": "Полити квіти", "Rydde gangen": "Прибрати в передпокої", "Rydde opp etter seg": "Прибрати за собою",
    "Lufte rommet": "Провітрити кімнату", "Rydde skrivebordet": "Прибрати письмовий стіл", "Bytte lyspære": "Замінити лампочку", "Rydde bokhylla": "Прибрати книжкову полицю",
    "Vaske speil": "Помити дзеркало", "Rydde i skapet": "Прибрати в шафі", "Rydde badet": "Прибрати у ванній", "Vaske badet": "Помити ванну кімнату",
    "Vaske vasken": "Помити раковину", "Vaske do": "Помити унітаз", "Henge opp håndklær": "Повісити рушники", "Tørke av dusjveggen": "Витерти стінку душу",
    "Fylle på dopapir": "Поповнити туалетний папір", "Rydde av bordet": "Прибрати зі столу", "Rydde bordet": "Прибрати на столі", "Fylle oppvaskmaskinen": "Завантажити посудомийку",
    "Tørke av bordet": "Витерти стіл", "Tørke av benken": "Витерти стільницю", "Smøre matpakke": "Зробити бутерброди з собою", "Lage frokost": "Приготувати сніданок",
    "Hjelpe til med middagen": "Допомогти з вечерею", "Lage middag selv": "Самостійно приготувати вечерю", Bake: "Спекти щось", "Skrelle poteter": "Почистити картоплю",
    "Kutte grønnsaker": "Нарізати овочі", "Rydde kjøleskapet": "Прибрати в холодильнику", "Lage salat": "Зробити салат", "Tømme brødsmuler": "Висипати крихти",
    "Sette bort maten": "Прибрати їжу", "Tørke oppvask": "Витерти посуд", "Sortere søppel": "Посортувати сміття", "Pante flasker": "Здати пляшки",
    "Bære inn handleposene": "Занести пакети з покупками", "Ta ut papir": "Винести папір", "Ta ut plast": "Винести пластик", "Ta ut glass og metall": "Винести скло й метал",
    "Skylle melkekartonger": "Сполоснути пакети з-під молока", "Trille søppeldunken ut": "Викотити смітник", "Skittentøy i kurven": "Брудний одяг — у кошик", "Brette klær": "Скласти одяг",
    "Henge opp klesvask": "Розвісити білизну", "Skifte på sengen": "Змінити постіль", "Rydde i gangen og skoene": "Прибрати в передпокої та взуття", "Rydde klesskapet": "Прибрати в шафі з одягом",
    "Sette på vaskemaskinen": "Увімкнути пральну машину", "Sortere klesvask": "Посортувати білизну", "Pusse sko": "Почистити взуття", "Legge bort rene klær": "Розкласти чистий одяг",
    "Klippe plenen": "Підстригти газон", "Luke i hagen": "Прополоти город", "Bære inn ved": "Занести дрова", "Vaske bilen": "Помити машину",
    "Rydde boden": "Прибрати в коморі", "Feie trappa": "Підмести сходи", "Vanne hagen": "Полити сад", "Plukke bær": "Зібрати ягоди",
    "Plante blomster": "Посадити квіти", "Rydde lekeplassen i hagen": "Прибрати ігровий майданчик у дворі", "Strø med sand": "Посипати доріжку піском", "Vaske sykkelen": "Помити велосипед",
    "Hente posten": "Забрати пошту", "Gi dyrene vann": "Налити тваринам води", "Måke kattedoen": "Почистити котячий лоток", "Rengjøre buret": "Почистити клітку",
    "Mate fiskene": "Нагодувати рибок", "Børste hunden": "Розчесати собаку", "Leke med katten": "Погратися з котом", "Plukke hundebæsj i hagen": "Прибрати за собакою у дворі",
    "Mate fuglene": "Нагодувати пташок", "Stå opp selv": "Самостійно встати", "Legge seg uten mas": "Лягти спати без нагадувань", "Pakke treningsbagen": "Зібрати спортивну сумку",
    "Øve på gangetabellen": "Повторити таблицю множення", "Skrive dagbok": "Написати в щоденник", "Skjermfri ettermiddag": "Вечір без екранів", "Lage ukeplan": "Скласти план на тиждень",
    "Rydde lekene": "Прибрати іграшки", "Rydde legoen": "Прибрати LEGO", "Kle på seg selv": "Самостійно одягнутися", "Pusse tennene selv": "Самостійно почистити зуби",
    "Sortere sokker": "Розібрати шкарпетки", "Hjelpe til med handleposene": "Допомогти з пакетами", "Rydde tegnesakene": "Прибрати приладдя для малювання", "Legge bamser på plass": "Покласти іграшки на місце",
    "Henge opp jakka": "Повісити куртку", "Sette skoene på plass": "Поставити взуття на місце", "Vaske hendene før mat": "Помити руки перед їжею", "Hjelpe et søsken med lekser": "Допомогти брату чи сестрі з уроками",
    "Passe småsøsken": "Доглянути за молодшими", "Ringe besteforeldre": "Подзвонити бабусі й дідусеві", "Hjelpe en nabo": "Допомогти сусідові", "Lese for småsøsken": "Почитати молодшим",
    "Lage en tegning til noen": "Намалювати малюнок для когось", "Hjelpe til uten å bli spurt": "Допомогти без прохання", "Være med på handletur": "Сходити разом по покупки",
  },
};

export function categoryTitle(key: string, fallback: string, lang: Lang) {
  return lang === "nb" ? fallback : (CATEGORY[lang][key] ?? fallback);
}

export function taskSuggestionTitle(title: string, lang: Lang) {
  return lang === "nb" ? title : (TASK[lang][title] ?? title);
}
