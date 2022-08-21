import { cfg } from "./globals";
import { reflowLatex } from "./utils";

/**
     * Multiple options with checkboxes
     * @param {*} parent 
     * @param {*} gid 
     * @param {*} options 
     * @param {*} multipleAnswers 
*/
export class MultipleChoiceCheckbox {
    multipleAnswers: boolean;
    selectedIndex: string;
    gid: string;
    qid: number;
    options: string[];
    status: number;
    parent: JQuery<HTMLDivElement>;
    wrong_attemps: number;
    quill_el_container: JQuery<HTMLDivElement>;
    check_el: JQuery<HTMLDivElement>;
    btn_action: any;
    def?: any;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, options: string[] | string, multipleAnswers?: boolean) {
        this.multipleAnswers = multipleAnswers || false;
        if (typeof (options) == 'string') {
            options = options.split(";");
        }
        const self = this;
        this.selectedIndex = '';
        this.gid = gid;
        this.qid = Math.floor(Math.random() * 10000) + 10000;
        this.options = options || [];
        // cfg.STATUS = 0 incorrecte, cfg.STATUS = 1 correcte, cfg.STATUS < 0 errors 
        this.status = cfg.STATUS.UNMODIFIED;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-mchoice"></div>') as JQuery<HTMLDivElement>;
        this.check_el = $('<div class="pw-me-check"></div>') as JQuery<HTMLDivElement>;
        const radios_group = $('<div></div>') as JQuery<HTMLDivElement>;
        const radiosGroupId = "rgid_" + Math.random().toString(32).substring(2);
        const allRadios: JQuery<HTMLInputElement>[] = [];
        options.forEach(function (opt, i) {
            const radioId = "raid_" + Math.random().toString(32).substring(2);
            const radio_wrapper = $('<div class="form-check"></div>') as JQuery<HTMLDivElement>;
            let radio_item = null;
            if (self.multipleAnswers) {
                radio_item = $('<input class="form-check-input" type="checkbox" id="' + radioId + '" value="' + i + '"/>') as JQuery<HTMLInputElement>;
            } else {
                radio_item = $('<input class="form-check-input" type="radio" name="' + radiosGroupId + '" id="' + radioId + '" value="' + i + '"/>') as JQuery<HTMLInputElement>;
            }
            allRadios.push(radio_item);
            const radio_label = $('<label class="form-check-label" for="' + radioId + '">' + opt + '</label>') as JQuery<HTMLLabelElement>;
            radio_item.on('change', function (evt) {
                evt.preventDefault();
                //Determine which are selected
                const wsel = [];
                for (let k = 0; k < allRadios.length; k++) {
                    if (allRadios[k].prop('checked')) {
                        wsel.push(allRadios[k].prop('value') + '');
                    }
                }
                self.selectedIndex = wsel.join(',');
                if (self.status != cfg.STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = cfg.STATUS.MODIFIED;
                    self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                }
            });
            radio_wrapper.append(radio_item);
            radio_wrapper.append(radio_label);
            radios_group.append(radio_wrapper);
        });
        this.quill_el_container.append(radios_group);
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
