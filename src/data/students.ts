export interface Student {
  id: string;
  fullName: string;
  shortName: string;
  initials: string;
  telegramUsername?: string;
  telegramId?: string;
  colorGradient: string;
  bgGradient: string;
}

export const STUDENTS_LIST: Student[] = [
  {
    id: "avvakumov-maksim",
    fullName: "Аввакумов Максим Алексеевич",
    shortName: "Максим Аввакумов",
    initials: "МА",
    telegramUsername: "dark_person228",
    colorGradient: "from-blue-600 to-cyan-500",
    bgGradient: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  },
  {
    id: "borisov-aleksandr",
    fullName: "Борисов Александр Петрович",
    shortName: "Александр Борисов",
    initials: "АБ",
    telegramUsername: "soulrim3",
    colorGradient: "from-amber-500 to-orange-500",
    bgGradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
  },
  {
    id: "vavilina-polina",
    fullName: "Вавилина Полина Андреевна",
    shortName: "Полина Вавилина",
    initials: "ПВ",
    telegramUsername: "polishhh13",
    colorGradient: "from-purple-500 to-pink-500",
    bgGradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  },
  {
    id: "gizatullina-rufiya",
    fullName: "Гизатуллина Руфия Фанисовна",
    shortName: "Руфия Гизатуллина",
    initials: "РГ",
    telegramUsername: "mmowul",
    colorGradient: "from-emerald-500 to-teal-400",
    bgGradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  },
  {
    id: "kiselevich-artyom",
    fullName: "Киселевич Артём Максимович",
    shortName: "Артём Киселевич",
    initials: "АК",
    telegramUsername: "NE_UPOMIHATb",
    colorGradient: "from-indigo-500 to-blue-500",
    bgGradient: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  },
  {
    id: "korsakov-dmitriy",
    fullName: "Корсаков Дмитрий Андреевич",
    shortName: "Дмитрий Корсаков",
    initials: "ДК",
    telegramUsername: "swawwq",
    colorGradient: "from-teal-500 to-cyan-500",
    bgGradient: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
  },
  {
    id: "kostin-nikita",
    fullName: "Костин Никита Владимирович",
    shortName: "Никита Костин",
    initials: "НК",
    telegramUsername: "hoopeez",
    colorGradient: "from-violet-500 to-purple-500",
    bgGradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
  },
  {
    id: "lantsov-danil",
    fullName: "Ланцов Данил Андреевич",
    shortName: "Данил Ланцов",
    initials: "ДЛ",
    telegramUsername: "buld0zzzer",
    colorGradient: "from-blue-600 to-indigo-600",
    bgGradient: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)",
  },
  {
    id: "lebedkov-vladimir",
    fullName: "Лебедков Владимир Михайлович",
    shortName: "Владимир Лебедков",
    initials: "ВЛ",
    telegramId: "1155117300",
    colorGradient: "from-amber-600 to-yellow-500",
    bgGradient: "linear-gradient(135deg, #d97706 0%, #eab308 100%)",
  },
  {
    id: "leonova-arina",
    fullName: "Леонова Арина Александровна",
    shortName: "Арина Леонова",
    initials: "АЛ",
    telegramUsername: "huyiyiu",
    colorGradient: "from-fuchsia-500 to-pink-500",
    bgGradient: "linear-gradient(135deg, #d946ef 0%, #ec4899 100%)",
  },
  {
    id: "maksimov-yaroslav",
    fullName: "Максимов Ярослав Павлович",
    shortName: "Ярослав Максимов",
    initials: "ЯМ",
    telegramUsername: "l0stXP",
    colorGradient: "from-sky-500 to-blue-600",
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
  },
  {
    id: "mubarakshina-anastasiya",
    fullName: "Мубаракшина Анастасия Руслановна",
    shortName: "Анастасия Мубаракшина",
    initials: "АМ",
    telegramUsername: "seleniasss",
    colorGradient: "from-rose-500 to-red-400",
    bgGradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
  },
  {
    id: "ryzhakov-artyom",
    fullName: "Рыжаков Артём Николаевич",
    shortName: "Артём Рыжаков",
    initials: "АР",
    telegramUsername: "ow_077",
    colorGradient: "from-cyan-500 to-blue-500",
    bgGradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  },
  {
    id: "sedov-danil",
    fullName: "Седов Данил Григорьевич",
    shortName: "Данил Седов",
    initials: "ДС",
    telegramUsername: "Danzasa",
    colorGradient: "from-emerald-600 to-green-500",
    bgGradient: "linear-gradient(135deg, #059669 0%, #22c55e 100%)",
  },
  {
    id: "skudina-elena",
    fullName: "Скудина Елена Витальевна",
    shortName: "Елена Скудина",
    initials: "ЕС",
    telegramUsername: "l_ena_ss",
    colorGradient: "from-purple-400 to-indigo-400",
    bgGradient: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)",
  },
  {
    id: "filippov-kirill",
    fullName: "Филиппов Кирилл Александрович",
    shortName: "Кирилл Филиппов",
    initials: "КФ",
    telegramUsername: "fuckfanats",
    colorGradient: "from-indigo-600 to-violet-600",
    bgGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  },
  {
    id: "yakimova-albina",
    fullName: "Якимова Альбина Павловна",
    shortName: "Альбина Якимова",
    initials: "АЯ",
    telegramUsername: "svamialbb",
    colorGradient: "from-pink-600 to-rose-500",
    bgGradient: "linear-gradient(135deg, #db2777 0%, #f43f5e 100%)",
  },
  {
    id: "vakatov-stanislav",
    fullName: "Вакатов Станислав Олегович",
    shortName: "Станислав Вакатов",
    initials: "СВ",
    telegramUsername: "Labybysi",
    colorGradient: "from-amber-500 to-red-500",
    bgGradient: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
  },
  {
    id: "dolgov-dominik",
    fullName: "Долгов Доминик Романович",
    shortName: "Доминик Долгов",
    initials: "ДД",
    telegramUsername: "a2q1w",
    colorGradient: "from-cyan-600 to-teal-500",
    bgGradient: "linear-gradient(135deg, #0891b2 0%, #0d9488 100%)",
  },
  {
    id: "rodionov-artyom",
    fullName: "Родионов Артём Дмитриевич",
    shortName: "Артём Родионов",
    initials: "АР",
    telegramUsername: "MoonRaid",
    colorGradient: "from-blue-500 to-violet-500",
    bgGradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  },
];

export const TOTAL_STUDENTS_COUNT = STUDENTS_LIST.length; // 20 человек

/**
 * Finds a student in the whitelist by Telegram username or numeric ID
 */
export function findStudentByTelegram(query: string): Student | undefined {
  if (!query) return undefined;
  const clean = query.replace(/^@/, "").trim().toLowerCase();
  return STUDENTS_LIST.find((s) => {
    if (s.telegramUsername && s.telegramUsername.toLowerCase() === clean) {
      return true;
    }
    if (s.telegramId && s.telegramId.toLowerCase() === clean) {
      return true;
    }
    return false;
  });
}
