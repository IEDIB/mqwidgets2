import { createQuillFromObject } from "./createQuill";
import { cfg } from "./globals";
import { MQDefinition } from "./types";

export function processMqIni(ini?: string) {
    ini = ini || '';
    ini = ini.replace(/\?\d*?/g, '\\MathQuillMathField{}');
    ini = ini.replace(/M\[(\d+)x(\d+)\]/g, function ($0, $1, $2) {
        const nrows = parseInt($1);
        const ncols = parseInt($2);
        const mtex = [];
        const aRow = new Array(ncols);
        for (let i = 0; i < nrows; i++) {
            mtex.push(aRow.join(' & '));
        }
        return '\\begin{pmatrix} ' + mtex.join(' \\\\ ') + ' \\end{pmatrix}';
    });
    return ini;
}

export function createQuillFromDataAttr($el: JQuery<HTMLDivElement>, gid: string) {
    const qtype = $el.attr("data-mq") || 'simple';
    const engine = $el.attr("data-mq-engine");
    let ans: any = $el.attr("data-mq-ans");
    // If not ans then it cannot be checked, so.
    let ansType = 'ans';
    if (!ans) {
        ans = $el.attr("data-mq-anse");
        ansType = 'anse';
        if (!ans) {
            console.error("> MQ has no data-mq-ans/e!");
            return;
        }
    }
    // Support arrays in answers (always as str)
    ans = ans.trim();
    if (ans.startsWith('[') && ans.endsWith(']')) {
        ans = JSON.parse(ans);
        for (let kk = 0, lenkk = ans.length; kk < lenkk; kk++) {
            ans[kk] = '' + ans[kk];
        }
    }
    const ini = processMqIni($el.attr("data-mq-ini"));
    const symbolsRaw = $el.attr("data-mq-symbols"); // a := valor; b := valor;  c := valor; 

    if (qtype === cfg.QTYPES.C && !ini) {
        console.error("> MQ ", $el, " is of type cloze but it has no data-mq-ini!");
        return;
    }

    let ra = '';
    if ($el.attr("data-mq-ra")) {
        // Base64 conversion
        ra = atob($el.attr("data-mq-ra") || '');
    }
    const symbols = []
    if (symbolsRaw) {
        const parts = symbolsRaw.split(";");
        for (let r = 0, lenr = parts.length; r < lenr; r++) {
            const epart = parts[r];
            if (epart.trim()) {
                symbols.push(epart.trim());
            }
        }
    }
    const rulesRaw = $el.attr("data-mq-rules");
    let rules = [];
    if (rulesRaw) {
        rules = JSON.parse(rulesRaw);
    }

    let palettes: string[] = [];
    const palettesRaw = $el.attr("data-mq-palettes");
    if (palettesRaw) {
        const parts = palettesRaw.split(",");
        parts.forEach(function (e) {
            palettes.push(e.trim());
        });
    }

    const obj: MQDefinition = {
        engine: engine,
        editor: qtype,
        symbols: symbols,
        right_answer: ra,
        initial_latex: ini,
        rules: rules,
        palettes: palettes,
        ans: ans,
        ansType: ansType
    };
    if ($el.attr("data-mq-formulation")) {
        obj.formulation = $el.attr("data-mq-formulation");
    }
    createQuillFromObject($el, gid, obj);
};