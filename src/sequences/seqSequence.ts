import { isNumeric } from "../utils";
import { SeqBasic } from "./seqBasic";
import { SeqRandomWeighted } from "./seqRandomWeighted";

export class SeqSequence extends SeqBasic {
    positions: number[];
    terminalGen: SeqRandomWeighted | undefined;
    pointer: number;

    constructor(lpygens: any[], definition: string) {
        super(lpygens)
        this.lpygens = lpygens;
        definition = definition.replace("sequence:", "").trim().toLowerCase();
        this.positions = [];
        this.terminalGen = undefined;
        const placeholders = definition.split(",");
        const self = this;

        placeholders.forEach(function (p: string, i: number) {
            if (isNumeric(p) && self.terminalGen == null) {
                const e = parseInt(p)
                for (let k = 0; k < e; k++) {
                    self.positions.push(i);
                }
            } else if (p.startsWith('*') && self.terminalGen == null) {
                //all the remaining lpygens are *
                //Apply weights!!!!
                const remainingLpygens = lpygens.slice(i);
                const def2 = [];
                let isWeighted = false;
                for (let k = i; k < placeholders.length; k++) {
                    let e2 = placeholders[k];
                    if (e2.indexOf("*") >= 0 && e2.indexOf("(") > 0) {
                        e2 = e2.replace("*", "").replace("(", "").replace(")", "");
                        def2.push(parseFloat(e2));
                        isWeighted = true;
                    } else {
                        def2.push(1);
                    }
                }

                let typeRan = "random";
                if (isWeighted) {
                    typeRan = "weighted: " + def2.join(",");
                }
                self.terminalGen = new SeqRandomWeighted(remainingLpygens, typeRan);
            }
        });
        this.pointer = 0;
    };

    next() {
        if (this.pointer >= this.positions.length && this.terminalGen) {
            return this.terminalGen.next();
        }
        this.pointer = this.pointer % this.positions.length;
        const indx = this.positions[this.pointer];
        this.pointer += 1;
        return this.lpygens[indx];
    }
}
