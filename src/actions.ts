import { has_empty_answers } from "./checking";
import { EditorTAD } from "./components/editorTAD";
import { cfg, shared } from "./globals";
import { I18n } from "./I18n";
import { engineCAS } from "./engines/engineCAS";
import { copyPropsFromTo, isNumeric, MD5 } from "./utils";

let LAST_AJAX = new Date().getTime()

/**
 * Binds the submit button for all the editors within a group
 * @param gid
 * @param check_btn 
 * @param extraActions 
 */
export function bindSubmitActionButton(gid: string, check_btn: JQuery<HTMLButtonElement>, extraActions?: any) {
    var groupContainer = shared[gid];
    var qids: number[] = Object.keys(groupContainer).map( (e) => parseInt(e));
    check_btn.off();
    check_btn.on('click', function (ev) {
        ev.preventDefault(); 
        var now = (new Date()).getTime();
        if (LAST_AJAX && (now-LAST_AJAX) < 1000) {
            console.error("Too frequently checks are blocked!");
            return;
        } 
        console.log("gid", gid, "qids", qids);
        for (var k = 0, len = qids.length; k < len; k++) {
            var qid = qids[k];
            var editor: EditorTAD = groupContainer[qid];
            if(editor.getStatus() != cfg.STATUS.MODIFIED) {
                // no changes to check
                console.log('Unmodified, nothing to check');
                continue;
            }
            var ual = editor.latex() || [];
             
            if(ual.length === 0 || has_empty_answers(ual)) {
                // contains empty answers
                editor.checkMsg(-1, I18n('ans_missing'));
                console.error('Editor contains empty answers');
                continue;
            }
            if (editor.getStatus() != 1 && ual.length) {
                console.log(editor)
                if( editor.getDefinition().right_answer && editor.getWrong_attemps() > cfg.MAX_ATTEMPTS ) {
                    console.log("TODO:: Must show right answer and disable quill");
                    if(!editor.isPigen()) {
                        // showAnswer must disable quill on its editor
                        // Disable on panel which is not standalone
                        editor.showAnswer();
                        continue;
                    }
                }

                // If the widget is a multiplechoice combo
                // TODO: support multiple answers, ans is an array and ual too!
                if(editor.getQType() == cfg.QTYPES.M || editor.getQType() == cfg.QTYPES.Ms) {
                    var score10 = editor.isComodiUsed()? 5:10;
                    if(editor.getDefinition().ans == ual[0]) {
                        editor.checkMsg(1, 'Molt bé!');
                    } else {
                        score10 = 0;
                        editor.increment_wrong()
                        editor.checkMsg(0, 'Incorrecte'); 
                    }
                    extraActions && extraActions(score10);
                    continue;
                }
                 
                LAST_AJAX = now;
                const postObj: any = {latex: ual, qid: qid};
                // Optimitzation (numeric answers can be checked locally)
                // console.log("Locally? ", editor.getDefinition(), ual);
                let ans: string = '';
                if(editor.getDefinition().anse!=null) {
                   ans = atob(editor.getDefinition().anse || "");
                } else {
                   ans = editor.getDefinition().ans || '';
                }
                  
                if(ans && ual.length==1) {
                    //User answer list of one item
                    
                    if(isNumeric(ual[0]) && isNumeric(ans) ) {
                        const pfual = parseFloat(ual[0])
                        const pans = parseFloat(ans)
                        console.log("Numeric answer can be checked locally");
                        var score10 = editor.isComodiUsed()?5:10;
                        
                        var difference = parseFloat(ans) - pfual;
                        //TODO:: Check for precisions
                        var maxError = 0.0;
                        if(editor.getDefinition().rules && editor.getDefinition().rules.precision) {
                            maxError = editor.getDefinition().rules.precision
                        }
                        if(Math.abs(difference) <= maxError) {
                            editor.checkMsg(1, 'Molt bé!');
                        } else {
                            score10 = 0;
                            editor.increment_wrong()
                            editor.checkMsg(0, 'Incorrecte'); 
                        }
                        extraActions && extraActions(score10);
                        continue;
                    }
                }

                //copy properties from object definition
                copyPropsFromTo(editor.getDefinition(), postObj);
                if(cfg.pageInfo) { 
                    postObj.pageInfo = cfg.pageInfo;
                    if(!editor.getHash()) {
                        editor.setHash( MD5(postObj.formulation + '_' + (postObj.pageInfo.bookId || 0) + '_' + (postObj.pageInfo.chapterId || 0)) ); 
                    }
                    postObj.hash = editor.getHash();
                }
                //Decide which engine to use based on the payload
                engineCAS.compare(postObj).then((datos: any) => {
                    console.log("success", datos);
                    var editor = groupContainer[datos.qid]; 
                    if(datos.correct == 0) {
                        editor.increment_wrong();
                    }
                    editor.checkMsg(datos.correct, datos.msg); 
                    var score10 = datos.correct? (editor.isComodiUsed()? 5:10): 0;
                    extraActions && extraActions(score10);
                }, (errors: any) => {
                    console.error("Error", errors);
                })

            }
        } // end loop
 
    }); 
};

export function createSubmitButtonForGroup (gid: string) { 
    var check_btn = $(`<button class="btn btn-sm btn-primary pw-me-submitgroup"><i class="fas fa-check"></i> ${I18n('check')}</button>`) as JQuery<HTMLButtonElement>;
    bindSubmitActionButton(gid, check_btn);
    return check_btn;
};
