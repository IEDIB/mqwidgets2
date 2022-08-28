const pmatrix_re = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/gm;
let mcount = 0
// Convert a \begin{pmatrix} a & b \\ c & d \end{pmatrix} in to nermader matrix([a,b],[c,d]) 
function parse_pmatrix(latex: string): string { 
    latex = latex.replace("\\begin{pmatrix}", "").replace("\\end{pmatrix}", "")
    const rows = latex.split("\\\\").map( (row) => {
        const cols = row.split("&").map( (col)=> col.trim()) 
        return '['+ cols.join(',') +']'
    })
    const out = 'matrix(' + rows.join(',') + ')'    
    const varName = 'M_'+mcount
    window.nerdamer.setVar(varName, out) 
    mcount++
    return varName
}


export function parseLatex(tex: string): string {
    // Treat matrices
    tex = tex.replace(pmatrix_re, function($0, $1) { 
        return parse_pmatrix($0)
    }) 
    return window.nerdamer.convertFromLaTeX(tex)
}