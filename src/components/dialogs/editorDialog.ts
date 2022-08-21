// Editor panel (embeded in dialog)
// Extends Dialog

import { sanitizeLaTeX } from "../../utils";
import { EditorPanel } from "../editorPanel";
import { PwDialog } from "./dialog";

// Composes EditorPanel
export class EditorDialog extends PwDialog {
    editorPanel: EditorPanel;
    acceptFn?: Function;
    cancelFn?: Function;

    constructor() {
        super('<i style="color:darkred;" class="fas fa-square-root-alt"></i> Editor matemàtic', 500, 320);
        const self = this;
        this.editorPanel = new EditorPanel(this.window, '0');   
        var controlButtons = $('<div class="pw-me-dlg-controls"></div>') as JQuery<HTMLDivElement>
        var acceptBtn = $('<button class="btn btn-sm btn-primary">Accepta</button>') as JQuery<HTMLButtonElement>
        var cancelBtn = $('<button class="btn btn-sm btn-outline-primary">Cancel·la</button>') as JQuery<HTMLButtonElement>
        controlButtons.append(acceptBtn);
        controlButtons.append(cancelBtn);
        this.append(controlButtons);
        
        acceptBtn.on('click', function(ev){
            ev.preventDefault();
            if(self.acceptFn) {
                self.acceptFn(self);
            }
            self.close();
        });
        cancelBtn.on('click', function(ev){
            ev.preventDefault();
            if(self.cancelFn) {
                self.cancelFn(self);
            }
            self.close();
        });
    }

    latex(tex: string): string {
        if(tex !=null) {
            this.editorPanel.latex(tex);
            return ''
        } else {
            return sanitizeLaTeX(this.editorPanel.latex());
        }
    }
    //@override
    show() {
        this.window.css("display", "");
        this.editorPanel.focus();
    }
 
    //@override
    dispose() {
        this.editorPanel.dispose();
        this.window.find('button').off();
        this.dispose();
    }

    reflow() {
        this.editorPanel.reflow();
    }

    setDefinition(def: any) {
        this.editorPanel.setDefinition(def);
    }
}
 