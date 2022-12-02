import { bindSubmitActionButton } from "./actions";
import { LevelIndicator } from "./components/LevelIndicator"
import { createQuillFromObject } from "./createQuill";
import { cfg, shared } from "./globals";
import { GoalChecker } from "./goalChecker";
import { I18n } from "./I18n";
import { processMqIni } from "./mq-parsing";
import { SeqBasic } from "./sequences/seqBasic";
import { SeqRandomWeighted } from "./sequences/seqRandomWeighted";
import { SeqSequence } from "./sequences/seqSequence";
import { reflowLatex, sum } from "./utils";

export function findPyGenerators () {
    const IB = window['IB'] || {}

    $("div[data-pygen]").each(function (j, eg) { 
        const $eg = $(eg);
        $eg.css({
            "position": "relative",
            "min-height": "300px",
            "background-color": "#ffffff",
            "background-image": 'url("https://piworld.es/iedib/matheditor/backgrounds/triangles.svg")',
            "background-position": "center",
            "background-size": "cover"
        }); 
        $eg.html(''); //clear the container  
        let gid = $eg.attr("id") || '';
        if (!gid) {
            gid = 'pyg_' + Math.random().toString(32).substring(2);
            $eg.attr("id", gid);
        } 
        shared[gid] = {};  //This container will contain the instance of the qid in every screen
        // Create the layout of this container
        // Shoud have a top banner for level and message
        // central panel for qüestion and displaying the mathinput
        // bottom panel for control buttons
        const topPanel = $('<div style="display:flex;flex-direction:row-reverse;align-items:baseline;" class="d-print-none"></div>') as JQuery<HTMLDivElement>;
        const centralPanel = $("<div></div>") as JQuery<HTMLDivElement>;
        const bottomPanel = $('<div style="display: flex; flex-direction: row; align-content: flex-start;margin:10px 0; flex-wrap: wrap; gap: 5px;margin-bottom:30px;"></div>') as JQuery<HTMLDivElement>; 
        const copyrightPanel = $('<div style="position: absolute;left: 0;right: 0;bottom: 0;margin: 0;background-color: #9fa0ac; display: flex; flex-direction: row; align-content: flex-start; flex-wrap: wrap; gap: 5px;"></div>') as JQuery<HTMLDivElement>;
        const levelIndicator = new LevelIndicator(4);
       
        const category = $eg.attr("data-pygen-category") || "general";  //category to check the level of the student
        
        //Only show the indicator if data-category is set
        levelIndicator.setVisible(cfg.HAS_IAPACE && $eg.attr("data-pygen-category")!=null);
        topPanel.append(levelIndicator.container);
         
        //try to find the category in iapace (only if available)
        let currentLevel = 1;
        if(cfg.HAS_IAPACE) {
            currentLevel = IB.iapace.inference(category);    
        }
        levelIndicator.setLevel(currentLevel);

        //Goal checker
        let goalChecker: GoalChecker | null = null;
        if(cfg.HAS_IAPACE && $eg.attr("data-pygen-goal")!=null) {
            const goalRulesRaw = ($eg.attr("data-pygen-goal") || '').split(";");
            const goalRules = goalRulesRaw.map(function(e){return e.split(",");});
            goalChecker = new GoalChecker(category, goalRules);
            if(goalChecker.accomplished()){
                //Indicator that the goal is already reached
                topPanel.append($('<span class="pw-goal-reached">'+I18n('goal_reached')+' </span>'));
            }
        }
 
        // Format "name.of.generador.function1;name.of.generator.function2[param1=a, param2='b', param3='c'];···"
        const rawDataPygens = ($eg.attr('data-pygen') || '').split(';');
        const dataPygen = [];
        for(let z=0, lenz=rawDataPygens.length; z < lenz; z++) {
            const genpart = rawDataPygens[z];
            let genname: any = null;
            const genparams: {[name:string]:any} = {};
            if(genpart.indexOf('[') > 0) {
                genname = genpart.split('[')[0].trim();
                const paramspart = genpart.split('[')[1].replace(']', '').split(',');
                for(let t=0, lent=paramspart.length; t<lent; t++) {
                    const aparm = paramspart[t];
                    if(aparm.indexOf("=")>0){
                        const param_parts = aparm.split("=");
                        const key = param_parts[0];
                        let value: any = param_parts[1];
                        if(value.indexOf("'")>=0) {
                            // As string
                            value = value.replace(/'/g,'');
                        } else {
                            // As float
                            value = parseFloat(value);
                        }
                        genparams[key] = value;
                    }
                }
            } else {
                genname = genpart.trim();
            }
            if(Object.keys(genparams).length) {
                dataPygen.push([genname, genparams]);
            } else {
                dataPygen.push([genname]);
            }
        } 

        // Decide if to use a sequenciador?
        let sequenciador: SeqBasic = new SeqBasic(dataPygen);
        if(dataPygen.length > 1) {
            // Yes
            const order = ($eg.attr("data-pygen-order") || "random").trim().toLowerCase();
            if(order.startsWith("random") || order.startsWith("weighted")) {
                sequenciador = new SeqRandomWeighted(dataPygen, order);
            } else if(order.startsWith("sequence")) {
                sequenciador = new SeqSequence(dataPygen, order);
            } 
        }  

        // Check this question
        
        const checkBtn = $('<button class="btn btn-sm btn-primary"><i class="fa fas fa-check"></i> '+I18n('check')+'</button>') as JQuery<HTMLButtonElement>;
        const comodiBtn = $('<button class="btn btn-sm btn-warning" style="display:none;"><i class="fa far fa-life-ring"></i> '+I18n('wildcard')+' 50%</button>') as JQuery<HTMLButtonElement>;
       
        let currentDatos: any = null;
        let currentEditor: any = null;

        const createDynamicMathquill = function() {
            checkBtn.prop("disabled", true);
            nextButton.prop("disabled", true);
            showmeBtn.prop("disabled", true);
            comodiBtn.css("display", "none");
            // Dynamically generate the level here!
            if(cfg.HAS_IAPACE) {
                currentLevel = IB.iapace.inference(category);    
            } else {
                //TODO
            }
            console.log("xivat", category, currentLevel);
            levelIndicator.setLevel(currentLevel);
            const nextGenerator = sequenciador.next();
            $.ajax({
                type: "POST",
                url: cfg.PYGEN_URL,
                data: JSON.stringify({"activities": [nextGenerator], "level": currentLevel}),
                dataType: 'json',
                success: function (datos) { 
                    console.log("xivato", datos);
                    if(datos.msg) {
                        currentDatos = null;
                        //Show error message
                        centralPanel.html('<p style="color:darkred">ERROR<br>'+JSON.stringify(datos.msg)+'</p>');
                        console.error("ERROR: ", datos); 
                        nextButton.prop("disabled", false);
                        return;
                    }

                    
                    //remove contents central panel
                    centralPanel.html('');
                    // TODO: create the dynamic element
                    const pregunta = $('<p><span>'+( $eg.attr('data-pygen-formulation') || '')+'</span> '+ datos.formulation+'</p>') as JQuery<HTMLParagraphElement>;
                    centralPanel.append(pregunta);
                    //TODO: How to create the input widget eficienty 
                    //const dynEl = $('<span data-mq="'+ datos.mq64 +'"></span>');
                    //$eg.append(dynEl);
                    const json_raw = atob(datos.mq64);
                    const json_obj = JSON.parse(json_raw);
                    //check if contains a comodi 
                    //TODO: decide if can use the comodi based on performance
                    if(cfg.HAS_IAPACE) {
                        const frame = IB.iapace.findCreate(category);
                        if(frame) {
                            if(sum(frame.h)>=30) {
                                console.log("Super! Has conseguit un comodí");
                                comodiBtn.css("display", json_obj.comodi == null?"none":"");
                            }
                        }
                    } 
                    json_obj.category = category;
                    if(!json_obj.palettes) {
                        //use all palettes if not defined
                        json_obj.palettes = 'all';
                    }
                    // convert qtype.M (combo) to qtype.Ms (radios)
                    if(json_obj.editor == cfg.QTYPES.M) {
                        json_obj.editor = cfg.QTYPES.Ms;
                    }
                    currentDatos = json_obj;
                    if(json_obj.initial_latex) {
                        json_obj.initial_latex = processMqIni(json_obj.initial_latex);
                    }

                    const symbols = []
                    if(json_obj.symbols) { 
                        const parts = json_obj.symbols.split(";");
                        for(let r=0, lenr=parts.length; r<lenr; r++) {
                            const epart = parts[r];
                            if(epart.trim()) {
                                symbols.push(epart.trim());
                            }
                        } 
                    } 
                    json_obj.symbols = symbols;
                    let rules = [];
                    if(json_obj.rules) {
                        rules = JSON.parse(json_obj.rules);
                    }
                    json_obj.rules = rules;
                    // It should obtain category from here?
                    console.log(json_obj);
                    
                    const qid = createQuillFromObject(centralPanel, gid, json_obj); 
                    currentEditor = shared[gid][qid];
                    currentEditor.isPigen = true;  //Marker that is dynamically generated for pigen
                    //TODO can support many quills
                    checkBtn.off();
                    const extraActions = function(score10: number) {
                        nextButton.prop("disabled", false);
                        showmeBtn.prop("disabled", false);
                        if(cfg.HAS_IAPACE) {
                            IB.iapace.addScore(category, score10);
                            IB.iapace.save(); //Persistent storage
                        }
                        //TODO lunch confetti if succeded
                        if(goalChecker && goalChecker.reached()) {
                            if(topPanel.find(".pw-goal-reached").length==0) {
                                topPanel.append($('<span class="pw-goal-reached">'+I18n('goal_reached')+' </span>'));
                            }
                            //celebration?
                            if($eg.attr("data-pygen-celebration")=='confetti' && window.Confetti) {
                                const c = new window.Confetti($eg[0]);
                                c.play();
                            }
                        }
                    };
                    bindSubmitActionButton(gid, checkBtn, extraActions);
                    console.log(shared[gid]);
                    reflowLatex();
                    checkBtn.prop("disabled", false);
                    // Create the same element as a group
                    //$eg.addClass("pw-mq-group");
                    //findQuillGroups($eg.parent());
                },
                error: function (datos) {
                    currentDatos = null;
                    currentEditor = null;
                    console.log("error", datos);
                    centralPanel.html('<div><p style="color:darkred">ERROR<br>'+JSON.stringify(datos)+'</p></div>');
                    nextButton.prop("disabled", false);
                }
            });
        };

         // Reveal answer to this question
         const showmeBtn = $('<button class="btn btn-sm btn-outline-info" title="Mostra la resposta"><i class="fa fas fa-question-circle"></i> '+I18n('answer')+'</button>') as JQuery<HTMLButtonElement>;
         showmeBtn.on('click', function(ev){
             ev.preventDefault();
             if( !currentEditor ) {
                console.error("Missing currentEditor here :-(");
                return;
             }
             if(currentEditor.status!=cfg.STATUS.CORRECT && currentEditor.wrong_attemps < 1) {
                 console.log("can't show answer yet", currentEditor);
                 return;
             } 
             checkBtn.prop("disabled", true);
             showmeBtn.prop("disabled", true);
             console.log(currentEditor)
             currentEditor.showAnswer && currentEditor.showAnswer(); 
         });

        // Skip this question
        const nextButton = $('<button class="btn btn-sm btn-outline-primary" title="Genera una nova pregunta"><i class="fa fas fa-arrow-circle-right"></i> '+ I18n('next')+'</button>');
        nextButton.on('click', function(ev){
            ev.preventDefault();  
            // Remove existing widgets from this gid
            const keys = Object.keys(shared[gid] || {});
            for(let i=0, lin=keys.length; i<lin; i++) {
                const qid = parseInt(keys[i])
                shared[gid][qid].dispose();
                delete shared[gid][qid];
            }
            createDynamicMathquill();
        });


        comodiBtn.on('click', function(ev){
            ev.preventDefault(); 
            if(!currentEditor || !currentDatos || !currentDatos.comodi) {
                return;
            } 
            currentEditor.comodiUsed = true;
            comodiBtn.css("display", "none");
            currentEditor.latex(currentDatos.comodi);
            // Mark editor as changed to enable evaluation
            currentEditor.status = cfg.STATUS.MODIFIED;
        });

        bottomPanel.append(checkBtn); 
        bottomPanel.append(nextButton); 
        bottomPanel.append(showmeBtn); 
        bottomPanel.append(comodiBtn); 

        $eg.append(topPanel);
        $eg.append(centralPanel);
        $eg.append(bottomPanel);
        
        if($eg.attr("data-copyright")!="none") {
            // Mostra la barra de copyright
            const ccSpan = $('<span style="padding:4px;font-size:70%;color:whitesmoke;"><em>pyQuizz</em> by Josep Mulet (c) 2021-22</span>')
            copyrightPanel.append(ccSpan);
            $eg.append(copyrightPanel);
        } 

        createDynamicMathquill();
    });
};
