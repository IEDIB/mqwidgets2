import { EditorCloze } from "./components/editorCloze";
import { EditorInput } from "./components/editorInput";
import { EditorPanel } from "./components/editorPanel";
import { EditorMChoice } from "./components/editorMChoice";
import { cfg, shared } from "./globals";
import { EditorMChoiceCheckbox } from "./components/editorMChoiceCheckbox";
import { reflowLatex } from "./utils";
import { EditorTAD } from "./components/editorTAD";
import { MQDefinition } from "./types";

export function createQuillFromObject($el: JQuery<HTMLDivElement>, gid: string, obj: MQDefinition) {
    let created: EditorTAD | null = null;
    const qtype = obj.editor;

    if (obj.formulation) {
        const spanEl = "<span>" + obj.formulation + "</span>";
        $el.append(spanEl);
        // Probably will have to process mathjax
        reflowLatex();
    }

    $el.removeClass("pygen-cloze");
    if (qtype == cfg.QTYPES.C) {
        // clozed input (replace ini with boxes) 
        created = new EditorCloze($el, gid, obj, cfg.QTYPES.C, obj.initial_latex); 
        $el.addClass("pygen-cloze");
    } else if (qtype == cfg.QTYPES.P) {
        // Full panel
        created = new EditorPanel($el, gid, obj, cfg.QTYPES.P, true); 
    } else if (qtype == cfg.QTYPES.M) {
        obj.symbols = obj.symbols || [];
        // Multiple choice combo 
        created = new EditorMChoice($el, gid, obj, cfg.QTYPES.M, obj.symbols);
         
    } else if (qtype == cfg.QTYPES.Ms) {
        obj.symbols = obj.symbols || [];
        // Multiple choice radio and checkbox
        // TODO support multiple answers
        const multipleAnswers = Array.isArray(obj.ans);
        //created = new MultipleChoiceCombo($el, gid, obj.symbols);
        created = new EditorMChoiceCheckbox($el, gid, obj, cfg.QTYPES.Ms, multipleAnswers); 
    } else if (qtype == cfg.QTYPES.B) {
        // basic quill
        created = new EditorInput($el, gid, obj, cfg.QTYPES.B); 
    } else {
        // Simple quill input
        created = new EditorInput($el, gid, obj, cfg.QTYPES.S); 
    }
    const qid = created.get_qid();
    const groupContainer = shared[gid] || {};
    groupContainer[qid] = created; 

    created.setStatus(cfg.STATUS.UNMODIFIED);
    if (obj.initial_latex && qtype != cfg.QTYPES.C) {
        //console.log("Setting initial_latex", obj.initial_latex);
        created.latex(obj.initial_latex);
        created.setStatus(cfg.STATUS.MODIFIED);
    }  

    return qid;
};

