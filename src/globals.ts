import { MQ, MQWidgetsConfig, PageInfo, QuestionType, SharedContainer, SharedContextContainer, SharedDlgContainer } from "./types";
import { urlJoin } from "./utils";

/**
 * Extracts useful information from the current Moodle page
 * @returns 
 */

const parseUrlParams = function (url: string): {[name:string]: string} {
    const params: {[name:string]: any} = {};
    const parts = url.substring(1).split('&');

    for (let i = 0; i < parts.length; i++) {
        const nv = parts[i].trim().split('=');
        if (!nv[0]) continue;
        if (nv.length == 1) {
            params[nv[0]] = '1';
        } else {
            params[nv[0]] = nv[1];
        }
    }
    return params;
} 

// Change june2020: Allow guest user detection
// Change july2020: isTeacher, chapterid --> boost detection
const loadPageInfo = function (): PageInfo {
    if (!document.querySelector) {
        return {} as PageInfo;
    }
    // Get current user information
    let userId = -1;
    let userFullname = "Usuari convidat";

    const dataUserId = document.querySelector('[data-userid]');
    if (dataUserId) {
        userId = parseInt(dataUserId.getAttribute('data-userid') || '-1');
    }
    const userText = document.querySelector(".usertext") as HTMLElement;
    if (userText) {
        userFullname = userText.innerText;
    }
 
    // Get information about book id and chapter id (from the current url)
    let params: {[name:string]: any} = {};
    if (location.search) {
        params = parseUrlParams(location.search);
    }
    let chapterId = params["chapterid"];
    if(!chapterId) {
        // On first page, chapterid might not appear
        // Case on boost
        const ele = document.querySelector('input[name="chapterid"]') as HTMLInputElement;
        if(ele){
            chapterId = ele.value;
        }
    }

    let bookId = params.id;
    if(!bookId) {
        const ele = document.querySelector('div.singlebutton > form > input[name="id"]') as HTMLInputElement;
        if(ele){
            bookId = ele.value;
        }
    }

    // Get cookie for MoodleSession
    //const moodleSession = (document.cookie || "").split("MoodleSession=")[1];
    //moodleSession = moodleSession.split(";")[0];
    let cookie =  (document.cookie || "");
    let eq_cookie_pos = cookie.indexOf("=");
    let moodleSession = "";
    if(eq_cookie_pos>0) {
        moodleSession = cookie.substr(eq_cookie_pos+1);
    }
    if(moodleSession && moodleSession.indexOf(";") > 0) {
        moodleSession = moodleSession.split(";")[0];
    }
    
    // Get information about the course
    let courseId = "-1";
    let courseName;

    const footer = document.querySelector(".homelink > a") as HTMLAnchorElement;

    if (footer) {
        courseName = footer.innerText;
        const hrefVal = "?" + (footer.href.split("?")[1] || "");
        courseId = parseUrlParams(hrefVal).id;
    }

    const isTeacher = document.querySelector('.teacherdash.nav-item.nav-link') != null? 1 : 0;
    
    const site = (location.href.split("?")[0] || "").replace("/mod/book/view.php", "");
    
    return {
        userId: userId, 
        userFullname: userFullname, 
        bookId: bookId, 
        chapterId: chapterId, 
        assignNum: window.iedibAPI?.lliurament.id || 0,
        assignName: window.iedibAPI?.lliurament.title || "",
        courseName: courseName, 
        courseId: courseId, 
        isTeacher: isTeacher, 
        site: site, 
        moodleSession: moodleSession
    };
};


// Decide from where to load resources
window.MQWidgets = window.MQWidgets || {}

// Default values if not specified at initialization
 

class Cfg {
    BACKEND_BASEURL = "https://piworld.es/pigen/api/"
    MQWIDGETS_BASEURL = "https://iedib.github.io/mqwidgets2/dist/"
    MATHQUILL_URL = "https://iedib.github.io/mqwidgets2/lib/mathquill.matrix.min.js"
    pageInfo = loadPageInfo()
    STATUS = {
        UNMODIFIED: 100,
        MODIFIED: 200,
        CORRECT: 1,
        WRONG: 0
    }
    QTYPES: {[name:string]:QuestionType} = {
        S: 'simple',
        B: 'basic',
        C: 'cloze',
        P: 'panel',
        M: 'mchoice',  // multiple choice combo
        Ms: 'mchoice*' // multiple choice radio, checkbox
    };
   
    HAS_IAPACE: boolean = window["IB"]!=null && (window["IB"].iapace!=null)
  
    LANG:string = ''

    RIGHT_ICON = 'fas fa-check'; //'far fa-smile'; //   
    WRONG_ICON = 'fas fa-times'; //'far fa-dizzy'; //
    MAX_ATTEMPTS = 2;  // Maximum number of wrong attempts before showing right answer

    get CAS_URL(): string {
       return  urlJoin(this.BACKEND_BASEURL, "compare")
    }

    get PYGEN_URL(): string {
        return urlJoin(this.BACKEND_BASEURL, "generate");
    } 

    get GETANSWER_URL(): string {
        return urlJoin(this.BACKEND_BASEURL, "getanswer");
    }
 
    public setUserConfig(uc: MQWidgetsConfig) {
        if(uc.backendBaseUrl) {
            this.BACKEND_BASEURL = uc.backendBaseUrl
        }
        if(uc.lang) {
            this.LANG = uc.lang
        }
        if(uc.mathquillUrl) {
            this.MATHQUILL_URL = uc.mathquillUrl
        }
        if(uc.mqwidgetsBaseUrl) {
            this.MQWIDGETS_BASEURL = uc.mqwidgetsBaseUrl
        }
    }
     
}

export const cfg = new Cfg()

// Lazy load (it might no be loaded yet)
let MQI: MQ.MathQuill = {} as MQ.MathQuill 

export function StaticMath(div: HTMLElement): MQ.MathField {
    if(!MQI.StaticMath) {
        MQI = window.MathQuill.getInterface(2);
    }
    return MQI.StaticMath(div)
}

export function MathField(div: HTMLElement, config: MQ.IMathFieldConfig): MQ.MathField {
    if(!MQI.MathField) {
        MQI = window.MathQuill.getInterface(2);
    }
    return MQI.MathField(div, config)
}

export const shared: SharedContainer = {};

export const sharedDlg: SharedDlgContainer = {};

export const sharedContext: SharedContextContainer = {};
