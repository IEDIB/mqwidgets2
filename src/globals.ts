import { MQ, QuestionType, SharedContainer, SharedDlgContainer } from "./types";

let pageInfo = null;



const HAS_IAPACE = window["IB"] && window["IB"].iapace;
const RIGHT_ICON = 'fas fa-check'; //'far fa-smile'; //
const WRONG_ICON = 'fas fa-times'; //'far fa-dizzy'; //
const MAX_ATTEMPTS = 2;  // Maximum number of wrong attempts before showing right answer
const CAS_URL = "https://piworld.es/pigen/api/compare";
const PYGEN_URL = "https://piworld.es/pigen/api/generate";
const GETANSWER_URL = "https://piworld.es/pigen/api/getanswer";
const BASE_URL = "https://piworld.es/iedib/matheditor";
const QTYPES: {[name:string]:QuestionType} = {
    S: 'simple',
    B: 'basic',
    C: 'cloze',
    P: 'panel',
    M: 'mchoice',  // multiple choice combo
    Ms: 'mchoice*' // multiple choice radio, checkbox
};
const STATUS = {
    UNMODIFIED: 100,
    MODIFIED: 200,
    CORRECT: 1,
    WRONG: 0
};

export const cfg = {
    BASE_URL,
    pageInfo,
    STATUS,
    QTYPES,
    GETANSWER_URL,
    PYGEN_URL,
    CAS_URL,
    MAX_ATTEMPTS,
    HAS_IAPACE,
    RIGHT_ICON,
    WRONG_ICON
} 

 

export function loadPageInfo() {
    if (window.iedibAPI) {
        pageInfo = window.iedibAPI.getPageInfo();
        console.log(pageInfo);
    }
}

export function StaticMath(div: HTMLElement): MQ.MathField {
    const MQI: MQ.MathQuill = window.MathQuill.getInterface(2);
    return MQI.StaticMath(div)
}

export function MathField(div: HTMLElement, config: MQ.IMathFieldConfig): MQ.MathField {
    const MQI: MQ.MathQuill = window.MathQuill.getInterface(2);
    return MQI.MathField(div, config)
}

export const shared: SharedContainer = {};

export const sharedDlg: SharedDlgContainer = {};
