import { sharedContext } from "./globals";

const TRANSLATIONS: any = {
    ca: {
        'check': 'Comprova',
        "General": 'General',
        "Símbols": "Símbols",
        "Geometria": "Geometria",
        "Intervals": "Intervals",
        "Funcions": "Funcions",
        "right_answer": "Resposta correcta",
        "close": "Tancar",
        "open_editor": "Obrir l'editor",
        "show_answer": "Mostra la solució",
        "choose_option": "Tria una opció",
        "next": "Següent",
        "goal_reached": "Repte aconseguit!",
        "wildcard": "Comodí",
        "answer": "Solució",
        "matheditor": "Editor matemàtic",
        "accept": "Acceptar",
        "cancel": "Cancel·lar"
    },
    es: {
        'check': 'Comprueba',
        "General": 'General',
        "Símbols": "Símbolos",
        "Geometria": "Geometria",
        "Intervals": "Intervalos",
        "Funcions": "Funciones",
        "right_answer": "Respuesta correcta",
        "close": "Cerrar",
        "open_editor": "Abrir el editor",
        "show_answer": "Muestra la solución",
        "choose_option": "Elige una opción",
        "next": "Siguiente",
        "goal_reached": "¡Reto conseguido!",
        "wildcard": "Comodín",
        "answer": "Solución",
        "matheditor": "Editor matemático",
        "accept": "Aceptar",
        "cancel": "Cancelar"
    },
    en: {
        'check': 'Check',
        "General": 'General',
        "Símbols": "Symbols",
        "Geometria": "Geometry",
        "Intervals": "Intervals",
        "Funcions": "Functions",
        "right_answer": "Right answer",
        "close": "Close",
        "open_editor": "Open the editor",
        "show_answer": "Show the answer",
        "choose_option": "Choose an option",
        "next": "Next",
        "goal_reached": "Goal acomplished!",
        "wildcard": "Wildcard",
        "answer": "Answer",
        "matheditor": "Math editor",
        "accept": "Accept",
        "cancel": "Cancel"
        
    }
};
 

// https://raw.githubusercontent.com/wiziple/browser-lang/master/src/index.js
function getBrowserLang(): string {
    if (typeof window === "undefined") {
        return 'en'
    }
    const navigator: any = window.navigator
    let lang =
        (navigator.languages && navigator.languages[0]) ||
        navigator.language ||
        navigator.browserLanguage ||
        navigator.userLanguage ||
        navigator.systemLanguage ||
        'en_US'
    lang = lang.toLowerCase().replace(/-/, "_")
    return lang.toLowerCase().split("_")[0]
}
 
const systemLang = getBrowserLang()
console.error("SystemLang: ", systemLang)

export function I18n(key: string, gid?: string): string {
    let lang = systemLang
    if(gid && sharedContext['gid'] && sharedContext['gid'].lang) {
        lang = sharedContext['gid'].lang
    } 
    let langPack = TRANSLATIONS[lang]
    if (!langPack) {
        //Unknown language - use fallback english
        langPack = TRANSLATIONS['en']
    }
    return langPack[key] || key || ''
}