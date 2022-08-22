import { shared, StaticMath } from "../../globals";
import { DictStrKeys } from "../../types";

// Create a button for toolbar tab
export function createToolbarButton(parent: JQuery<HTMLDivElement>, btn_meta:any, key: string, mathInput: any): JQuery<HTMLElement> {
        
    if(typeof(btn_meta.latex) === "function") {
        var btn = $('<div class="btn btn-sm pw-me-btn-toolbar pw-me-btn-dropdown" title="' + key.trim() + '"></div>');
        var icon = $('<span>'+btn_meta.icon+'</span>');
        StaticMath(icon[0]);
        btn.append(icon);

        var panell = $('<div class="pw-me-btn-dropdownmenu"></div>')
        parent.append(panell);
        var controls: any[] = []; 
        for(var k=0, lenk = btn_meta.vars.length; k < lenk; k++) {
            var varObj = btn_meta.vars[k]; 
            var name = varObj.name; 
            //TODO check number or text values
            var minmax = "";
            if(varObj.min!=null) {
                minmax = ' min="'+varObj.min+'" ';
            }
            if(varObj.max!=null) {
                minmax += ' max="'+varObj.max+'" ';
            }
            var control = $('<input style="width:50px;margin-left:4px;grid-column:2;" type="'+varObj.type+'" value="'+varObj.val+'"'+minmax+'/>');
            controls.push(control); 
            var alab = $('<span style="grid-column:1">'+name+'</span>');
            panell.append(alab);
            panell.append(control); 
        }
        var okButtton = $('<button class="btn btn-sm" style="padding:4px;grid-row:3;grid-column:1 / 2;background:lightgray;">Ok</button>');
        panell.append(okButtton);
        okButtton.on("click", function(evt){
            evt.preventDefault();
            //recupera mapa de valors
            var varsmap: DictStrKeys = {};
            for(var k=0, lenk=controls.length; k < lenk; k++) {
                var $c = controls[k];
                var varObj = btn_meta.vars[k]; 
                var name = varObj.name; 
                var value = $c.val();
                if(varObj.type === 'number') {
                    value = parseInt(value);
                }
                varsmap[name]= value;
            }
            var real_latex = btn_meta.latex(varsmap);
            mathInput.write(real_latex);
            if(btn_meta.moveto) {
                mathInput.keystroke(btn_meta.moveto);
            } 
            panell.css("display", "none");
            mathInput.focus();
        });


        // requires a dialog to ask for parameters in btn_meta.vars array
        btn.on('click', function(ev){
            ev.preventDefault();
            // open a dialog with inputs
            var panell_shown = panell.css("display");
            panell.css("display", panell_shown==='none'?"grid":"none");
        });
    } else {
        btn = $('<button class="btn btn-sm pw-me-btn-toolbar" title="' + key.trim() + '"></button>') as JQuery<HTMLElement>;
        var icon = $('<span>'+btn_meta.icon+'</span>');
        StaticMath(icon[0]);
        btn.append(icon);

        // simple button
        btn.on('click', function(ev){
            ev.preventDefault();
            mathInput.write(btn_meta.latex);
            mathInput.focus();
            if(btn_meta.moveto) {
                mathInput.keystroke(btn_meta.moveto);
            }
            $('.pw-me-btn-dropdownmenu').css("display", "none");
        });
    }
    return btn;
};
