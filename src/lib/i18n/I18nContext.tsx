import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Language, type TranslationKeys } from "./translations";

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    const t = translations[language];

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

export function useTranslation() {
    const { language, setLanguage, t } = useI18n();

    const toggleLanguage = useCallback(() => {
        setLanguage(language === "en" ? "fr" : "en");
    }, [language, setLanguage]);

    return {
        language,
        setLanguage,
        toggleLanguage,
        t,
    };
}