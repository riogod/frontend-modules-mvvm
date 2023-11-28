import { InitOptions } from "i18next";

export const i18nOptions: InitOptions = {
  resources: { ru: {}, en: {} },
  debug: false,
  fallbackLng: "en",
  keySeparator: ".",
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "cookie", "sessionStorage", "querystring"],
    lookupLocalStorage: "i18nextLng",
    caches: ["localStorage", "cookie"],
  },
  react: {
    bindI18n: "languageChanged",
    bindI18nStore: "added",
    transEmptyNodeValue: "",
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ["br", "strong", "i"],
    useSuspense: true,
  },
};
