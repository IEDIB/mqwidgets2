
const default_toolbar_buttons = ['fraction', 'square_root', 'cube_root', 'root', 'superscript', 'subscript', 'multiplication', 'division', 'plus_minus', 'pi', 'degree', 'not_equal', 'greater_equal', 'less_equal', 'greater_than', 'less_than', 'angle', 'parallel_to', 'perpendicular', 'triangle', 'parallelogram', 'round_brackets', 'matrix2', 'matrix3'];
const default_toolbar_tabs = ["General", "Símbols", "Geometria", "Intervals"];
const button_meta = {
    //TAB1
    "Multiplicació": { latex: "\\times", tab: 1, icon: '\\times' },
    "Fracció": { latex: "\\frac{}{}", moveto: "Up", movefor: 1, tab: 1, icon: '\\frac{\\square}{\\square}' },
    "Exponent": { latex: "\\^{}", moveto: "Up", movefor: 1, tab: 1, icon: '\\square^2' },
    "Parèntesis": { latex: "\\left(\\right)", moveto: "Left", movefor: 1, tab: 1, icon: '\\left(\\square\\right)' },
    "Arrel quadrada": { latex: "\\sqrt{}", moveto: "Left", movefor: 1, tab: 1, icon: '\\sqrt{\\square}' },
    "Arrel cúbica": { latex: "\\sqrt[3]{}", moveto: "Left", movefor: 1, tab: 1, icon: '\\sqrt[3]{\\square}' },
    "Radical": { latex: "\\sqrt[{}]{}", moveto: "Left", movefor: 2, tab: 1, icon: '\\sqrt[\\square]{\\square}' },
    "Matriu 2x2": { latex: "\\begin{pmatrix} & \\\\ & \\end{pmatrix}", tab: 1, icon: 'M_{2\\times 2}' },
    "Matriu 3x3": { latex: "\\begin{pmatrix} & & \\\\ & &  \\\\ & & \\end{pmatrix}", tab: 1, icon: 'M_{3\\times 3}' },
    "Matriu mxn": {
        latex: function (vars: {[name:string]: number}) {
            const lat = [];
            for (let i = 0; i < vars.n; i++) {
                const latrow = [];
                for (let j = 0; j < vars.m; j++) {
                    latrow.push(" ");
                }
                lat.push(latrow.join("&"))
            }
            return "\\begin{pmatrix} " + lat.join("\\\\") + " \\end{pmatrix}";
        }, tab: 1, icon: 'M_{n\\times m}', vars: [{ name: 'n', type: 'number', min: 1, val: 2 }, { name: 'm', type: 'number', min: 1, val: 2 }]
    },
    "Subíndex": { latex: "\\_{}", moveto: "Down", movefor: 1, tab: 1, icon: '\\square_{2}' },

    //TAB2 - símbols i constants
    "pi": { latex: "\\pi", tab: 2, icon: '\\pi' },
    "e": { latex: "\\e", tab: 2, icon: '\\e' },
    "infinit": { latex: "\\infty", tab: 2, icon: '\\infty' },
    "Més menys": { latex: "\\pm", tab: 2, icon: '\\pm' },
    "Diferent": { latex: "\\neq", tab: 2, icon: '\\neq' },
    "Major o igual": { latex: "\\geq", tab: 2, icon: '\\geq' },
    "Menor o igual": { latex: "\\leq", tab: 2, icon: '\\leq' },
    "Major que": { latex: "\\gt", tab: 2, icon: '\\gt' },
    "Menor que": { latex: "\\lt", tab: 2, icon: '\\lt' },


    //TAB3 - geometria
    "Graus": { latex: "\\degree", tab: 3, icon: '\\degree' },
    "Angle": { latex: "\\angle", tab: 3, icon: '\\angle' },
    "Paral·lel a": { latex: "\\parallel", tab: 3, icon: '\\parallel' },
    "Perpendicular a": { latex: "\\perpendicular", tab: 3, icon: '\\perpendicular' },
    "Triangle": { latex: "\\triangle", tab: 3, icon: '\\triangle' },
    "Paral·lelogram": { latex: "\\parallelogram", tab: 3, icon: '\\parallelogram' },

    //TAB4 - intervals
    "Interval obert": { latex: "\\left( , \\right)", moveto: "Left", movefor: 2, tab: 4, icon: '\\left(\\square, \\square\\right)' },
    "Interval tancat": { latex: "\\left[ , \\right]", moveto: "Left", movefor: 2, tab: 4, icon: '\\left[\\square, \\square\\right]' },
    "Interval semi1": { latex: "\\left[ , \\right)", moveto: "Left", movefor: 2, tab: 4, icon: '\\left[\\square, \\square\\right)' },
    "Interval semi2": { latex: "\\left( , \\right]", moveto: "Left", movefor: 2, tab: 4, icon: '\\left(\\square, \\square\\right]' },
    "Infinit": { latex: "\\infty", tab: 4, icon: '\\infty' },
    "Conjunt dels reals": { latex: "\\mathbb{R}", tab: 4, icon: '\\mathbb{R}' },
};
const keyboard_keys = {
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

export default {
    default_toolbar_buttons,
    default_toolbar_tabs,
    button_meta,
    keyboard_keys
}
