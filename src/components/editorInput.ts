import { cfg, MathField, shared, sharedDlg } from "../globals";
import { I18n } from "../I18n";
import { MQ, MQDefinition, QuestionType } from "../types";
import { reflowLatex, sanitizeLaTeX } from "../utils";
import { PwDialog } from "./dialogs/dialog";
import { EditorDialog } from "./dialogs/editorDialog";
import { EditorBase } from "./editorBase";
import { EditorTAD } from "./editorTAD";

export class EditorInput extends EditorBase implements EditorTAD {
    quill_el_container: JQuery<HTMLElement>;
    quill_blocker: JQuery<HTMLElement>;
    check_el: JQuery<HTMLElement>;
    mathInput: MQ.MathField;
    dlg_btn_el: JQuery<HTMLElement> | undefined; 

    constructor(parent: JQuery<HTMLDivElement>, gid: string, def: MQDefinition, qtype: QuestionType) {
        super(parent, gid, def, qtype)
        var self = this;
        this.quill_el_container = $('<div class="pw-me-editorinput"></div>');
        this.quill_blocker = $('<div></div>')
        var quill_el = $('<span></span>');
        this.quill_blocker.append(quill_el);
        this.check_el = $('<div class="pw-me-check"></div>');
        this.quill_el_container.append(this.quill_blocker);
        var isBtn = (qtype === cfg.QTYPES.S);

        this.parent.append(this.quill_el_container);

        this.mathInput = MathField(quill_el[0], {
            handlers: {
                edit: function () {
                    console.log("Edit ev on mathquill ", self.mathInput.latex());
                    if (self.status != cfg.STATUS.MODIFIED) {
                        self.check_el.html('');
                        self.status = cfg.STATUS.MODIFIED;
                        self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                    }
                }
            }
        });

        if (isBtn) {
            this.dlg_btn_el = $('<button class="btn btn-sm pw-me-btn-openeditor" title="'+I18n('open_editor', this.gid)+'"><i class="fas fa-square-root-alt"></i></button>');
            this.quill_el_container.append(this.dlg_btn_el);
            this.dlg_btn_el.on("click", function (ev) {
                ev.preventDefault();
                // open a editordlg
                // must do the binding when closing
                var dlg: EditorDialog = sharedDlg['editordlg'] as EditorDialog;
                if (!dlg) {
                    dlg = new EditorDialog();
                    sharedDlg['editordlg'] = dlg;
                }
                dlg.acceptFn = function (self2: any) {
                    self.mathInput.latex(self2.latex());
                };
                dlg.setDefinition(self.def);
                dlg.show();
                dlg.latex(self.mathInput.latex());

            });
        }
        this.quill_el_container.append(this.check_el);
    } 

    get_qid(): number {
        return this.mathInput.id
    } 
    
    clear() {
        this.mathInput.latex('');
        this.check_el.html('');
        this.status = cfg.STATUS.UNMODIFIED;
        this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
    }

    focus() {
        this.mathInput.focus();
    }

    latex(tex?: string): string[] {
        if (tex != null) {
            console.log("Setting latex ", tex);
            this.mathInput.latex(tex);
            this.status = cfg.STATUS.UNMODIFIED;
        } else {
            return [sanitizeLaTeX(this.mathInput.latex())];
        }
        return []
    }

    checkMsg(status: number, msg: string) {
        this.status = status;
        var msg2 = null;
        if (status == 1) {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="' + cfg.RIGHT_ICON + '"></i></span>';
            this.quill_el_container.addClass('pw-me-right');
        } else if (status == 0) {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="' + cfg.WRONG_ICON + '"></i></span>';
            this.quill_el_container.addClass('pw-me-wrong');
        } else {
            msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
            this.quill_el_container.addClass('pw-me-alert');
        }
        this.check_el.html(msg2);
    }


    dispose() {
        this.mathInput.revert();
        this.quill_el_container.find("button").off();
    }

    showAnswer() {
        if (!this.def.right_answer) {
            console.error("Cannot show answer because, ", this.def.right_answer);
            return;
        }

        var self = this;
        //const showAnswerBtn = $('<button class="btn btn pw-me-btn-showanswer" data-toggle="tooltip" title="Mostrar la solució"><i class="fas fa-question-circle"></i></button>') as JQuery<HTMLButtonElement>;
        //this.quill_el_container.append(showAnswerBtn);

        // Must create a global dialog
        if (!sharedDlg["showAnswerDlg"]) {
            var dlg = new PwDialog(I18n('right_answer', this.gid), 400, 250);
            sharedDlg["showAnswerDlg"] = dlg;
            var answerHolder = $('<div class="pw-answer-holder"></div>');
            dlg.append(answerHolder);
            var closeBtn = $('<button class="btn btn-sm btn-primary" style="margin-left: 15px;">'+I18n('close', this.gid)+'</button>');
            dlg.append(closeBtn);
            closeBtn.on('click', function (ev) {
                ev.preventDefault();
                dlg.close();
            });
        }

       // showAnswerBtn.on('click', function(ev){
       //     ev.preventDefault();
            if (!self.isAnswerShown) {
                self.isAnswerShown = true;
                self.status = cfg.STATUS.UNMODIFIED;
                // Disable mathquill
                self.quill_blocker.addClass('pw-me-blocker');
                // Disable edit buttton
                if (self.dlg_btn_el) {
                    self.dlg_btn_el.prop("disabled", true);
                }
            }

            var dlg = sharedDlg["showAnswerDlg"];
            var answerHolder = dlg.window.find(".pw-answer-holder");
            if (self.def) {
                answerHolder.html(atob(self.def.right_answer) + '<p><br></p>');
                reflowLatex();
                dlg.show();
            }

       // });
    }

    increment_wrong() {
        console.log("increment wrong", this.wrong_attemps == cfg.MAX_ATTEMPTS + 1, !this.pigen)
        this.wrong_attemps += 1;
        if (this.wrong_attemps == cfg.MAX_ATTEMPTS + 1 && !this.pigen) {
            console.log("creating a rescue", this.def);

            // create a button to display answer
            var rescueBtn = $('<button class="btn btn-sm" title="'+I18n('show_answer',this.gid)+'"><i class="far fa-question-circle"></i></button>');
            var self = this;
            rescueBtn.on("click", function (evt) {
                self.showAnswer();
            });
            if (!this.def.right_answer) {
                // Must ask the server to generate a right_answer for us by sending the def object
                $.ajax({
                    type: "POST",
                    url: cfg.GETANSWER_URL,
                    data: JSON.stringify(this.def),
                    dataType: 'json',
                    success: function (datos) {
                        if (datos.right_answer && self.def) {
                            self.def.right_answer = datos.right_answer;
                            self.quill_el_container.append(rescueBtn);
                        } else if (datos.msg) {
                            console.error(datos.msg);
                        }
                    }
                });
            } else {
                this.quill_el_container.append(rescueBtn);
            }

        }
    }

    reflow() {
        this.mathInput.reflow();
        this.status = cfg.STATUS.UNMODIFIED;
    }
}
