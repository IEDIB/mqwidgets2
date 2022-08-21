import { EditorCloze } from "./components/editorCloze";
import { EditorInput } from "./components/editorInput";
import { EditorPanel } from "./components/editorPanel";
import { MultipleChoiceCombo } from "./components/multipleChoiceCombo";
import { cfg, shared } from "./globals";
import { MultipleChoiceCheckbox } from "./multipleChoiceCheckbox";
import { reflowLatex } from "./utils";

export function createQuillFromObject($el: JQuery<HTMLDivElement>, gid: string, obj: any) {
    const ansType = obj.ans ? 'ans' : 'anse';
    let created: any = null;
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
        created = new EditorCloze($el, gid, obj.initial_latex);
        created.qtype = cfg.QTYPES.C;
        $el.addClass("pygen-cloze");
    } else if (qtype == cfg.QTYPES.P) {
        // Full panel
        created = new EditorPanel($el, gid, true);
        created.qtype = cfg.QTYPES.P;
    } else if (qtype == cfg.QTYPES.M) {
        obj.symbols = obj.symbols || [];
        // Multiple choice combo 
        created = new MultipleChoiceCombo($el, gid, obj.symbols);
        created.qtype = cfg.QTYPES.M;
    } else if (qtype == cfg.QTYPES.Ms) {
        obj.symbols = obj.symbols || [];
        // Multiple choice radio and checkbox
        // TODO support multiple answers
        const multipleAnswers = Array.isArray(obj.ans);
        //created = new MultipleChoiceCombo($el, gid, obj.symbols);
        created = new MultipleChoiceCheckbox($el, gid, obj.symbols, multipleAnswers);
        created.qtype = cfg.QTYPES.Ms;
    } else {
        // Simple or basic quill input
        created = new EditorInput($el, gid, qtype);
        created.qtype = cfg.QTYPES.S;
    }
    const qid = created.get_qid();
    const groupContainer = shared[gid] || {};
    groupContainer[qid] = created;
    created[ansType] = obj[ansType];

    created.status = cfg.STATUS.UNMODIFIED;
    if (obj.initial_latex && qtype != cfg.QTYPES.C) {
        console.log("Setting initial_latex", obj.initial_latex);
        created.latex(obj.initial_latex);
        created.status = cfg.STATUS.MODIFIED;
    }
    created.setDefinition(obj);

    return qid;
};

