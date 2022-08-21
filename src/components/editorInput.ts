import { cfg, shared } from "../globals";
import { reflowLatex, sanitizeLaTeX } from "../utils";
import { PwDialog } from "./dialogs/dialog";
import { EditorDialog } from "./dialogs/editorDialog";

export class EditorInput {
    def?: any;
    gid: string;
    status: number;
    answerShown: boolean;
    parent: JQuery<HTMLDivElement>;
    wrong_attemps: number;
    quill_el_container: JQuery<HTMLElement>;
    quill_blocker: JQuery<HTMLElement>;
    check_el: JQuery<HTMLElement>;
    mathInput: any;
    dlg_btn_el: JQuery<HTMLElement> | undefined;
    isPigen?: boolean;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, qtype: string) {
        var self = this;
        this.gid = gid;
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = cfg.STATUS.UNMODIFIED;
        this.answerShown = false;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-editorinput"></div>');
        this.quill_blocker = $('<div></div>')
        var quill_el = $('<span></span>');
        this.quill_blocker.append(quill_el);
        this.check_el = $('<div class="pw-me-check"></div>');
        this.quill_el_container.append(this.quill_blocker);
        var isBtn = (qtype === cfg.QTYPES.S);

        this.parent.append(this.quill_el_container);

        this.mathInput = shared.MQ.MathField(quill_el[0], {
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
            this.dlg_btn_el = $('<button class="btn btn-sm pw-me-btn-openeditor" title="Obrir l\'editor"><i class="fas fa-square-root-alt"></i></button>');
            this.quill_el_container.append(this.dlg_btn_el);
            this.dlg_btn_el.on("click", function (ev) {
                ev.preventDefault();
                // open a editordlg
                // must do the binding when closing
                var dlg = shared['editordlg'];
                if (!dlg) {
                    dlg = new EditorDialog();
                    shared['editordlg'] = dlg;
                }
                dlg.onAccept = function (self2: any) {
                    self.mathInput.latex(self2.latex());
                };
                dlg.setDefinition(self.def);
                dlg.show();
                dlg.latex(self.mathInput.latex());

            });
        }
        this.quill_el_container.append(this.check_el);
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

        latex(tex?: string) {
            if (tex != null) {
                console.log("Setting latex ", tex);
                this.mathInput.latex(tex);
                this.status = cfg.STATUS.UNMODIFIED;
            } else {
                return sanitizeLaTeX(this.mathInput.latex());
            }
            return ''
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

        get_qid(): number {
            return this.mathInput.id;
        }

        dispose() {
            this.mathInput.revert();
            this.quill_el_container.find("button").off();
        }

        showAnswer() {
            if (!this.def.right_answer) {
                console.log("Cannot show answer because, ", this.def.right_answer);
                return;
            }

            var self = this;
            //this.showAnswerBtn = $('<button class="btn btn pw-me-btn-showanswer" data-toggle="tooltip" title="Mostrar la solució"><i class="fas fa-question-circle"></i></button>');
            //this.quill_el_container.append(this.showAnswerBtn);

            // Must create a global dialog
            if (!shared["showAnswerDlg"]) {
                var dlg = new PwDialog("Resposta correcta", 400, 250);
                shared["showAnswerDlg"] = dlg;
                var answerHolder = $('<div class="pw-answer-holder"></div>');
                dlg.append(answerHolder);
                var closeBtn = $('<button class="btn btn-sm btn-primary" style="margin-left: 15px;">Tancar</button>');
                dlg.append(closeBtn);
                closeBtn.on('click', function (ev) {
                    ev.preventDefault();
                    dlg.close();
                });
            }
            // this.showAnswerBtn.on('click', function(ev){
            // ev.preventDefault();
            if (!self.answerShown) {
                self.answerShown = true;
                self.status = cfg.STATUS.UNMODIFIED;
                // Disable mathquill
                self.quill_blocker.addClass('pw-me-blocker');
                // Disable edit buttton
                if (self.dlg_btn_el) {
                    self.dlg_btn_el.prop("disabled", true);
                }
            }


            var dlg = shared["showAnswerDlg"] as PwDialog;
            var answerHolder = dlg.window.find(".pw-answer-holder");
            answerHolder.html(atob(self.def.right_answer) + '<p><br></p>');
            reflowLatex();
            dlg.show(); 
        }

        increment_wrong() {
            this.wrong_attemps += 1;
            if (this.wrong_attemps == cfg.MAX_ATTEMPTS + 1 && !this.isPigen && this.def) {
                console.log(this.def);

                // create a button to display answer
                var rescueBtn = $('<button class="btn btn-sm" title="Mostra la solució"><i class="far fa-question-circle"></i></button>');
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
                            if (datos.right_answer) {
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

        reflow(){
            this.mathInput.reflow();
            this.status = cfg.STATUS.UNMODIFIED;
        }

        setDefinition(def: any) {
            this.def = def;
        }
}
