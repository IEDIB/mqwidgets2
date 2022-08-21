import { has_empty_answers } from "./checking";
import { cfg, shared } from "./globals";
import { copyPropsFromTo, MD5 } from "./utils";

let LAST_AJAX = new Date().getTime()

export function bindSubmitActionButton(gid: number, check_btn: JQuery<HTMLButtonElement>, extraActions?: any) {
    var groupContainer = shared[gid];
    var qids = Object.keys(groupContainer);
    check_btn.off();
    check_btn.on('click', function (ev) {
        ev.preventDefault(); 
        var now = (new Date()).getTime();
        if (LAST_AJAX && (now-LAST_AJAX) < 1000) {
            console.error("Too frequently checks are blocked!");
            return;
        }
        var promises = [];
        console.log("gid", gid, "qids", qids);
        for (var k = 0, len = qids.length; k < len; k++) {
            var qid = qids[k];
            var editor = groupContainer[qid];
            if(editor.status != cfg.STATUS.MODIFIED) {
                // no changes to check
                console.log('Unmodified, nothing to check');
                continue;
            }
            var ual = editor.latex() || [];
            if(typeof(ual)==='string') {
                ual = [ual]; 
            }
            if(ual.length === 0 || has_empty_answers(ual)) {
                // contains empty answers
                editor.checkMsg(-1, 'Falten respostes');
                console.log('contains empty answers');
                continue;
            }
            if (editor.status != 1 && ual) {

                if( editor.def.right_answer && (editor.wrong_attemps || 0) > cfg.MAX_ATTEMPTS ) {
                    console.log("TODO:: Must show right answer and disable quill");
                    if(editor.showAnswer && !editor.isPigen) {
                        // showAnswer must disable quill on its editor
                        // Disable on panel which is not standalone
                        editor.showAnswer();
                        continue;
                    }
                }

                // If the widget is a multiplechoice combo
                // TODO: support multiple answers, ans is an array and ual too!
                if(editor.qtype == cfg.QTYPES.M || editor.type == cfg.QTYPES.Ms) {
                    var score10 = editor.comodiUsed?5:10;
                    if(editor.def.ans == ual) {
                        editor.checkMsg(1, 'Molt bé!');
                    } else {
                        score10 = 0;
                        editor.wrong_attemps += 1;
                        editor.checkMsg(0, 'Incorrecte'); 
                    }
                    extraActions && extraActions(score10);
                    continue;
                }
                
                console.log("Posting", editor);
                LAST_AJAX = now;
                var postObj: any = {latex: ual, qid: qid};
                // Optimitzation (numeric answers can be checked locally)
                console.log("Locally? ", editor.def, ual);
                var ans = null;
                if(editor.def.anse) {
                   ans = atob(editor.def.anse);
                } else {
                    ans = editor.def.ans;
                }
                 
                if(ans!=null && !isNaN(ans) && !isNaN(ual)) {
                    var score10 = editor.comodiUsed?5:10;
                    console.log("Numeric answer can be checked locally");
                    var difference = parseFloat(ans) - parseFloat(ual);
                    //TODO:: Check for precisions
                    var maxError = 0.0;
                    if(editor.def.rules && editor.def.rules.precission) {
                        maxError = editor.def.rules.precission;
                    }
                    if(Math.abs(difference) <= maxError) {
                        editor.checkMsg(1, 'Molt bé!');
                    } else {
                        score10 = 0;
                        editor.wrong_attemps += 1;
                        editor.checkMsg(0, 'Incorrecte'); 
                    }
                    extraActions && extraActions(score10);
                    continue;
                }

                //copy properties from object definition
                copyPropsFromTo(editor.def, postObj);
                if(cfg.pageInfo) { 
                    postObj.pageInfo = cfg.pageInfo;
                    if(!editor.hash) {
                        editor.hash = MD5(postObj.formulation + '_' + (postObj.pageInfo.bookId || 0) + '_' + (postObj.pageInfo.chapterId || 0)); 
                    }
                    postObj.hash = editor.hash;
                }
                promises.push($.ajax({
                    type: "POST",
                    url: cfg.CAS_URL,
                    data: JSON.stringify(postObj),
                    dataType: 'json',
                    success: function (datos) { 
                        console.log("success", datos);
                        var editor = groupContainer[datos.qid]; 
                        if(datos.correct == 0) {
                            editor.increment_wrong && editor.increment_wrong();
                        }
                        editor.checkMsg(datos.correct, datos.msg); 
                        var score10 = datos.correct? (editor.comodiUsed? 5:10): 0;
                        extraActions && extraActions(score10);
                    },
                    error: function (datos) {
                        console.log("error", datos);
                    }
                }));
            }
        } // end loop

        //TODO: do something with promises.

    }); 
};

export function createSubmitButtonForGroup (gid: number) {
    var check_btn = $('<button class="btn btn-sm btn-primary pw-me-submitgroup"><i class="fas fa-check"></i> Comprova</button>') as JQuery<HTMLButtonElement>;
    bindSubmitActionButton(gid, check_btn);
    return check_btn;
};
