import { cfg, sharedContext } from "./globals";

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
        "cancel": "Cancel·lar",
        "expected_ans": "S'esperava la resposta",
        "error_verifying": "Ho sentim però hi ha hagut un problema a l'hora de verificar la resposta.", 
        "wrong_answer": "Resposta incorrecta. Intentau de nou.",
        "sym_notallowed": "No es permet el símbol <b>${1}</b> en la resposta.",
        "sym_once": "El símbol <b>${1}</b> només es pot emprar com a màxim una vegada en la resposta.",
        "error_cantprocess": "Error: Hi ha respostes donades que no es poden processar. Provau d'eliminar els espais en blanc.",
        "ans_missing": "Falten respostes"
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
        "cancel": "Cancelar",
        "expected_ans": "Se esperaba la respuesta",
        "error_verifying": "Lo sentimos, ha habido un problema cuando se verificaba la respuesta.",
        "wrong_answer": "Respuesta incorrecta. Inténtalo de nuevo.",
        "sym_notallowed": "No se permite el símbolo <b>${1}</b> en la respuesta.",
        "sym_once": "El símbolo <b>${1}</b> solo es puede emplear una vez como máximo en la respuesta.",
        "error_cantprocess": "Error: Hay respuestas que no se pueden procesar. Intente eliminar los espacios en blanco.",
        "ans_missing": "Faltan respuestas"
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
        "cancel": "Cancel",
        "expected_ans": "The expected answer is",
        "error_verifying": "We are sorry. There has been a problem while verifying the answer.",
        "wrong_answer": "Wrong answer. Try it again.",
        "sym_notallowed": "The symbol <b>${1}</b> is not allowed in the answer.",
        "sym_once": "The symbol <b>${1}</b> can only be used once in the answer.",
        "error_cantprocess": "Error: There are some answers that can't be processed. Try removing white spaces.",
        "ans_missing": "There are some blank answers"
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
 
const BROWSER_LANG = getBrowserLang() 

export function I18n(key: string, ...args: any[]): string {
    const lang = cfg.LANG || BROWSER_LANG  
    let langPack = TRANSLATIONS[lang]
    if (!langPack) {
        //Unknown language - use fallback english
        console.error("Cannot find translations in ", lang, ". Using fallback [en]")
        langPack = TRANSLATIONS['en']
    }
    // check if it must interpolate some var
    let out = langPack[key] || key || ''
    for(let i=0; i < args.length; i++) {
        out = out.replace('${'+(i+1)+'}', args[i])
    }
    return out
}