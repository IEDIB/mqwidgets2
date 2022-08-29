import { createSubmitButtonForGroup } from "./actions";
import { createQuillFromObject } from "./createQuill";
import { cfg, shared, sharedContext } from "./globals";
import { createQuillFromDataAttr, processMqIni } from "./mq-parsing"; 
import { hasValue, items, zip } from "./utils";
const keysDef = ["editor",
                "engine",
                "formulation",
                "initial_latex",
                "ansType",
                "ans",
                "anse",
                "right_answer",
                "symbols",
                "rules",
                "palettes"];

const findQuills = function ($eg: JQuery<HTMLElement>, gid: string, widgets?: {[name:string]: string}) { 
    // Precedence of the widgets defined throught the init method
    if(widgets) {
        items(widgets, function(id: string, b64: string) {
            //check if 'id' is found
            const $el = $('#'+id) as JQuery<HTMLDivElement>;
            if($el.length) {
                // ignore the mq attribute that might include in sucsessive parsing
                $el.removeAttr("data-mq");
                try {
                    const json_raw = atob(b64);
                    const json_obj = JSON.parse(json_raw);
                    //Make sure to process initial_latex attribute
                    json_obj.initial_latex = processMqIni(json_obj.initial_latex || '');
                    createQuillFromObject($el, gid, json_obj);
                } catch(ex) {
                    console.error("Invalid or corrupted MQ definition:: ", b64);
                    console.error(ex);
                }
            } else {
                console.error("The element with id="+ id+ " does not exist.");
            }
        })
    }
    
    $eg.find("[data-mq]").each(function (i, el) {
        const $el = $(el) as JQuery<HTMLDivElement>;
        const qtype = $(el).attr("data-mq") || 'simple';  //s=simple, b=basic, p=panel, c=cloze (requires data-mq-ini)
        if(hasValue(cfg.QTYPES, qtype)) {
            //create from data-attributes
            console.error("Definition via data-attributes in deprecated since version 2.0. "
            + "Please encode the definition in a single data-mq field.")
            createQuillFromDataAttr($el, gid);
        } else {
            // Assume that everything is encoded in data-mq atribute
            // Use the MQ-editor online
            try {
                const json_raw = atob(qtype);
                let json_obj: any = {};
                const parsedDef = JSON.parse(json_raw)
                // if json_obj is an array, then we should parse it to an object
                if(Array.isArray(parsedDef)) {
                    if(parsedDef.length < keysDef.length) {
                        console.error("The definition does not contain all the fields. Is it corrupted?")
                    }
                   zip(keysDef, parsedDef).forEach( (pair) => {
                        const [key, value] = pair
                        json_obj[key] = value
                   })
                } else {
                    json_obj = parsedDef
                }
                //Make sure to process initial_latex attribute
                json_obj.initial_latex = processMqIni(json_obj.initial_latex || '')
                createQuillFromObject($el, gid, json_obj);
            } catch(ex) {
                console.error("Invalid or corrupted MQ definition:: ", qtype)
                console.error(ex)
            }
        }
    });
};

function parseContext($eg: JQuery<HTMLElement>, gid: string): void {

    const ctx: any = {};  // Hold the context of this group
    
    //TODO with other properties of a group

    sharedContext[gid] = ctx;

}

export function findQuillGroups(widgets?: {[name: string]: string}, parent?: JQuery<HTMLDivElement>) {
    parent = parent || $('body');
    parent.find(".pw-mq-group").each(function (j, eg) {
        const $eg = $(eg);
        if($eg.hasClass("pw-mq-done")) {
            return;
        }
        //Prevent reprocessing
        $eg.addClass("pw-mq-done");
        let gid = $eg.attr("id");
        if (!gid) {
            gid = 'g_' + Math.random().toString(32).substring(2);
            $eg.attr("id", gid);
        } 
        shared[gid] = {};  //Hold all the editors
        parseContext($eg, gid); 
        findQuills($eg, gid, widgets);
        const check_btn = createSubmitButtonForGroup(gid);
        $eg.append(check_btn);

        // solve problem of display by redrawing
        if(parent == null) {
            window.setTimeout(function(){
                items(shared, function(gid: string, groupContainer: any){
                    items(groupContainer, function(qid: string, editor: any){
                        editor.reflow && editor.reflow();
                    });
                });
            }, 800);
        }
    });
};