import { I18n } from "../I18n";
import { DictStrKeys, EngineCAS } from "../types";
import { items, zip } from "../utils";
import { parseLatex } from "./parseLatex"


function is_set(expr: any): boolean {
    if(Array.isArray(expr?.symbols?.elements)) {
        const mat = expr.symbols.elements
        const firstElem = mat[0]
        if(!Array.isArray(firstElem)) {
            return true
        }
    }
    return false
}
function is_interval(expr: any): boolean {
    // Intervals not implemented in Nerdamer
    return false
}
function is_matrix(expr: any): null | number[] {
    const txt = expr.text() 
    if(txt.startsWith('matrix')) {
        return window.nerdamer('size('+txt+')')
    }
    return null
}
function is_zero_matrix(expr: any): boolean {
    let isZero = true
    expr.each( (e: any)=> {isZero = isZero && (e.text()=='0')})
    return isZero
}

class NerdamerCAS implements EngineCAS {

    private static clone(obj: any): any {
        return JSON.parse(JSON.stringify(obj))
    }

    private static decrypt(str: string): string {
        return atob(str)
    }

    private static checkRules(p: any): string[] {
        //Before parsing and evaluation, do checks directly based on latex answers
        const rules_checks: string[] = []
        let rules = p.rules ||  {}
        if (typeof rules === 'string') {
            console.log("Converting rules to json")
            rules = JSON.parse(rules)
        }
        const latex_code = p.latex.join(' ')
    
        // comma as tuple
        if(rules['comma_as_decimal']) {
            console.log('Consider comma as decimal')
            // by default, consider comma as decimal separator
            p['latex'] = p['latex'].map( (e: string) => e.replace(',','.') )
        }
        // do not allow sympy keywords in latex code
        // TODO

        if (rules['forbidden']) {
            // symbols or expressions that are forbidden
           rules["forbidden"].forEach( (fo_symb:string) => {
                if(latex_code[fo_symb]) {
                    rules_checks.push(I18n('sym_notallowed', fo_symb))
                }
           })
        }
        if (rules["unique"]) {
            // Symbols that can only appear once
            rules["unique"].forEach( (un_sym:string) => {
                if((latex_code.match(new RegExp(un_sym, 'g')) || []).length > 1) {
                    rules_checks.push(I18n('sym_once', un_sym))
                }
            })
        }

        return rules_checks                    
    }

