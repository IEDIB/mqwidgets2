import { cfg, shared, sharedDlg, StaticMath } from "../globals"; 
import { I18n } from "../I18n";
import { MQ, MQDefinition, QuestionType } from "../types";
import { reflowLatex } from "../utils";
import { PwDialog } from "./dialogs/dialog";
import { EditorBase } from "./editorBase";
import { EditorTAD } from "./editorTAD";

export class EditorCloze extends EditorBase implements EditorTAD {
   
    quill_el_container: JQuery<HTMLDivElement>;
    check_el: JQuery<HTMLDivElement>;
    mathInput: MQ.MathField;
    dlg_btn_el: any;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, def: MQDefinition, qtype: QuestionType, ini: string) {
        super(parent, gid, def, qtype)
        const self = this; 
        this.dlg_btn_el = null;
        this.quill_el_container = $('<div class="pw-me-editorinput"></div>') as JQuery<HTMLDivElement>;
        const quill_el = $('<span>' + ini + '</span>') as JQuery<HTMLSpanElement>;
        this.check_el = $('<div class="pw-me-check"></div>') as JQuery<HTMLDivElement>;
        this.parent.append(this.quill_el_container);
        this.quill_el_container.append(quill_el);
        this.mathInput = StaticMath(quill_el[0]);
        // TODO: listen to changes to set status to unmodified

        this.mathInput.innerFields.forEach(function (e: MQ.InnerField) {
            e.__controller.textarea.on('keyup', function (ev) {
                ev.preventDefault();
                if (self.status != cfg.STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = cfg.STATUS.MODIFIED;
                    self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                }
            });
        });
        this.quill_el_container.append(this.check_el);
    } 

    clear() {
        this.mathInput.innerFields.forEach( (v) => v.latex(''));
        this.check_el.html('');
        this.status = cfg.STATUS.UNMODIFIED;
        this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
    }

    focus() {
        this.mathInput.focus();
    }

    latex(tex?: string): string[] {
        if (tex != null) {
            this.mathInput.latex(tex);
            this.status = cfg.STATUS.UNMODIFIED;
        } else {
            const parts = [];
            console.log(this.mathInput.innerFields);
            const v = this.mathInput.innerFields;
            for (let i = 0, lenv = v.length; i < lenv; i++) {
                parts.push(v[i].latex());
            }
            return parts;
        }
        return []
    }

    checkMsg(status: number, msg: string) {
        this.status = status;
        let msg2: string = '';
        if (status == 1) {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-check"></i></span>';
            this.quill_el_container.addClass('pw-me-right');
        } else if (status == 0) {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-times"></i></span>';
            this.quill_el_container.addClass('pw-me-wrong');
        } else {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
            this.quill_el_container.addClass('pw-me-alert');
        }
        this.check_el.html(msg2);
    }

    get_qid(): number {
        return this.mathInput.id
    } 

    dispose() {
        this.mathInput.revert();
        this.quill_el_container.find("button").off();
    }

    reflow() {
        this.mathInput.reflow();
        this.status = cfg.STATUS.UNMODIFIED;
    }
    
    showAnswer() {
        if(!this.def) {
            console.error("Cannot show answer because, def is null");
            return;
        }
        if (!this.def.right_answer) {
            console.error("Cannot show answer because, ", this.def.right_answer);
            return;
        }

        const self = this;
        //this.showAnswerBtn = $('<button class="btn btn pw-me-btn-showanswer" data-toggle="tooltip" title="Mostrar la solució"><i class="fas fa-question-circle"></i></button>');
        //this.quill_el_container.append(this.showAnswerBtn);

        // Must create a global dialog
        if (!sharedDlg["showAnswerDlg"]) {
            const dlg = new PwDialog(I18n('right_answer'), 400, 250);
            sharedDlg["showAnswerDlg"] = dlg;
            const answerHolder = $('<div class="pw-answer-holder"></div>');
            dlg.append(answerHolder);
            const closeBtn = $('<button class="btn btn-sm btn-primary" style="margin-left: 15px;">'+I18n('close')+'</button>');
            dlg.append(closeBtn);
            closeBtn.on('click', function (ev) {
                ev.preventDefault();
                dlg.close();
            });
        }

        // this.showAnswerBtn.on('click', function(ev){
        // ev.preventDefault();
        if (!self.isAnswerShown) {
            self.isAnswerShown = true;
            self.status = cfg.STATUS.UNMODIFIED;
            //Disable mathquill
            //self.quill_blocker.addClass('pw-me-blocker');
            //Disable edit buttton
            if (self.dlg_btn_el) {
                self.dlg_btn_el.prop("disabled", true);
            }
        }


        const dlg = sharedDlg["showAnswerDlg"];
        const answerHolder = dlg.window.find(".pw-answer-holder");
        if(self.def) {
            answerHolder.html(atob(self.def.right_answer) + '<p><br></p>');
            reflowLatex();
            dlg.show();
        }

    }

}
