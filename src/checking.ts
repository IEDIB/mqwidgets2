const regexMatrices = /\\begin{pmatrix}(.*?)\\end{pmatrix}/g;
export function extractMatrices(tex: string) {
    const matrices = [];
    let m = null;
    while((m = regexMatrices.exec(tex)) !== null) {
        const mat: any = [];
        const linies = m[1].split('\\\\');
        linies.forEach(function(alinia) { 
            const linia = alinia.split('&');
            mat.push(linia);
        });
        matrices.push(mat);
    }
    return matrices;
};

const has_empty_elements = function(matrix: any) {
    const rows = matrix.length;
    for(let i=0; i<rows; i++) {
        const arow = matrix[i];
        const cols = arow.length;
        for(let j=0; j<cols; j++) {
            if(!arow[j]) {
                return true;
            }
        }
    }
    return false;
};

export function has_empty_answers(v: string[]) {
    for(let i =0, len=v.length; i<len; i++ ) {
        const tex = v[i];
        if(tex == '' || (tex && !tex.trim())) {
            return true;
        }
        // a matrix with empty answers
        const matrices = extractMatrices(tex);
        for(let j=0, lenmat=matrices.length; j<lenmat; j++) {
            if(has_empty_elements(matrices[j])) {
                return true;
            }
        }
    }
    return false;
};