    compare(p: any): Promise<any> {
        const cas = window.nerdamer
        console.log("The payload: ", p)
        p = NerdamerCAS.clone(p)
        if (typeof (p['latex']) === 'string') {
            p['latex'] = [p['latex']]   
        }
        return new Promise<any>((resolve, reject) => {
            //Remove all stores expressions
            cas.flush();
            cas.clearVars();
            const core = window.nerdamer.getCore();
            const Symbol = core.Symbol;
            const scope: DictStrKeys = {'x': cas('x'), 'y': cas('y'), 'z': cas('z'), 't': cas('t'), 'e': cas('exp(1)')}  
            const rules_checks = NerdamerCAS.checkRules(p)
            if(rules_checks.length) {
                resolve({"qid": p.qid, "msg": rules_checks.join(' '), "correct": 0})
                return;
            }
            // Parses user input latex --> nerdamer
            let user_sympy = []
            try {
                user_sympy = p['latex'].map( (e: string) => parseLatex(e))
                if(user_sympy.filter((x: any) => x==null).length > 0) {
                    return resolve({"qid": p['qid'], "correct": -4, "msg": I18n('error_cantprocess')})
                }
            } catch(ex) {
                console.error(ex)
                return resolve({"qid": p['qid'], "correct": -4, "msg": "Error: No es poden processar les respostes donades: " + ex})
            }
            // Adds user answer to scope for checking evaluation and user defined symbols
            user_sympy.forEach( (v: any, i: number) => {
                cas.setVar('ua_'+i, v)
            })

            //Prepares local scope for evaluation
            try {
                (p['symbols'] || []).forEach( (symb: string) => {
                    if (symb.indexOf(':=') > 0) {
                        const pos = symb.indexOf(":=")
                        const symb_name = symb.substring(0, pos)
                        const symb_raw = symb.substring(pos+2)
                        cas.setVar(symb_name, symb_raw)  
                    } else {
                        cas.setVar(symb, symb)  
                    }
                })
            } catch(ex) {
                console.error(ex)
                resolve({"qid": p["qid"], "correct": -2, "msg": "Error: no es poden processar els símbols: " + ex})
                return
            }

            console.log("The scope:: ") 
            items(scope, function(k:string, v:any){
                console.log(k+": ", v.text())
            })

            let ans_sympy = []
            try {
                //print('decrypting.....')
                if (p['anse']) {
                    p['ans'] = NerdamerCAS.decrypt(p['anse'])
                }
                console.log('ans decrypted ', p['anse'], p['ans'])
                if (typeof p['ans'] === 'string') {
                    p['ans'] = [p['ans']] 
                }
        
                ans_sympy = p['ans'].map( (e: string) => cas(e, scope) )
                if ( ans_sympy.filter( (e: any) => e==null).length > 0) {
                    resolve({"qid": p['qid'], "correct": -3, "msg": "Error: Hi ha respostes 'ans' que no es poden processar"})
                    return
                }
            } catch(ex) {
                console.error(ex) 
                resolve({"qid": p['qid'], "correct": -3, "msg": "Error: No es poden processar les respostes 'ans': " + ex})
                return
            }

            //TODO case of logical check condition as answer
            
            // Before performing math difference to check equality, check types
            try{ 
                const msgs: string[] = []
               
                zip(ans_sympy, user_sympy).forEach( (pair: any[]) => { 
                    const [ans_obj, parsed_input] = pair
                    if(is_set(ans_obj) && !is_set(parsed_input)) {
                        msgs.push("S'espera un conjunt per resposta. Per exemple \\(\\{\\sqrt{2},\\, \\pi\\}\\)")
                    } else if(is_matrix(ans_obj) && !is_matrix(parsed_input)) {
                        msgs.push("S'espera una matriu per resposta.")
                    } else if(is_interval(ans_obj) && !is_interval(parsed_input)) {
                        msgs.push("S'espera un interval per resposta.")
                    } else if(!is_matrix(ans_obj) && is_matrix(parsed_input)) {
                        msgs.push("S'espera una expressió per resposta.")
                    } 
                    const dims1 = is_matrix(ans_obj)
                    const dims2 = is_matrix(parsed_input)
                    if(dims1 && dims2) {
                        // check if both have the same dimensions
                        if ((dims1[0] != dims2[0]) || (dims1[1] != dims2[1]) ) {
                            msgs.push("La matriu resposta no té la dimensió correcta.")
                        }
                    }
                })
        
                if (msgs.length > 0) {
                    resolve({"qid": p['qid'], "correct": 0, "msg": msgs.join(' ')})
                    return
                }
        
            } catch(ex) {
                console.error(ex)
                resolve({"qid": p['qid'], "correct": -4, "msg": "Error: S'ha produït un error comprovant els tipus " + ex})
                return
            }        


            // Check for mathematical equivalence
            // This produces an errorr because rules passes as a list not a dict!!!!
            //check_method = rules.get("method", "meqv")  #support other methods numeric[0.01]
        
           

            // TODO as_vector is not supported here
            // Treat every element in array of answers indepently 
            let correct = 0
            let msg = ''
            try {
               
                zip(ans_sympy, user_sympy).forEach( (pair: any[]) => {
                    const [ans_obj, parsed_input] = pair
                    console.log('Compare:: ', ans_obj.text(), parsed_input.text())
                    // Cannot compare list and FineSet so, convert list to FiniteSet
                    // console.log(ans_obj, parsed_input, type(ans_obj), type(parsed_input))
                    
                    //print('starting to compare', ans_obj, parsed_input)
                    let expr = null
                    const rules = p["rules"] || {}
                   
                    // decide if precision is set
                    if(rules['precision']) {
                        // Numerical equivalence within precision
                        expr = Math.abs(ans_obj.toDecimal()-parsed_input.toDecimal()) < rules['precision']
                        console.log('epsilon', expr)
                    } else{
                        if(is_matrix(ans_obj)) {
                            const delta = ans_obj.subtract(parsed_input)
                            console.log('debug ', ans_obj.text(), parsed_input.text(), delta.text())
                            expr = is_zero_matrix(delta)
                        } else if(rules['factor'] || rules['expanded']) {
                            //This condition takes into account if expanded or not
                            expr = ans_obj.eq(parsed_input)   
                        } else {
                            //expr = ans_obj.eq(parsed_input)    
                            //Check for subtraction eq 0?
                            expr = ans_obj.subtract(parsed_input).simplify()
                            expr = expr.text()=='0'
                        }
                        console.log('remainder', expr)
                    }
                        
        
        
                    if( typeof expr === 'boolean' && expr===true) {
                        // Sabem que és matemàticament equivalent
                        correct = 1
                        msg = I18n('right_answer')
                        /*
                        if ('factor' in rules) and (rules['factor']==True) and (not (isinstance(parsed_input, Mul) or isinstance(parsed_input, Pow)) ):
                            correct = 0
                            msg = "La resposta ha estar factoritzada."
                        elif ('factor' in rules) and (rules['factor']==False) and (not isinstance(parsed_input, Add)):
                            correct = 0 
                            msg = "La resposta ha d'estar desenvolupada."
                        */
                    } else { 
                        msg = I18n('wrong_answer')
                        correct = 0
                        /*
                        if is_matrix(expr):
                            msg = find_not_zero_element(expr)
                        */
                    }
                    if (correct == 0) {
                        return true
                    }
                    // Once equality is checked, then treat the number of terms and factors as second check
                    // Apply only for expressions of polynomial type
                    if(rules["num_terms"] && parsed_input.isPolynomial()) {
                        const unt = parsed_input.symbols.coeffs().length
                        const nexpect = ans_obj.symbols.expand().coeffs().length
                        const nterms_diff = nexpect - unt
                        if(rules["num_terms"] == "equal" && nterms_diff != 0) {
                            msg = "La resposta hauria de tenir " + nexpect + " termes sumats o restats."
                            correct = 0
                        }
                    }
                    /* 
                        elif type(ans_obj) == Mul or type(ans_obj) == Pow:
                            #Si només té un terme, comprova si està ben factoritzat
                            # TODO: Allow arbitrary number of numeric factors. Filter only those with symbols
                            tmp1 = list(filter(lambda e: is_symbolic(e), ans_obj.as_ordered_factors()))
                            tmp2 = list(filter(lambda e: is_symbolic(e), parsed_input.as_ordered_factors()))
                            nexpect =  len(tmp1)
                            nterms_diff = nexpect - len(tmp2)
                            if nterms_diff != 0:
                                print(str(tmp1), str([type(e) for e in tmp1]))
                                print(str(tmp2), str([type(e) for e in tmp2]))
                                msg = "La resposta hauria de contenir "+str(nexpect)+" factors simbòlics."
                                correct = 0
        
                        if correct == 0:
                            break
                */
                
                }) //end zip foreach
        
            } catch(err) {
                console.error("Exception comparing ", err)
                msg = I18n('error_verifying')
                correct = -1 
            }
        
            console.log("Response:: ", correct, msg)
            resolve({"qid": p['qid'], "correct": correct, "msg": msg})
        
        })
    }
    
