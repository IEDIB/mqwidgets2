import { createSubmitButtonForGroup } from "./actions";
import { createQuillFromObject } from "./createQuill";
import { cfg, shared, sharedContext } from "./globals";
import { createQuillFromDataAttr, processMqIni } from "./mq-parsing";
import { hasValue, items } from "./utils";

const findQuills = function ($eg: JQuery<HTMLElement>, gid: string) { 
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
                const json_obj = JSON.parse(json_raw)
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

    if($eg.attr("data-lang")) {
        ctx.lang = $eg.attr("data-lang")
    }
    //TODO with other properties of a group

    sharedContext[gid] = ctx;

}

export function findQuillGroups(parent?: JQuery<HTMLDivElement>) {
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
        findQuills($eg, gid);
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