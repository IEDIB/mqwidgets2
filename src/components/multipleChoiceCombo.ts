import { cfg } from "../globals";
import { reflowLatex } from "../utils";

export class MultipleChoiceCombo {
    selectedIndex: string;
    gid: string;
    qid: number;
    options: any;
    status: number;
    parent: JQuery<HTMLDivElement>;
    wrong_attemps: number;
    quill_el_container: JQuery<HTMLDivElement>;
    check_el: JQuery<HTMLDivElement>;
    btn_action: JQuery<HTMLButtonElement>;
    def?: any;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, options: string[] | string) {
        if (typeof (options) == 'string') {
            options = options.split(";");
        }
        const self = this;
        this.selectedIndex = '';
        this.gid = gid;
        this.qid = Math.floor(Math.random() * 10000) + 10000;
        this.options = options || [];
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = cfg.STATUS.UNMODIFIED;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-mchoice"></div>') as JQuery<HTMLDivElement>
        this.check_el = $('<div class="pw-me-check"></div>') as JQuery<HTMLDivElement>
        const btn_group = $('<div class="btn-group"></div>') as JQuery<HTMLDivElement>
        this.btn_action = $('<button type="button" style="background:white;" class="btn btn-outline-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Tria una opció</button>') as JQuery<HTMLButtonElement>
        const dropdown_menu = $('<div class="dropdown-menu"></div>');
        btn_group.append(this.btn_action);
        

        options.forEach((opt: string, i: number) => {
            const dropdown_item = $('<a class="dropdown-item" href="#">' + opt + '</a>') as JQuery<HTMLAnchorElement>;
            dropdown_item.on('click', function (evt) {
                evt.preventDefault();
                self.selectedIndex = i + '';
                self.btn_action.html(dropdown_item.html());
                if (self.status != cfg.STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = cfg.STATUS.MODIFIED;
                    self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                }
            });
            dropdown_menu.append(dropdown_item);
        });

        btn_group.append(dropdown_menu);
        this.quill_el_container.append(btn_group);
        this.quill_el_container.append(this.check_el);
        this.parent.append(this.quill_el_container);
        reflowLatex();
    };


    clear() {
        this.selectedIndex = '';
        this.btn_action.html('');
        this.check_el.html('');
        this.status = cfg.STATUS.UNMODIFIED;
        this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
    }

    focus() {
        this.btn_action.focus();
    }

    latex(tex: string) {
        return this.selectedIndex;
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

    get_qid() {
        return this.qid;
    }

    dispose() {
        this.quill_el_container.off();
    }

    reflow() {
        this.status = cfg.STATUS.UNMODIFIED;
    }

    setDefinition(def: any) {
        this.def = def;
    }

    increment_wrong() {
        this.wrong_attemps += 1;
    }
}
