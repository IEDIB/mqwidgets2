// Requires jquery
// Other required assets are automatically inserted into page

/**
 * Mathquill groups are marked with the class pw-mq-group
 * All data-mq inserted within a group will only have one submit button, 
 * so all answers will be sent to the check server at once
 */

/**
 * DATA-MQ ELEMENT
 * It is used to generate questions client-side
 * 
 * SYNTAX on elem being p or span or div
 * <elem data-mq="qtype" data-mq-ans="a+b" data-mq-symbols="a:=1;b:=2;" data-mq-ini="?^?"
 *        data-mq-rules='{"key":"value"}' data-mq-formulation="...">
 *    Text that contains the formulation...
 * </elem>
 * 
 * ATTRIBUTES
 * data-mq: can either define a type (simple, basic, cloze, panel, mchoice, mchoice*) or
 *         a base64 encoded definition of the whole activity. This last option is used to offuscate answers.
 *         In the last case, an activity generator can be used.
 * data-mq-ans: sympy representation of the answer. It can be a boolean to assert if it is true
 *              it can be an array ["","",""...] in cloze question types (it requires data-mq-ini)
 *
 * data-mq-symbols: Define symbols and default values, use := to assign values and ; to separate symbol definitions.
 *               In cloze questions an special variable called ua[i], i the index of the placeholder, is the answer
 *               that the user introduced at placeholder i. This can be used to construct a custom evaluator which
 *               returns a boolean value in data-mq-ans.
 *               Note that data-mq-ans can use any of the defined symbols. By default "x", "y", "z" are already defined
 *               as sympy symbols. No need to add them to data-mq-symbols.
 *               Define options for mchoice, mchoice* separated by comma.
 * 
 * data-mq-ini: Initial latex, e.g. ?+? on every ? is a placeholder for cloze questions or 
 *              an initial matrix of a given size M[3x3]
 * 
 * data-mq-rules: is a map which contains the options that must be passed to the evaluator
 *    "factor": true  --> the answer must be factorized
 *    "expanded": true --> the answer must be expanded
 *    "precision": 1e-3 --> precission of numeric answers
 *    "comma_as_decimal": true --> The comma symbol in the answer will be interpreted as decimal part separator.
 * 
 * data-mq-formulation (optional): Text that will be appended to the end of the formulation.
 */

/**
 * DATA-PYGEN ELEMENT
 * The questions are generated server-side by a generator in pygen server. After the question is generated and rendered
 * the validation process i equivalent to the one in DATA-MQ
 * 
 * <div data-pygen="path.to.generator.fn1[r=5,complexity=1];path.to.generator.fn2;path.to.generator.fn3;"
 *      data-pygen-category="algebra.monomials" data-pygen-order="weighted:0.2,0.7,0.1"
 *      data-pygen-goal="5,6,4;10,5,*" data-pygen-celebrate="none|confetti"
 * ></div>
 * 
 * data-pygen:
 *    The generator paths are the same as the ones defined in pygen.
 *    Several generators can be used by separating them with ;. 
 *    Generators can be configured by setting parameters values within brackets [].
 * 
 *  data-pygen-category:
 *    The category in iapace tree where the activity of the user will be stored
 *    Only if this parameter is set, a level indicador is shown in the activity
 * 
 *  data-pygen-order="random"  //default
 *    This options is discarded if only one generator is defined in data-pygen.
 *    By default one activity from the ones defined in data-pygen is taken at random.
 *    However other behaviours can be defined as ordering. Assume 3 generators:
 * 
 *    weighted: 0.2,0.6,0.2  Random but setting the probability at which every generator is used. Values must add 1.
 *                           In this example, most likely to generate a question from 2nd generator.
 * 
 *    sequence: 3,5,8  1st generator 3 questions, 2nd generator 5 questions, 3rd generator 8 questions
 *                     and repeat in cicles if more than 3+5+8 questions are created
 *    sequence: 3,5,* 1st generator 3 questions, 2nd generator 5 questions, 3rd generator remaining questions
 *    sequence: 3,*,* start with 3 questions of the first generator and after that take at random questions from generator 2 and 3.
 *    sequence: 3,*(0.7),*(0.3) The same as above but with weights
 * 
 *    Important: 
 *      1. * are only allowed at the end of the sequence
 *      2. sequences will not be mantained over page reloads. So every time the page realoads, the sequence starts again.
 * 
 *  data-pygen-goal:
 *     The condition to set the activity as completed. Many conditions can be set
 *     and if any of them is verified the goal flag is set.
 *     Different conditions are separated by ;. A condition takes 3 parameters
 *     <min_number_questions_answered>,<min_average_grade>,<current_level>
 *     "5,6,4;10,5,*" means
 *     5 or more questions answered, grade of 6 or more, current level 4 of more 
 *     OR
 *     10 or more questions answered, grade of 5 or more, regardless of the current level 
 * 
 * data-pygen-celebrate="none|confetti"
 *     Say whether to celebrate or not when the goal is reached!
 */
import { applyPolyfills } from './polyfills';
import { cfg } from './globals'
import { insertScript } from "./utils"; 
import { findQuillGroups } from './mqfy';
import { findPyGenerators } from './findPyGenerators';
import { MQWidgetsConfig } from './types';

applyPolyfills()


function reflow(widgets?: {[name: string]: string}) {
    findQuillGroups(widgets);  // Groups of mquills
    findPyGenerators(); // An interface for dynamic generated questions
} 

// Inject required dependencies on the page
// On jquery ready
let isInitialized = false 

function init(userConfig: MQWidgetsConfig) {
    // Prevent multiple initializations
    if(isInitialized) {
        reflow(userConfig.widgets)
        return
    }
    if( userConfig['engine'] && !userConfig.engines) {
        userConfig.engines = [userConfig['engine'] || ""]
    }
    if(!userConfig.engines) {
        console.error("The engines option in the init method is required.");
        return
    } if(!Array.isArray(userConfig.engines)) {
        userConfig.engines = [userConfig.engines]
      
    }
    cfg.setUserConfig(userConfig)
     
    //Bundle all dependencies in this same file (except Nerdamer)
    //createLinkSheet(urlJoin(cfg.MQWIDGETS_BASEURL, "mqwidgets2.css"));
    //insertScript(cfg.MATHQUILL_URL)
    const dependencies = []
    if(userConfig.engines.indexOf('nerdamer')>=0) {
        dependencies.push(insertScript(cfg.NERDAMER_URL))
    }
    if(dependencies.length) {
        Promise.all(dependencies).then(() => {
            reflow(userConfig?.widgets)
            isInitialized = true;
        },
        () => {
            console.error("Unable to load the required dependencies")
        });
    } else {
        reflow(userConfig?.widgets)
        isInitialized = true;
    }
}

export {
    init,
    reflow
}