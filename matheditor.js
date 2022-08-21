// Requires jquery
// Other required assets are automatically inserted into page

/**
 * Mathquill groups are marked with the class pw-mq-group
 * All data-mq inserted within a group will only have one submit button, so all answers will be sent to the check server at once
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

(function () {
    var HAS_IAPACE = window["IB"] && window["IB"].iapace;
    var RIGHT_ICON = 'fas fa-check'; //'far fa-smile'; //
    var WRONG_ICON = 'fas fa-times'; //'far fa-dizzy'; //
    var MAX_ATTEMPTS = 2;  // Maximum number of wrong attempts before showing right answer
    var CAS_URL =   "https://piworld.es/pigen/api/compare";
    var PYGEN_URL = "https://piworld.es/pigen/api/generate";
    var GETANSWER_URL = "https://piworld.es/pigen/api/getanswer";
    var BASE_URL =  "https://piworld.es/iedib/matheditor";
    var QTYPES = {
        S: 'simple',
        B: 'basic',
        C: 'cloze',
        P: 'panel',
        M: 'mchoice',  // multiple choice combo
        Ms: 'mchoice*' // multiple choice radio, checkbox
    };
    var STATUS = {
        UNMODIFIED: 100,
        MODIFIED: 200,
        CORRECT: 1,
        WRONG: 0
    };
    // Prevent ajax bombardment
    var LAST_AJAX = null;

    var reflowLatex = function() {
        if(window.MathJax) {
            window.MathJax.typesetPromise && window.MathJax.typesetPromise();
            window.MathJax.Hub && window.MathJax.Hub.Queue && window.MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        }
    };

    if (!Array.isArray) {
        Array.isArray = function(arg) {
          return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    var sum = function(iter) {
        var total = 0;
        for(var i=0, len=iter.length; i<len; i++) {
            total += iter[i];
        }
        return total;
    };

    !(typeof Number.isNaN == 'function') ||
    (Number.isNaN = function (value) {
        return value !== null // Number(null) => 0
        && (value != value // NaN != NaN
            || +value != value // Number(falsy) => 0 && falsy == 0...
        )
    });
 
    //Polyfill
    var forEach = function(obj, cb) {
        if(Array.isArray(obj)) {
            for(var i=0, len=obj.length; i<len; i++) {
                cb(i, obj[i]);    
            }
        } else {
            var keys = Object.keys(obj);
            for(var i=0, len=keys.length; i<len; i++) {
                var key = keys[i];
                cb(key, obj[key]);    
            }
        }
    };
    //Polyfill
    var map = function(iterable, cb) {
        var mapped = [];
        for(var i=0, len=iterable.length; i<len; i++) {
            mapped.push(cb(iterable[i]));    
        }
        return mapped;
    };
    //Polyfill
    var extend = function(base, sub) {
        // Avoid instantiating the base class just to setup inheritance
        // Also, do a recursive merge of two prototypes, so we don't overwrite 
        // the existing prototype, but still maintain the inheritance chain
        // Thanks to @ccnokes
        var origProto = sub.prototype;
        sub.prototype = Object.create(base.prototype);
        for (var key in origProto)  {
           sub.prototype[key] = origProto[key];
        }
        // The constructor property was set wrong, let's fix it
        Object.defineProperty(sub.prototype, 'constructor', { 
          enumerable: false, 
          value: sub 
        });
    };

    var copyPropsFromTo = function(source, target) {
        var props = Object.keys(source);
        for(var i=0, len=props.length; i < len; i++) {
            var prop = props[i];
            target[prop] = source[prop];
        }
    };

    var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

 
    var _insertScript = function (url) {
        var tag = document.createElement('script');
        tag.src = url; 
        tag.type = "text/javascript";
        tag.async = true;
        document.head.appendChild(tag);
        return tag;
    }; 
    var _createStyleSheet = function (src, id) {
        if (id && document.getElementById(id)) {
            return;
        }
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = src;
        if (id) {
            style.id = id;
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    var _createLinkSheet = function (href, id) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        document.getElementsByTagName('head')[0].appendChild(link);
    };

    var pageInfo = null;
    if(window.iedibAPI) {
        pageInfo = window.iedibAPI.getPageInfo();
        //console.log(pageInfo);
    }

    var scriptMQ = _insertScript(BASE_URL + "/lib/mathquill.matrix.min.js");
    _createLinkSheet(BASE_URL + "/lib/mathquill.matrix.css");

    var shared = {};

    var default_toolbar_buttons = ['fraction', 'square_root', 'cube_root', 'root', 'superscript', 'subscript', 'multiplication', 'division', 'plus_minus', 'pi', 'degree', 'not_equal', 'greater_equal', 'less_equal', 'greater_than', 'less_than', 'angle', 'parallel_to', 'perpendicular', 'triangle', 'parallelogram', 'round_brackets', 'matrix2', 'matrix3'];
    var default_toolbar_tabs = ["General", "Símbols", "Geometria", "Intervals"];
    var button_meta = {
        //TAB1
        "Multiplicació": { latex: "\\times", tab: 1, icon: '\\times'}, 
        "Fracció": { latex: "\\frac{}{}", moveto: "Up", movefor: 1, tab: 1, icon: '\\frac{\\square}{\\square}' },  
        "Exponent": { latex: "\\^{}", moveto: "Up", movefor: 1, tab: 1, icon: '\\square^2' }, 
        "Parèntesis": { latex: "\\left(\\right)", moveto: "Left", movefor: 1, tab: 1, icon: '\\left(\\square\\right)' },
        "Arrel quadrada": { latex: "\\sqrt{}", moveto: "Left", movefor: 1, tab: 1, icon: '\\sqrt{\\square}' }, 
        "Arrel cúbica": { latex: "\\sqrt[3]{}", moveto: "Left", movefor: 1, tab: 1, icon: '\\sqrt[3]{\\square}' }, 
        "Radical": { latex: "\\sqrt[{}]{}", moveto: "Left", movefor: 2, tab: 1, icon: '\\sqrt[\\square]{\\square}' }, 
        "Matriu 2x2": { latex: "\\begin{pmatrix} & \\\\ & \\end{pmatrix}", tab: 1, icon: 'M_{2\\times 2}' },
        "Matriu 3x3": { latex: "\\begin{pmatrix} & & \\\\ & &  \\\\ & & \\end{pmatrix}", tab: 1, icon: 'M_{3\\times 3}' },
        "Matriu mxn": { latex: function(vars){ 
            var lat = [];
            for(var i=0; i<vars.n; i++) {
                var latrow = [];
                for(var j=0; j<vars.m; j++) {
                    latrow.push(" ");
                }
                lat.push(latrow.join("&"))
            } 
            return "\\begin{pmatrix} " + lat.join("\\\\") + " \\end{pmatrix}";
        }, tab: 1, icon: 'M_{n\\times m}', vars: [{name:'n', type:'number', min:1, val: 2}, {name:'m', type:'number', min:1, val: 2}] },
        "Subíndex": { latex: "\\_{}", moveto: "Down", movefor: 1, tab: 1, icon: '\\square_{2}' }, 
        
        //TAB2 - símbols i constants
        "pi": { latex: "\\pi", tab: 2, icon: '\\pi' },
        "e": { latex: "\\e", tab: 2, icon: '\\e' },
        "infinit":{ latex: "\\infty", tab: 2, icon: '\\infty' },
        "Més menys": { latex: "\\pm", tab: 2, icon: '\\pm' }, 
        "Diferent": {latex: "\\neq", tab: 2, icon: '\\neq'}, 
        "Major o igual": { latex: "\\geq", tab: 2, icon: '\\geq' }, 
        "Menor o igual": { latex: "\\leq", tab: 2, icon: '\\leq' }, 
        "Major que": { latex: "\\gt", tab: 2, icon: '\\gt' }, 
        "Menor que": { latex: "\\lt", tab: 2, icon: '\\lt' }, 
       
        
        //TAB3 - geometria
        "Graus": { latex: "\\degree", tab: 3, icon: '\\degree' }, 
        "Angle": { latex: "\\angle", tab: 3, icon: '\\angle' }, 
        "Paral·lel a": { latex: "\\parallel", tab: 3, icon: '\\parallel' }, 
        "Perpendicular a": { latex: "\\perpendicular", tab: 3, icon: '\\perpendicular' }, 
        "Triangle": {  latex: "\\triangle", tab: 3, icon: '\\triangle'}, 
        "Paral·lelogram": { latex: "\\parallelogram", tab: 3, icon: '\\parallelogram' }, 

        //TAB4 - intervals
        "Interval obert":{ latex: "\\left( , \\right)", moveto: "Left", movefor: 2, tab: 4, icon: '\\left(\\square, \\square\\right)' },
        "Interval tancat":{ latex: "\\left[ , \\right]", moveto: "Left", movefor: 2, tab: 4, icon: '\\left[\\square, \\square\\right]' },
        "Interval semi1":{ latex: "\\left[ , \\right)", moveto: "Left", movefor: 2, tab: 4, icon: '\\left[\\square, \\square\\right)' },
        "Interval semi2":{ latex: "\\left( , \\right]", moveto: "Left", movefor: 2, tab: 4, icon: '\\left(\\square, \\square\\right]' },
        "Infinit":{ latex: "\\infty", tab: 4, icon: '\\infty' },
        "Conjunt dels reals":{ latex: "\\mathbb{R}", tab: 4, icon: '\\mathbb{R}' },
    };
    var keyboard_keys = {
        'letters': [{ 'value': 'q', 'type': 'write', 'class': 'ks', 'display': 'q', 'new_line': false }, { 'value': 'w', 'type': 'write', 'class': 'ks', 'display': 'w', 'new_line': false }, { 'value': 'e', 'type': 'write', 'class': 'ks', 'display': 'e', 'new_line': false }, { 'value': 'r', 'type': 'write', 'class': 'ks', 'display': 'r', 'new_line': false }, { 'value': 't', 'type': 'write', 'class': 'ks', 'display': 't', 'new_line': false }, { 'value': 'y', 'type': 'write', 'class': 'ks', 'display': 'y', 'new_line': false }, { 'value': 'u', 'type': 'write', 'class': 'ks', 'display': 'u', 'new_line': false }, { 'value': 'i', 'type': 'write', 'class': 'ks', 'display': 'i', 'new_line': false }, { 'value': 'o', 'type': 'write', 'class': 'ks', 'display': 'o', 'new_line': false }, { 'value': 'p', 'type': 'write', 'class': 'ks', 'display': 'p', 'new_line': true }, { 'value': 'a', 'type': 'write', 'class': 'ks', 'display': 'a', 'new_line': false }, { 'value': 's', 'type': 'write', 'class': 'ks', 'display': 's', 'new_line': false }, { 'value': 'd', 'type': 'write', 'class': 'ks', 'display': 'd', 'new_line': false }, { 'value': 'f', 'type': 'write', 'class': 'ks', 'display': 'f', 'new_line': false }, { 'value': 'g', 'type': 'write', 'class': 'ks', 'display': 'g', 'new_line': false }, { 'value': 'h', 'type': 'write', 'class': 'ks', 'display': 'h', 'new_line': false }, { 'value': 'j', 'type': 'write', 'class': 'ks', 'display': 'j', 'new_line': false }, {
            'value': 'k', 'type': 'write', 'class': 'ks', 'display'
                : 'k', 'new_line': false
        }, { 'value': 'l', 'type': 'write', 'class': 'ks', 'display': 'l', 'new_line': true }, { 'value': 'CapsLock', 'type': 'custom', 'class': 'ks long icon', 'display': '&#8673;', 'new_line': false }, { 'value': 'z', 'type': 'write', 'class': 'ks', 'display': 'z', 'new_line': false }, { 'value': 'x', 'type': 'write', 'class': 'ks', 'display': 'x', 'new_line': false }, { 'value': 'c', 'type': 'write', 'class': 'ks', 'display': 'c', 'new_line': false }, { 'value': 'v', 'type': 'write', 'class': 'ks', 'display': 'v', 'new_line': false }, { 'value': 'b', 'type': 'write', 'class': 'ks', 'display': 'b', 'new_line': false }, { 'value': 'n', 'type': 'write', 'class': 'ks', 'display': 'n', 'new_line': false }, { 'value': 'm', 'type': 'write', 'class': 'ks', 'display': 'm', 'new_line': false }, { 'value': 'Backspace', 'type': 'keystroke', 'class': 'ks long icon', 'display': '&#8678;', 'new_line': true }, { 'value': 'numpad', 'type': 'custom', 'class': 'ks long', 'display': '123', 'new_line': false }, { 'value': ',', 'type': 'write', 'class': 'ks', 'display': ',', 'new_line': false }, { 'value': '\\ ', 'type': 'write', 'class': 'ks too_long', 'display': 'Space', 'new_line': false }, { 'value': '.', 'type': 'write', 'class': 'ks', 'display': '.', 'new_line': false }, { 'value': 'close', 'type': 'custom', 'class': 'ks long takeup', 'display': 'X', 'new_line': false }], 'numbers': [{ 'value': '1', 'type': 'write', 'class': 'ks', 'display': '1', 'new_line': false }, { 'value': '2', 'type': 'write', 'class': 'ks', 'display': '2', 'new_line': false }, { 'value': '3', 'type': 'write', 'class': 'ks', 'display': '3', 'new_line': false }, { 'value': '+', 'type': 'write', 'class': 'ks', 'display': '+', 'new_line': false }, { 'value': '-', 'type': 'write', 'class': 'ks', 'display': '&#8315;', 'new_line': true }, { 'value': '4', 'type': 'write', 'class': 'ks', 'display': '4', 'new_line': false }, { 'value': '5', 'type': 'write', 'class': 'ks', 'display': '5', 'new_line': false }, {
            'value': '6', 'type': 'write',
            'class': 'ks', 'display': '6', 'new_line': false
        }, { 'value': '\\times', 'type': 'write', 'class': 'ks', 'display': '&times;', 'new_line': false }, { 'value': '/', 'type': 'write', 'class': 'ks', 'display': '&#247;', 'new_line': true }, { 'value': '7', 'type': 'write', 'class': 'ks', 'display': '7', 'new_line': false }, { 'value': '8', 'type': 'write', 'class': 'ks', 'display': '8', 'new_line': false }, { 'value': '9', 'type': 'write', 'class': 'ks', 'display': '9', 'new_line': false }, { 'value': '=', 'type': 'write', 'class': 'ks', 'display': '=', 'new_line': false }, { 'value': 'Backspace', 'type': 'keystroke', 'class': 'ks long icon', 'display': '&#8678;', 'new_line': true }, { 'value': 'letters', 'type': 'custom', 'class': 'ks long', 'display': 'ABC', 'new_line': false }, { 'value': '0', 'type': 'write', 'class': 'ks', 'display': '0', 'new_line': false }, { 'value': '?', 'type': 'write', 'class': 'ks', 'display': '?', 'new_line': false }, {
            'value': '%', 'type': 'write', 'class': 'ks', 'display': '%'
            , 'new_line': false
        }, { 'value': 'close', 'type': 'custom', 'class': 'ks long takeup', 'display': 'X', 'new_line': false }]
    };

    var sanitizeLaTeX = function(tex) {
        return tex.replace(/·/g, '*');
    }

    /**
     * Creates a basic dialog which can be extended for further functionality
     * @param {*} title 
     * @param {*} width 
     * @param {*} height 
     */
    var PwDialog = function(title, width, height) {
        this.id = "pwdlg_" + Math.random().toString(32).substring(2);
        this.window = $('<div id="'+this.id+'" class="pw-me-dlg" style="width:'+width+'px;height:'+height+'px;display:none;"></div>');
        var topBar = $('<div class="pw-me-dlg-header"></div>');
        this.topBar = topBar;
        var headerTitle = $('<span class="pw-me-dlg-headertitle">' + title + '</span>');
        this.closeBtn = $('<button class="btn btn-sm pw-me-btn-dlgclose" title="Tancar"><i class="fas fa-times"></i></button>');
        var self = this;
        this.closeBtn.on("click", function(ev){
            ev.preventDefault();
            self.window.css("display", "none");});
        topBar.append(headerTitle);
        topBar.append(this.closeBtn);
        this.window.append(topBar);
        //Add dialog to body
        $('body').append(this.window);

        // Make this dialog draggable
        var active = false;
        var currentX;
        var currentY;
        var initialX;
        var initialY;
        var xOffset = 0;
        var yOffset = 0;
    
        var dragStart = function(e) { 
          if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
          } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
          }
         
          if (e.target === topBar[0]) {
            active = true;
          }
        };
    
        var dragEnd = function(e) { 
          initialX = currentX;
          initialY = currentY;
          active = false;
        };


        var setTranslate = function(xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        };
  
    
        var drag = function(e) {
          if (active) { 
            e.preventDefault();
          
            if (e.type === "touchmove") {
              currentX = e.touches[0].clientX - initialX;
              currentY = e.touches[0].clientY - initialY;
            } else {
              currentX = e.clientX - initialX;
              currentY = e.clientY - initialY;
            }
    
            xOffset = currentX;
            yOffset = currentY;
    
            setTranslate(currentX, currentY, self.window[0]);
          }
        };
     

        topBar[0].addEventListener("touchstart", dragStart, false);
        topBar[0].addEventListener("touchend", dragEnd, false);
        topBar[0].addEventListener("touchmove", drag, false);
    
        topBar[0].addEventListener("mousedown", dragStart, false);
        topBar[0].addEventListener("mouseup", dragEnd, false);
        topBar[0].addEventListener("mousemove", drag, false);
    };

    PwDialog.prototype = {
        append: function(element){
            this.window.append(element);
        },
        show: function(){
            this.window.css("display", "initial");
        },  
        close: function(){
            this.window.css("display", "none");
        },
        remove: function(){
            this.closeBtn.off();
            this.window.remove();
            this.topBar[0].removeEventListener("touchstart", dragStart);
            this.topBar[0].removeEventListener("touchend", dragEnd);
            this.topBar[0].removeEventListener("touchmove", drag);
            this.topBar[0].removeEventListener("mousedown", dragStart);
            this.topBar[0].removeEventListener("mouseup", dragEnd);
            this.topBar[0].removeEventListener("mousemove", drag);
        },
        dispose: function() {
            this.remove();
        }
    };

    // TabMenu
    var PwTabMenu = function(parent){
        this.parent = parent;
        this.tabs = {};
        this.currentTab = null;
        var panel = $('<div class="pw-me-tabmenu"></div>');
        this.tabsPanel = $('<div class="pw-me-tabspanel"></div>');
        this.contentsPanel = $('<div class="pw-me-tabcontents"></div>');
        panel.append(this.tabsPanel);
        panel.append(this.contentsPanel);
        this.parent.append(panel);
    };

    PwTabMenu.prototype = {
        addTab: function(name){
            if(this.tabs[name]) {
                //already exists
                return;
            }
            var self = this;
            var tab = $('<button style="display:none;" class="btn btn-sm pw-me-btn-tab">' + name + '</button>');
            var container = $('<div style="display:none;" class="pw-me-tabcontainer"></div>');
            tab.on('click', function(ev){
                ev.preventDefault();
                self.setTab(name);
            });
            this.tabsPanel.append(tab);
            this.contentsPanel.append(container);
            this.tabs[name] = {
                tab: tab,
                container: container
            };
            if(Object.keys(this.tabs).length === 1) {
                this.setTab(name);
            }
        },
        addContentsToTab: function(name, contents) {
            if(this.tabs[name]) {
                this.tabs[name].container.append(contents);
            }
        },
        setVisible: function(name, visibility){
            if(this.tabs[name]) {
                this.tabs[name].tab.css('display', visibility?'':'none');
                this.tabs[name].container.css('display', visibility?'flex':'none');
            }
        },
        setTab: function(name){
            forEach(this.tabs, function(key, value) {
                if(key==name) {
                    value.tab.addClass('pw-me-btn-active');
                } else {
                    value.tab.removeClass('pw-me-btn-active');
                }
                value.container.css('display', key==name?'flex':'none');
            });
        },
        dispose: function() {
            this.tabsPanel.children().off();
            this.tabsPanel.html('');
            this.contentsPanel.html('');
            this.tabs = {};
        }
    };
  
    // Create a button for toolbar tab
    var createToolbarButton = function(parent, btn_meta, key, mathInput) {
        
        if(typeof(btn_meta.latex) === "function") {
            var btn = $('<div class="btn btn-sm pw-me-btn-toolbar pw-me-btn-dropdown" title="' + key.trim() + '"></div>');
            var icon = $('<span>'+btn_meta.icon+'</span>');
            shared.MQ.StaticMath(icon[0]);
            btn.append(icon);
 
            var panell = $('<div class="pw-me-btn-dropdownmenu"></div>')
            parent.append(panell);
            var controls = []; 
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
                var varsmap = {};
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
            var btn = $('<button class="btn btn-sm pw-me-btn-toolbar" title="' + key.trim() + '"></button>');
            var icon = $('<span>'+btn_meta.icon+'</span>');
            shared.MQ.StaticMath(icon[0]);
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

    // Editor panel
    var EditorPanel = function(parent, gid, standalone) {
        var self = this;
        this.parent = parent;
        this.gid = gid;
        this.wrong_attemps = 0;
        this.standalone = standalone;
        this.status = STATUS.UNMODIFIED;
        this.panel = $('<div class="pw-me-editorpanel" style="position:relative"></div>');
        this.parent.append(this.panel);

        
        this.palettes = new PwTabMenu(this.panel);
       

        var spanMathInput = $('<span class="pw-me-editorpanel-mathinput"></span>'); 
        spanMathInput.on("click", function(ev){
            ev.preventDefault();
            $('.pw-me-btn-dropdownmenu').css("display", "none");
        });
        this.panel.append(spanMathInput);
        this.mathInput = shared.MQ.MathField(spanMathInput[0],{
            handlers: {
                edit: function (ev) {
                    if (standalone && self.status != STATUS.MODIFIED) {
                        self.check_el.html('');
                        self.status = STATUS.MODIFIED; 
                    }
                }
            }
        }); 

        if(this.standalone) {
            this.check_el = $('<div></div>');
            this.panel.append(this.check_el);
        }

        this.feedback_el = $('<div class="pw-mq-feedback" style="display:none;"></div>');
        this.panel.append(this.feedback_el);

        //Add button to palettes
        forEach(button_meta, function(name, btnInfo) { 
            var tabName = default_toolbar_tabs[btnInfo.tab-1];
            self.palettes.addTab(tabName);

            // create and add button to palette  
            var aButton = createToolbarButton(self.panel, btnInfo, name, self.mathInput);
            self.palettes.addContentsToTab(tabName, aButton);
        });
    };

    EditorPanel.prototype = {
        clear: function() {
            this.mathInput.latex('');
            this.check_el.html('');
            this.status = STATUS.UNMODIFIED;
        },
        focus: function() {
            this.mathInput.focus();
        },
        latex: function(tex) {
            if(tex !=null) {
                this.mathInput.latex(tex);
                this.status = STATUS.UNMODIFIED;
            } else {
                return sanitizeLaTeX(this.mathInput.latex());
            }
        },
        checkMsg: function(status, msg) {
            if(this.standalone) {
                this.status = status;
                var msg2 = null;
                if(status==1) {
                    msg2 = '<span style="color:green;margin:5px;"><i class="fas fa-check"></i> '+msg+'</span>';
                } else if(status==0) {
                    msg2 = '<span style="color:darkred;margin:5px;"><i class="fas fa-times"></i> '+msg+'</span>';
                } else {
                    msg2 = '<span style="color:purple;margin:5px;"><i class="fas fa-exclamation-triangle"></i> '+msg+'</span>';
                }
                this.check_el.html(msg2);
            }
        },
        get_qid: function(){
            return this.mathInput.id;
        },
        showPalette: function(name, visible) {
            this.palettes.setVisible(name, visible);
        },
        dispose: function() {
            this.mathInput.revert();
            this.panel.find("button").off();
            this.palettes.dispose();
        },
        reflow: function() {
            this.mathInput.reflow();
            this.status = STATUS.UNMODIFIED;
        },
        setDefinition: function(def) {
            this.def = def;
            var self = this;
            if(def.palettes=='all') {
                // Show all palettes
                // enable general palette
                forEach(default_toolbar_tabs, function(i, name) {
                    self.palettes.setVisible(name, true);
                });
                this.palettes.setTab('General');
            }
            // According to definition.palettes prepare the correct palettes
            else if(def.palettes && def.palettes.length) {
                // show this palettes
                // set to first palette
                var firstSelected = null
                var num_visible = 0;
                forEach(default_toolbar_tabs, function(i, name) {
                    var found = false;
                    var j = 0;
                    while(!found && j<def.palettes.length) {
                        found = def.palettes[j].toLowerCase().trim() == name.toLowerCase().trim();
                        if(found && j==0) {
                            firstSelected = name;
                        }
                        if(found) {
                            num_visible += 1;
                        }
                        j += 1;
                    }
                    self.palettes.setVisible(name, found);
                });
                if(num_visible == 0 || !firstSelected) {
                    this.palettes.setVisible('General', true);
                }
                this.palettes.setTab(firstSelected || 'General');
            } else {
                // Only show the general palette
                // enable general palette
                forEach(default_toolbar_tabs, function(i, name) {
                    self.palettes.setVisible(name, name=='General');
                });
                this.palettes.setTab('General');
            }
        },
        showAnswer: function() {
            if(!this.def.right_answer) {
                console.log(this.def);
                console.error("Cannot show answer because, ", this.def.right_answer);
                return;
            }  
            this.feedback_el.css("display", "");
            this.feedback_el.html(atob(this.def.right_answer)+ '<p><br></p>');
            reflowLatex();
        },
        increment_wrong: function() {
            this.wrong_attemps += 1;
        }
    };

    // Dialog Editor panel (embeded in dialog)
    // Extends Dialog
    // Composes EditorPanel
    var EditorDialog = function() {
        PwDialog.call(this, '<i style="color:darkred;" class="fas fa-square-root-alt"></i> Editor matemàtic', 500, 320);
        this.editorPanel = new EditorPanel(this.window, 0); 
        this.onAccept = null;
        this.onCancel = null;
        var controlButtons = $('<div class="pw-me-dlg-controls"></div>')
        var acceptBtn = $('<button class="btn btn-sm btn-primary">Accepta</button>');
        var cancelBtn = $('<button class="btn btn-sm btn-outline-primary">Cancel·la</button>');
        controlButtons.append(acceptBtn);
        controlButtons.append(cancelBtn);
        this.append(controlButtons);
        var self = this;
        acceptBtn.on('click', function(ev){
            ev.preventDefault();
            if(self.onAccept) {
                self.onAccept(self);
            }
            self.close();
        });
        cancelBtn.on('click', function(ev){
            ev.preventDefault();
            if(self.onCancel) {
                self.onCancel(self);
            }
            self.close();
        });
    };

    EditorDialog.prototype = {
        latex: function(tex) {
            if(tex !=null) {
                this.editorPanel.latex(tex); 
            } else {
                return sanitizeLaTeX(this.editorPanel.latex());
            }
        },
        //@override
        show: function() {
            this.window.css("display", "");
            this.editorPanel.focus();
        },
        onAccept: function(fn){
            this.onAccept = fn;
        },
        onCancel: function(fn){
            this.onCancel = fn;
        },
        //@override
        dispose: function() {
            this.editorPanel.dispose();
            this.window.find('button').off();
            this.dispose();
        },
        reflow: function() {
            this.editorPanel.reflow();
        },
        setDefinition: function(def) {
            this.editorPanel.setDefinition(def);
        }
    };
    extend(PwDialog, EditorDialog);

    var regexMatrices = /\\begin{pmatrix}(.*?)\\end{pmatrix}/g;
    var extractMatrices = function(tex) {
        var matrices = [];
        var m = null;
        while((m = regexMatrices.exec(tex)) !== null) {
            var mat = [];
            var linies = m[1].split('\\\\');
            forEach(linies, function(i, alinia) { 
                var linia = alinia.split('&');
                mat.push(linia);
            });
            matrices.push(mat);
        }
        return matrices;
    };

    var has_empty_elements = function(matrix) {
        var rows = matrix.length;
        for(var i=0; i<rows; i++) {
            var arow = matrix[i];
            var cols = arow.length;
            for(var j=0; j<cols; j++) {
                if(!arow[j]) {
                    return true;
                }
            }
        }
        return false;
    };

    var has_empty_answers = function(v) {
        for(var i =0, len=v.length; i<len; i++ ) {
            var tex = v[i];
            if(tex == '' || (tex && !tex.trim())) {
                return true;
            }
            // a matrix with empty answers
            var matrices = extractMatrices(tex);
            for(var j=0, lenmat=matrices.length; j<lenmat; j++) {
                if(has_empty_elements(matrices[j])) {
                    return true;
                }
            }
        }
        return false;
    };

    
    var bindSubmitActionButton = function (gid, check_btn, extraActions) {
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
                if(editor.status != STATUS.MODIFIED) {
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

                    if( editor.def.right_answer && (editor.wrong_attemps || 0) > MAX_ATTEMPTS ) {
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
                    if(editor.qtype == QTYPES.M || editor.type == QTYPES.Ms) {
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
                    var postObj = {latex: ual, qid: qid};
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
                    if(pageInfo) { 
                        postObj.pageInfo = pageInfo;
                        if(!editor.hash) {
                            editor.hash = MD5(postObj.formulation + '_' + (postObj.pageInfo.bookId || 0) + '_' + (postObj.pageInfo.chapterId || 0)); 
                        }
                        postObj.hash = editor.hash;
                    }
                    promises.push($.ajax({
                        type: "POST",
                        url: CAS_URL,
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
    var createSubmitButtonForGroup = function (gid) {
        var check_btn = $('<button class="btn btn-sm btn-primary pw-me-submitgroup"><i class="fas fa-check"></i> Comprova</button>');
        bindSubmitActionButton(gid, check_btn);
        return check_btn;
    };

    var EditorInput = function (parent, gid, qtype) {
        var self = this;
        this.gid = gid;
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = STATUS.UNMODIFIED;
        this.answerShown = false;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-editorinput"></div>');
        this.quill_blocker = $('<div></div>')
        var quill_el = $('<span></span>');
        this.quill_blocker.append(quill_el);
        this.check_el = $('<div class="pw-me-check"></div>');
        this.quill_el_container.append(this.quill_blocker);
        var isBtn = qtype === QTYPES.S;

        this.parent.append(this.quill_el_container);

        this.mathInput = shared.MQ.MathField(quill_el[0], {
            handlers: {
                edit: function (ev) {
                    console.log("Edit ev on mathquill ", ev, self.mathInput.latex());
                    if (self.status != STATUS.MODIFIED) {
                        self.check_el.html('');
                        self.status = STATUS.MODIFIED;
                        self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                    }
                }
            }
        });
    
        if (isBtn) {
            this.dlg_btn_el = $('<button class="btn btn-sm pw-me-btn-openeditor" title="Obrir l\'editor"><i class="fas fa-square-root-alt"></i></button>');
            this.quill_el_container.append(this.dlg_btn_el);
            this.dlg_btn_el.on("click", function (ev) {
                    ev.preventDefault();
                    // open a editordlg
                    // must do the binding when closing
                    var dlg = shared['editordlg'];
                    if(!dlg) {
                        dlg = new EditorDialog();
                        shared['editordlg'] = dlg;
                    } 
                    dlg.onAccept = function(self2){
                        self.mathInput.latex(self2.latex());
                    };
                    dlg.setDefinition(self.def);
                    dlg.show();
                    dlg.latex(self.mathInput.latex()); 

            });
        }
        this.quill_el_container.append(this.check_el);
    };

    EditorInput.prototype = {
        clear: function() {
            this.mathInput.latex('');
            this.check_el.html('');
            this.status = STATUS.UNMODIFIED;
            this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
        },
        focus: function() {
            this.mathInput.focus();
        },
        latex: function(tex) {
            if(tex !=null) {
                console.log("Setting latex ", tex);
                this.mathInput.latex(tex);
                this.status = STATUS.UNMODIFIED;
            } else {
                return sanitizeLaTeX(this.mathInput.latex());
            }
        },
        checkMsg: function(status, msg) {
            this.status = status;
            var msg2 = null;
            if(status==1) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="'+RIGHT_ICON+'"></i></span>';
                this.quill_el_container.addClass('pw-me-right');
            } else if(status==0) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="'+WRONG_ICON+'"></i></span>';
                this.quill_el_container.addClass('pw-me-wrong');
            } else {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
                this.quill_el_container.addClass('pw-me-alert');
            }
            this.check_el.html(msg2);
        },
        get_qid: function(){
            return this.mathInput.id;
        }, 
        dispose: function() {
            this.mathInput.revert();
            this.quill_el_container.find("button").off();
        },
        showAnswer: function() {
            if(!this.def.right_answer) {
                console.log("Cannot show answer because, ", this.def.right_answer);
                return;
            }
           
            var self = this;
            //this.showAnswerBtn = $('<button class="btn btn pw-me-btn-showanswer" data-toggle="tooltip" title="Mostrar la solució"><i class="fas fa-question-circle"></i></button>');
            //this.quill_el_container.append(this.showAnswerBtn);

            // Must create a global dialog
            if(!shared["showAnswerDlg"]) {
                var dlg = new PwDialog("Resposta correcta", 400, 250);
                shared["showAnswerDlg"] = dlg;  
                var answerHolder = $('<div class="pw-answer-holder"></div>');
                dlg.append(answerHolder);
                var closeBtn = $('<button class="btn btn-sm btn-primary" style="margin-left: 15px;">Tancar</button>');
                dlg.append(closeBtn);
                closeBtn.on('click', function(ev){
                    ev.preventDefault();
                    dlg.close();
                });
            }
           // this.showAnswerBtn.on('click', function(ev){
               // ev.preventDefault();
                if(!self.answerShown) {
                    self.answerShown = true;
                    self.status = STATUS.UNMODIFIED;
                    // Disable mathquill
                    self.quill_blocker.addClass('pw-me-blocker');
                    // Disable edit buttton
                    if(self.dlg_btn_el) {
                        self.dlg_btn_el.prop("disabled", true);
                    }
                }
                
                
                var dlg = shared["showAnswerDlg"];
                var answerHolder = dlg.window.find(".pw-answer-holder");
                answerHolder.html(atob(self.def.right_answer)+ '<p><br></p>');
                reflowLatex();
                dlg.show();
            //})
        }, 
        increment_wrong: function() {
            this.wrong_attemps += 1;
            if(this.wrong_attemps == MAX_ATTEMPTS+1  &&  !this.isPigen && this.def) {
                console.log(this.def);
               
                // create a button to display answer
                var rescueBtn = $('<button class="btn btn-sm" title="Mostra la solució"><i class="far fa-question-circle"></i></button>');
                var self = this;
                rescueBtn.on("click", function(evt){
                    self.showAnswer();
                });
                if(!this.def.right_answer) {
                    // Must ask the server to generate a right_answer for us by sending the def object
                    $.ajax({
                        type: "POST",
                        url: GETANSWER_URL,
                        data: JSON.stringify(this.def),
                        dataType: 'json',
                        success: function (datos) { 
                            if(datos.right_answer) {
                                self.def.right_answer = datos.right_answer;
                                self.quill_el_container.append(rescueBtn);
                            } else if(datos.msg) {
                                console.error(datos.msg);
                            }
                        }
                    });
                } else {
                    this.quill_el_container.append(rescueBtn);
                }
               
            }
        },
        reflow: function() {
            this.mathInput.reflow();
            this.status = STATUS.UNMODIFIED;
        },
        setDefinition: function(def) {
            this.def = def;
        }
    };

    var MultipleChoiceCombo = function(parent, gid, options) { 
        if(typeof(options)=='string') {
            options = options.split(";");
        }
        var self = this; 
        this.selectedIndex = '';
        this.gid = gid;
        this.qid = Math.floor(Math.random()*10000)+10000;
        this.options = options || [];
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = STATUS.UNMODIFIED;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-mchoice"></div>');
        this.check_el = $('<div class="pw-me-check"></div>');
        var btn_group = $('<div class="btn-group"></div>');
        this.btn_action = $('<button type="button" style="background:white;" class="btn btn-outline-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Tria una opció</button>');
        var dropdown_menu = $('<div class="dropdown-menu"></div>');
        btn_group.append(this.btn_action);
        btn_group.append(dropdown_menu);
        forEach(options, function(i, opt){
            var dropdown_item = $('<a class="dropdown-item" href="#">'+opt+'</a>');
            dropdown_item.on('click', function(evt){
                evt.preventDefault(); 
                self.selectedIndex = i+'';
                self.btn_action.html(dropdown_item.html());
                if (self.status != STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = STATUS.MODIFIED;
                    self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                }
            });
            dropdown_menu.append(dropdown_item);
        });  
        this.quill_el_container.append(btn_group);
        this.quill_el_container.append(this.check_el);
        this.parent.append(this.quill_el_container);
        reflowLatex();   
    };


    MultipleChoiceCombo.prototype = {
        clear: function() { 
            this.selectedIndex = '';
            this.btn_action.html('');
            this.check_el.html('');
            this.status = STATUS.UNMODIFIED;
            this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
        },
        focus: function() { 
            this.btn_action.focus();
        },
        latex: function(tex) { 
            return this.selectedIndex;
        },
        checkMsg: function(status, msg) {
            this.status = status;
            var msg2 = null;
            if(status==1) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-check"></i></span>';
                this.quill_el_container.addClass('pw-me-right');
            } else if(status==0) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-times"></i></span>';
                this.quill_el_container.addClass('pw-me-wrong');
            } else {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
                this.quill_el_container.addClass('pw-me-alert');
            }
            this.check_el.html(msg2);
        },
        get_qid: function(){
            return this.qid;
        }, 
        dispose: function() { 
            this.quill_el_container.off();
        },
        reflow: function() { 
            this.status = STATUS.UNMODIFIED;
        },
        setDefinition: function(def) {
            this.def = def; 
        },
        increment_wrong: function() {
            this.wrong_attemps += 1;
        }
    };

    /**
     * TODO Multiple options with checkboxes
     * @param {*} parent 
     * @param {*} gid 
     * @param {*} options 
     * @param {*} multipleAnswers 
     */
    var MultipleChoiceCheckbox = function(parent, gid, options, multipleAnswers) { 
        this.multipleAnswers = multipleAnswers;
        if(typeof(options)=='string') {
            options = options.split(";");
        }
        var self = this; 
        this.selectedIndex = '';
        this.gid = gid;
        this.qid = Math.floor(Math.random()*10000)+10000;
        this.options = options || [];
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = STATUS.UNMODIFIED;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-mchoice"></div>');
        this.check_el = $('<div class="pw-me-check"></div>');
        var radios_group = $('<div></div>');
        var radiosGroupId = "rgid_"+Math.random().toString(32).substring(2);
        var allRadios = [];
        forEach(options, function(i, opt){
            var radioId =  "raid_"+Math.random().toString(32).substring(2);
            var radio_wrapper = $('<div class="form-check"></div>');
            var radio_item = null;
            if(self.multipleAnswers) {
                radio_item = $('<input class="form-check-input" type="checkbox" id="'+radioId+'" value="'+i+'"/>');
            } else {
                radio_item = $('<input class="form-check-input" type="radio" name="'+radiosGroupId+'" id="'+radioId+'" value="'+i+'"/>');
            }
            allRadios.push(radio_item);
            var radio_label = $('<label class="form-check-label" for="'+radioId+'">' + opt+ '</label>');
            radio_item.on('change', function(evt){
                evt.preventDefault(); 
                //Determine which are selected
                var wsel = [];
                for(var k=0; k<allRadios.length; k++) {
                    if(allRadios[k].prop('checked')) {
                        wsel.push(allRadios[k].prop('value')+'');
                    }
                }
                self.selectedIndex = wsel.join(','); 
                if (self.status != STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = STATUS.MODIFIED;
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


    MultipleChoiceCheckbox.prototype = {
        clear: function() { 
            this.selectedIndex = '';
            this.btn_action.html('');
            this.check_el.html('');
            this.status = STATUS.UNMODIFIED;
            this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
        },
        focus: function() { 
        },
        latex: function(tex) { 
            return this.selectedIndex;
        },
        checkMsg: function(status, msg) {
            this.status = status;
            var msg2 = null;
            if(status==1) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-check"></i></span>';
                this.quill_el_container.addClass('pw-me-right');
            } else if(status==0) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-times"></i></span>';
                this.quill_el_container.addClass('pw-me-wrong');
            } else {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
                this.quill_el_container.addClass('pw-me-alert');
            }
            this.check_el.html(msg2);
        },
        get_qid: function(){
            return this.qid;
        }, 
        dispose: function() { 
            this.quill_el_container.off();
        },
        reflow: function() { 
            this.status = STATUS.UNMODIFIED;
        },
        setDefinition: function(def) {
            this.def = def; 
        },
        increment_wrong: function() {
            this.wrong_attemps += 1;
        }
    };

    var EditorCloze = function(parent, gid, ini) {
        var self = this; 
        this.gid = gid;
        // status = 0 incorrecte, status = 1 correcte, status < 0 errors 
        this.status = STATUS.UNMODIFIED;
        this.parent = parent;
        this.wrong_attemps = 0;
        this.quill_el_container = $('<div class="pw-me-editorinput"></div>');
        var quill_el = $('<span>'+ini+'</span>');
        this.check_el = $('<div class="pw-me-check"></div>');
        this.parent.append(this.quill_el_container);
        this.quill_el_container.append(quill_el);
        this.mathInput = shared.MQ.StaticMath(quill_el[0]); 
        // TODO: listen to changes to set status to unmodified
         
        forEach(this.mathInput.innerFields, function(i, e) {
            e.__controller.textarea.on('keyup', function(ev){
                ev.preventDefault();
                if (self.status != STATUS.MODIFIED) {
                    self.check_el.html('');
                    self.status = STATUS.MODIFIED;
                    self.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
                }
            });
        });
        this.quill_el_container.append(this.check_el);
    };

    EditorCloze.prototype = {
        clear: function() {
            var v = this.mathInput.innerFields;
            for(var i=0, lenv=v.length; i<lenv; i++) {
                v[i].latex('');
            } 
            this.check_el.html('');
            this.status = STATUS.UNMODIFIED;
            this.quill_el_container.removeClass('pw-me-right pw-me-wrong pw-me-alert');
        },
        focus: function() {
            this.mathInput.focus();
        },
        latex: function(tex) {
            if(tex !=null) {
                this.mathInput.latex(tex);
                this.status = STATUS.UNMODIFIED;
            } else {
                var parts = [];
                console.log(this.mathInput.innerFields);
                var v = this.mathInput.innerFields;
                for(var i=0, lenv=v.length; i<lenv; i++) {
                    parts.push(v[i].latex());
                } 
                return parts;
            }
        },
        checkMsg: function(status, msg) {
            this.status = status;
            var msg2 = null;
            if(status==1) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-check"></i></span>';
                this.quill_el_container.addClass('pw-me-right');
            } else if(status==0) {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-times"></i></span>';
                this.quill_el_container.addClass('pw-me-wrong');
            } else {
                msg2 = '<span data-toggle="tooltip" title="' + msg + '"><i class="fas fa-exclamation-triangle"></i></span>';
                this.quill_el_container.addClass('pw-me-alert');
            }
            this.check_el.html(msg2);
        },
        get_qid: function(){
            return this.mathInput.id;
        }, 
        dispose: function() {
            this.mathInput.revert();
            this.quill_el_container.find("button").off();
        },
        reflow: function() {
            this.mathInput.reflow();
            this.status = STATUS.UNMODIFIED;
        },
        setDefinition: function(def) {
            this.def = def; 
        },
        increment_wrong: function() {
            this.wrong_attemps += 1;
        },
        showAnswer: function() {
            if(!this.def.right_answer) {
                console.log("Cannot show answer because, ", this.def.right_answer);
                return;
            }
           
            var self = this;
            //this.showAnswerBtn = $('<button class="btn btn pw-me-btn-showanswer" data-toggle="tooltip" title="Mostrar la solució"><i class="fas fa-question-circle"></i></button>');
            //this.quill_el_container.append(this.showAnswerBtn);

            // Must create a global dialog
            if(!shared["showAnswerDlg"]) {
                var dlg = new PwDialog("Resposta correcta", 400, 250);
                shared["showAnswerDlg"] = dlg;  
                var answerHolder = $('<div class="pw-answer-holder"></div>');
                dlg.append(answerHolder);
                var closeBtn = $('<button class="btn btn-sm btn-primary" style="margin-left: 15px;">Tancar</button>');
                dlg.append(closeBtn);
                closeBtn.on('click', function(ev){
                    ev.preventDefault();
                    dlg.close();
                });
            }
                // this.showAnswerBtn.on('click', function(ev){
               // ev.preventDefault();
                if(!self.answerShown) {
                    self.answerShown = true;
                    self.status = STATUS.UNMODIFIED;
                    //Disable mathquill
                    //self.quill_blocker.addClass('pw-me-blocker');
                    //Disable edit buttton
                    if(self.dlg_btn_el) {
                        self.dlg_btn_el.prop("disabled", true);
                    }
                }
                
                
                var dlg = shared["showAnswerDlg"];
                var answerHolder = dlg.window.find(".pw-answer-holder");
                answerHolder.html(atob(self.def.right_answer)+ '<p><br></p>');
                reflowLatex();
                dlg.show();
            //})
        }
    };

    var processMqIni = function(ini) {
        ini = ini || '';
        ini = ini.replace(/\?\d*?/g, '\\MathQuillMathField{}');
        ini = ini.replace(/M\[(\d+)x(\d+)\]/g, function($0, $1, $2){
            var nrows = parseInt($1);
            var ncols = parseInt($2);
            var mtex = [];
            var aRow = new Array(ncols);
            for(var i=0; i<nrows; i++ ) {
                mtex.push(aRow.join(' & '));
            }
            return '\\begin{pmatrix} ' + mtex.join(' \\\\ ') + ' \\end{pmatrix}';
        });
        return ini;
    }

    var createQuillFromDataAttr = function($el, gid) {
        var qtype = $el.attr("data-mq"); 
        var ans = $el.attr("data-mq-ans");
        // If not ans then it cannot be checked, so.
        var ansType = 'ans';
        if(!ans) {
            ans = $el.attr("data-mq-anse");
            ansType = 'anse';
            if(!ans) {
                console.error("> MQ has no data-mq-ans/e!");
                return;
            }
        }
        // Support arrays in answers (always as str)
        ans = ans.trim();
        if(ans.startsWith('[') && ans.endsWith(']')) {
            ans = JSON.parse(ans); 
            for(var kk=0, lenkk=ans.length; kk<lenkk; kk++){
                ans[kk] = ''+ans[kk];
            }
        }
        var ini = processMqIni($el.attr("data-mq-ini"));
        var symbolsRaw = $el.attr("data-mq-symbols"); // a := valor; b := valor;  c := valor; 
    
        if(qtype === QTYPES.C && !ini ) {
            console.error("> MQ ", el, " is of type cloze but it has no data-mq-ini!");
            return;
        }
       
        var ra = '';
        if($el.attr("data-mq-ra")) {
            // Base64 conversion
            ra = atob($el.attr("data-mq-ra"));
        }
        var symbols = []
        if(symbolsRaw) { 
            var parts = symbolsRaw.split(";");
            for(var r=0, lenr=parts.length; r<lenr; r++) {
                var epart = parts[r];
                if(epart.trim()) {
                    symbols.push(epart.trim());
                }
            } 
        }
        var rulesRaw = $el.attr("data-mq-rules");
        var rules = [];
        if(rulesRaw) {
            rules = JSON.parse(rulesRaw);
        }

        var palettes = [];
        var palettesRaw = $el.attr("data-mq-palettes"); 
        if(palettesRaw) {
            var parts = palettesRaw.split(",");
            forEach(parts, function(i,e){
                palettes.push(e.trim());
            });  
        }

        var obj = {
            "editor": qtype,
            "symbols": symbols,
            "right_answer": ra,
            "initial_latex": ini,
            "rules": rules,
            "palettes": palettes
        };
        obj[ansType] = ans;
        if($el.attr("data-mq-formulation")) {
            obj.formulation = $el.attr("data-mq-formulation");
        }
        createQuillFromObject($el, gid, obj);
    };

    var createQuillFromObject = function($el, gid, obj) {
        var ansType = obj.ans? 'ans': 'anse';
        var created = null; 
        var qtype = obj.editor; 

        if(obj.formulation) {
            var spanEl = "<span>"+obj.formulation+"</span>";
            $el.append(spanEl);
            // Probably will have to process mathjax
            reflowLatex();
        }

        $el.removeClass("pygen-cloze");
        if(qtype == QTYPES.C) {
            // clozed input (replace ini with boxes) 
            created = new EditorCloze($el, gid, obj.initial_latex);
            created.qtype = QTYPES.C;
            $el.addClass("pygen-cloze");
        } else if(qtype == QTYPES.P) {
            // Full panel
            created = new EditorPanel($el, gid, true);
            created.qtype = QTYPES.P;
        } else if(qtype == QTYPES.M) {
            obj.symbols = obj.symbols || [];
            // Multiple choice combo 
            created = new MultipleChoiceCombo($el, gid, obj.symbols); 
            created.qtype = QTYPES.M;
        } else if(qtype == QTYPES.Ms) {
            obj.symbols = obj.symbols || [];
            // Multiple choice radio and checkbox
            // TODO support multiple answers
            var multipleAnswers = Array.isArray(obj.ans);
            //created = new MultipleChoiceCombo($el, gid, obj.symbols);
            created = new MultipleChoiceCheckbox($el, gid, obj.symbols, multipleAnswers);
            created.qtype = QTYPES.Ms;
        } else {
            // Simple or basic quill input
            created = new EditorInput($el, gid, qtype);
            created.qtype = QTYPES.S;
        }
        var qid = created.get_qid();   
        var groupContainer = shared[gid] || {};
        groupContainer[qid] = created; 
        created[ansType] = obj[ansType];

        created.status = STATUS.UNMODIFIED;
        if (obj.initial_latex && qtype != QTYPES.C) { 
            console.log("Setting initial_latex", obj.initial_latex);
            created.latex(obj.initial_latex);
            created.status = STATUS.MODIFIED;
        }
        created.setDefinition(obj);

        return qid;
    };


    var findQuills = function ($eg, gid) { 
        $eg.find("[data-mq]").each(function (i, el) {
            var $el = $(el);
            var qtype = $(el).attr("data-mq");  //s=simple, b=basic, p=panel, c=cloze (requires data-mq-ini)
            if(Object.values(QTYPES).indexOf(qtype) >= 0) {
                //create from data-attributes
                createQuillFromDataAttr($el, gid);
            } else {
                var json_raw = atob(qtype);
                var json_obj = JSON.parse(json_raw)
                createQuillFromObject($el, gid, json_obj);
            }
        });
    };

    var findQuillGroups = function (parent) {
        parent = parent || $('body');
        parent.find(".pw-mq-group").each(function (j, eg) {
            var $eg = $(eg);
            if($eg.hasClass("pw-mq-done")) {
                return;
            }
            //Prevent reprocessing
            $eg.addClass("pw-mq-done");
            var gid = $eg.attr("id");
            if (!gid) {
                gid = 'g_' + Math.random().toString(32).substring(2);
                $eg.attr("id", gid);
            } 
            shared[gid] = {};
            findQuills($eg, gid);
            var check_btn = createSubmitButtonForGroup(gid);
            $eg.append(check_btn);

            // solve problem of display by redrawing
            if(parent == null) {
                window.setTimeout(function(){
                    forEach(shared, function(gid, groupContainer){
                        forEach(groupContainer, function(qid, editor){
                            editor.reflow && editor.reflow();
                        });
                    });
                }, 500);
            }
        });
    };
 
    var LevelIndicator = function(numLevels) {
        this.numLevels = numLevels;
        this.container = $('<div style="display:inline-block;font-size:90%;" data-toggle="tooltip"></div>');
        this.levelIcons = [];
        for(var i=0; i<numLevels; i++) {
            var elem = $('<i class="fas fa-pepper-hot" style="color:lightgray;"></i>');
            this.container.append(elem);
            this.levelIcons.push(elem);
        }    
    };
    LevelIndicator.prototype = {
        setLevel: function(n) {
            if(n<0) {
                n = 0
            } else if(n > this.numLevels) {
                n = this.numLevels;
            }
            for(i=0; i<this.numLevels; i++) {
                if(i<n) {
                    this.levelIcons[i].css("color", "darkred");
                } else {
                    this.levelIcons[i].css("color", "lightgray");
                }
            }
            this.container.attr("data-original-title", "Nivell "+n);
            this.container.removeAttr("title");
        },
        setVisible: function(visible) {
            this.container.css("display", visible?"":"none");
        }
    };


    var SeqBasic = function(lpygens) {
        this.lpygens = lpygens;
    };
    SeqBasic.prototype = {
        next: function() {
            return this.lpygens[0];
        }
    };
    var SeqRandomWeighted = function(lpygens, definition) {
        definition = (definition || "random").trim().toLowerCase();
        this.definition = definition;
        var weights = [];
        if(definition.startsWith("weighted:")) {
            definition = definition.replace("weighted:","");
            var parts = definition.split(",");
            weights = map(parts, function(e){return parseFloat(e);});
        } else {
            //Assume equally distributed
            var vran = 1.0/lpygens.length;
            for(var i=0, len=lpygens.length; i<len; i++) {
                weights.push(vran);
            }
        }
        this.lpygens = lpygens;
        //fix the problem of wrong length
        if(this.lpygens.length > weights.length) {
            console.log("SeqRandomWeighted:: lpygens and weights have different length");
            while(this.lpygens != weights.length) {
                weights.push(1.0);
            }
        }
        while(weights.length > lpygens.length) {
            weights.pop();
        }
        //Normalize and aggregate weigths
        var total = sum(weights);
        var old = 0.0;
        forEach(weights, function(i, w) {
            w = w/total;
            old = w + old;
            weights[i] = old;
        });
        this.weights = weights;
    };

    SeqRandomWeighted.prototype = {
        next: function() {
            //Optimization
            if(this.definition == 'random') {
                var pos = Math.floor(Math.random()*this.lpygens.length);
                return this.lpygens[pos];
            }
            var rnd = Math.random();
            var pos = 0;
            var val = this.weights[pos];
            while(val < rnd) {
                pos += 1;
                val = this.weights[pos];
            }
            return this.lpygens[pos];
        }
    };

    var SeqSequence = function(lpygens, definition) {
        this.lpygens = lpygens;
        definition = definition.replace("sequence:","").trim().toLowerCase();
        this.positions = [];
        this.terminalGen = null;
        var placeholders = definition.split(",");
        var self = this;
        forEach(placeholders, function(i, e) {
            if(!isNaN(e) && self.terminalGen==null) {
                e = parseInt(e);
                for(var k=0; k<e; k++) {
                    self.positions.push(i);
                }
            } else if(e.startsWith('*') && self.terminalGen==null) {
                //all the remaining lpygens are *
                //Apply weights!!!!
                var remainingLpygens = lpygens.slice(i);
                var def2 = [];
                var isWeighted = false;
                for(var k=i; k<placeholders.length; k++) {
                    var e2 = placeholders[k];
                    if(e2.indexOf("*")>=0 && e2.indexOf("(")>0) {
                        e2 = e2.replace("*","").replace("(","").replace(")","");
                        def2.push(parseFloat(e2));
                        isWeighted = true;
                    } else {
                        def2.push(1);
                    }
                }

                var typeRan = "random";
                if(isWeighted) {
                    typeRan = "weighted: "+ def2.join(",");
                }
                self.terminalGen = new SeqRandomWeighted(remainingLpygens, typeRan);
            }
        });
        this.pointer = 0;
    };
    SeqSequence.prototype = {
        next: function() {
            if(this.pointer >= this.positions.length && this.terminalGen) {
                return this.terminalGen.next();
            }
            this.pointer = this.pointer % this.positions.length;
            var indx = this.positions[this.pointer];
            this.pointer += 1;
            return this.lpygens[indx];
        } 
    };

    var GoalChecker = function(category, rules) {
        this.category = category;
        this.rules = rules;
    };

    GoalChecker.prototype = {
        accomplished: function(value) {
            if(!HAS_IAPACE) {
                return false;
            }
            //getter
            if(value==null) {
                var frame = IB.iapace.find(this.category);
                if(frame == null) {
                    return false;
                }
                return frame.d; //done flag in tree
            }
            //setter
            var frame = IB.iapace.findCreate(this.category);
            frame.d = value;
            IB.iapace.save();
            return value;
        }, 
        reached: function() {
            if(!HAS_IAPACE) {
                return false;
            }
            if(this.accomplished()) {
                return false;
            }
            var frame = IB.iapace.findCreate(this.category);
            var reach = false;
            var nrules = this.rules.length;
            var i = 0;
            while(!reach && i < nrules) {
                var partial = true;
                var crule = this.rules[i];
                var undecided = 0;
                if(isNaN(crule[0])) {
                    undecided += 1;
                } else {
                    //Num. questions done on category
                    partial = partial & (frame.n >= parseInt(crule[0]));
                }
                if(isNaN(crule[1])) {
                    undecided += 1;
                } else {
                    //Average grade
                    var grade = 0.0;
                    if(frame.n > 0) {
                        grade = frame.s/(1.0*frame.n);
                    }
                    partial = partial & (grade >= parseFloat(crule[1]));
                }
                if(isNaN(crule[2])) {
                    undecided += 1;
                } else {
                    //current level
                    partial = partial & (IB.iapace.inference(this.category) >= parseInt(crule[2]));
                }
                if(undecided < 3) {
                    reach = partial;
                }
                i+=1;
            }
            if(reach) {
                this.accomplished(true);
            }
            return reach;
        }
    };

    var findPyGenerators = function () {
        $("div[data-pygen]").each(function (j, eg) { 
            var $eg = $(eg);
            $eg.css({
                "position": "relative",
                "min-height": "300px",
                "background-color": "#ffffff",
                "background-image": 'url("https://piworld.es/iedib/matheditor/backgrounds/triangles.svg")',
                "background-position": "center",
                "background-size": "cover"
            }); 
            $eg.html(''); //clear the container  
            var gid = $eg.attr("id");
            if (!gid) {
                gid = 'pyg_' + Math.random().toString(32).substring(2);
                $eg.attr("id", gid);
            } 
            shared[gid] = {};  //This container will contain the instance of the qid in every screen
            // Create the layout of this container
            // Shoud have a top banner for level and message
            // central panel for qüestion and displaying the mathinput
            // bottom panel for control buttons
            var topPanel = $('<div style="display:flex;flex-direction:row-reverse;align-items:baseline;"></div>');
            var centralPanel = $("<div></div>");
            var bottomPanel = $('<div style="display: flex; flex-direction: row; align-content: flex-start;margin:10px 0; flex-wrap: wrap; gap: 5px;margin-bottom:30px;"></div>'); 
            var copyrightPanel = $('<div style="position: absolute;left: 0;right: 0;bottom: 0;margin: 0;background-color: #9fa0ac; display: flex; flex-direction: row; align-content: flex-start; flex-wrap: wrap; gap: 5px;"></div>');
            var levelIndicator = new LevelIndicator(4);
           
            var category = $eg.attr("data-pygen-category") || "general";  //category to check the level of the student
            
            //Only show the indicator if data-category is set
            levelIndicator.setVisible(HAS_IAPACE && $eg.attr("data-pygen-category")!=null);
            topPanel.append(levelIndicator.container);
             
            //try to find the category in iapace (only if available)
            var currentLevel = 1;
            if(HAS_IAPACE) {
                currentLevel = IB.iapace.inference(category);    
            }
            levelIndicator.setLevel(currentLevel);

            //Goal checker
            var goalChecker = null;
            if(HAS_IAPACE && $eg.attr("data-pygen-goal")!=null) {
                var goalRules = $eg.attr("data-pygen-goal").split(";");
                goalRules = map(goalRules, function(e){return e.split(",");});
                goalChecker = new GoalChecker(category, goalRules);
                if(goalChecker.accomplished()){
                    //Indicator that the goal is already reached
                    topPanel.append($('<span class="pw-goal-reached">Repte aconseguit! </span>'));
                }
            }


            // Format "name.of.generador.function1;name.of.generator.function2[param1=a, param2='b', param3='c'];···"
            var rawDataPygens = $eg.attr('data-pygen').split(';');
            var dataPygen = [];
            for(var z=0, lenz=rawDataPygens.length; z < lenz; z++) {
                var genpart = rawDataPygens[z];
                var genname = null;
                var genparams = {};
                if(genpart.indexOf('[') > 0) {
                    var genname = genpart.split('[')[0].trim();
                    var paramspart = genpart.split('[')[1].replace(']', '').split(',');
                    for(var t=0, lent=paramspart.length; t<lent; t++) {
                        var aparm = paramspart[t];
                        if(aparm.indexOf("=")>0){
                            var param_parts = aparm.split("=");
                            var key = param_parts[0];
                            var value = param_parts[1];
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
            var sequenciador = null;
            if(dataPygen.length > 1) {
                // Yes
                var order = ($eg.attr("data-pygen-order") || "random").trim().toLowerCase();
                if(order.startsWith("random") || order.startsWith("weighted")) {
                    sequenciador = new SeqRandomWeighted(dataPygen, order);
                } else if(order.startsWith("sequence")) {
                    sequenciador = new SeqSequence(dataPygen, order);
                } 
            } 
            sequenciador = sequenciador || new SeqBasic(dataPygen);


            // Check this question
            
            var checkBtn = $('<button class="btn btn-sm btn-primary"><i class="fas fa-check"></i> Comprova</button>');
            var comodiBtn = $('<button class="btn btn-sm btn-warning" style="display:none;"><i class="far fa-life-ring"></i> Comodí 50%</button>');
           
            var currentDatos = null;
            var currentEditor = null;

            var createDynamicMathquill = function() {
                checkBtn.prop("disabled", true);
                nextButton.prop("disabled", true);
                showmeBtn.prop("disabled", true);
                comodiBtn.css("display", "none");
                // Dynamically generate the level here!
                if(HAS_IAPACE) {
                    currentLevel = IB.iapace.inference(category);    
                } else {
                    //TODO
                }
                console.log("xivat", category, currentLevel);
                levelIndicator.setLevel(currentLevel);
                var nextGenerator = sequenciador.next();
                $.ajax({
                    type: "POST",
                    url: PYGEN_URL,
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
                        var pregunta = $('<p><span>'+( $eg.attr('data-pygen-formulation') || '')+'</span> '+ datos.formulation+'</p>');
                        centralPanel.append(pregunta);
                        //TODO: How to create the input widget eficienty 
                        //var dynEl = $('<span data-mq="'+ datos.mq64 +'"></span>');
                        //$eg.append(dynEl);
                        var json_raw = atob(datos.mq64);
                        var json_obj = JSON.parse(json_raw);
                        //check if contains a comodi 
                        //TODO: decide if can use the comodi based on performance
                        if(HAS_IAPACE) {
                            var frame = IB.iapace.findCreate(category);
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
                        if(json_obj.editor == QTYPES.M) {
                            json_obj.editor = QTYPES.Ms;
                        }
                        currentDatos = json_obj;
                        if(json_obj.initial_latex) {
                            json_obj.initial_latex = processMqIni(json_obj.initial_latex);
                        }

                        var symbols = []
                        if(json_obj.symbols) { 
                            var parts = json_obj.symbols.split(";");
                            for(var r=0, lenr=parts.length; r<lenr; r++) {
                                var epart = parts[r];
                                if(epart.trim()) {
                                    symbols.push(epart.trim());
                                }
                            } 
                        } 
                        json_obj.symbols = symbols;
                        var rules = [];
                        if(json_obj.rules) {
                            rules = JSON.parse(json_obj.rules);
                        }
                        json_obj.rules = rules;
                        // It should obtain category from here?
                        console.log(json_obj);
                        
                        var qid = createQuillFromObject(centralPanel, gid, json_obj); 
                        currentEditor = shared[gid][qid];
                        currentEditor.isPigen = true;  //Marker that is dynamically generated for pigen
                        //TODO can support many quills
                        checkBtn.off();
                        var extraActions = function(score10) {
                            nextButton.prop("disabled", false);
                            showmeBtn.prop("disabled", false);
                            if(HAS_IAPACE) {
                                window.IB.iapace.addScore(category, score10);
                                window.IB.iapace.save(); //Persistent storage
                            }
                            //TODO lunch confetti if succeded
                            if(goalChecker && goalChecker.reached()) {
                                if(topPanel.find(".pw-goal-reached").length==0) {
                                    topPanel.append($('<span class="pw-goal-reached">Repte aconseguit! </span>'));
                                }
                                //celebration?
                                if($eg.attr("data-pygen-celebration")=='confetti' && window.Confetti) {
                                    var c = new Confetti($eg[0]);
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
                        centralPanel.html('<p style="color:darkred">ERROR<br>'+JSON.stringify(datos)+'</p>');
                        nextButton.prop("disabled", false);
                    }
                });
            };

             // Reveal answer to this question
             var showmeBtn = $('<button class="btn btn-sm btn-outline-info" title="Mostra la resposta"><i class="fas fa-question-circle"></i> Solució</button>');
             showmeBtn.on('click', function(ev){
                 ev.preventDefault();
                 if( !currentEditor ) {
                    console.error("Missing currentEditor here :-(");
                    return;
                 }
                 if(currentEditor.status!=STATUS.CORRECT && currentEditor.wrong_attemps < 1) {
                     console.log("can't show answer yet", currentEditor);
                     return;
                 } 
                 checkBtn.prop("disabled", true);
                 console.log(currentEditor)
                 currentEditor.showAnswer && currentEditor.showAnswer(); 
             });

            // Skip this question
            var nextButton = $('<button class="btn btn-sm btn-outline-primary" title="Genera una nova pregunta"><i class="fas fa-arrow-circle-right"></i> Següent</button>');
            nextButton.on('click', function(ev){
                ev.preventDefault();  
                // Remove existing widgets from this gid
                var keys = Object.keys(shared[gid] || {});
                for(var i=0, lin=keys.length; i<lin; i++) {
                    shared[gid][keys[i]].dispose();
                    delete shared[gid][keys[i]];
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
                currentEditor.status = STATUS.MODIFIED;
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
                var ccSpan = $('<span style="padding:4px;font-size:70%;color:whitesmoke;"><em>pyQuizz</em> by Josep Mulet (c) 2021-22</span>')
                copyrightPanel.append(ccSpan);
                $eg.append(copyrightPanel);
            } 

            createDynamicMathquill();
        });
    };

    scriptMQ.addEventListener("load", function (event) {
        shared.MQ = MathQuill.getInterface(2);
        findQuillGroups();  // Groups of quills
        findPyGenerators(); // An interface for dynamic generated questions
    });


})();