import type { Locale, Messages } from "../types";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { tr } from "./tr";

export const messagesByLocale: Record<Locale, Messages> = { de, en, tr, it, fr, es };
