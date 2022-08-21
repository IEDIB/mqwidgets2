export class SeqBasic {
    lpygens: any[];
    
    constructor(lpygens: any[]) {
        this.lpygens = lpygens;
    }

    next() {
        return this.lpygens[0];
    }
}