    getAnswer(p: any): Promise<any> {
        const cas = window.nerdamer
        p = NerdamerCAS.clone(p)
        return new Promise<any>((resolve, reject) => { 
          
        // Prepares local scope for evaluation
        const scope: DictStrKeys = {'x': cas('x'), 'y': cas('y'), 'z': cas('z'), 't': cas('t'), 'e': cas('exp(1)')}  
        //Prepares local scope for evaluation
        try {
            (p['symbols'] || []).forEach( (symb: string) => {
                if (symb.indexOf(':=') > 0) {
                    const pos = symb.indexOf(":=")
                    const symb_name = symb.substring(0, pos)
                    const symb_raw = symb.substring(pos+2)
                    cas.setVar(symb_name, symb_raw)  
                } else {
                    cas.setVar(symb, symb)  
                }
            })
        } catch(ex) {
            console.error(ex)
            resolve({"msg": "Error: no es poden processar els símbols: " + ex})
            return
        }

        //TODO assume ans is str
        if(typeof p['ans'] === 'string') {
            const ans_sympy = cas(p['ans'], scope)
            const ra = `${I18n('expected_ans')}<br> \\(${ans_sympy.latex()}\\)`
            resolve({"right_answer": btoa(ra)})
            return
        }
        
        resolve({"msg": "Vector ans is not supported yet!"})
        })
    }

}

export const nerdamerCAS = new NerdamerCAS()

