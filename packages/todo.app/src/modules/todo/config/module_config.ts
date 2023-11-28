import { ModuleConfig } from "../../../bootstrap/interface";
import { routes } from "./routes";

import en_todo from "./i18n/en_todo.json";
import ru_todo from "./i18n/ru_todo.json";

export default {
  ROUTES: () => routes,

  I18N: (i18n) => {
    i18n.addResourceBundle("en", "todo", en_todo);
    i18n.addResourceBundle("ru", "todo", ru_todo);
  },
} as ModuleConfig;
