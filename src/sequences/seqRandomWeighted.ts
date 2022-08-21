import { sum } from "../utils";
import { SeqBasic } from "./seqBasic";

export class SeqRandomWeighted extends SeqBasic {
    definition: any;
    weights: any;

    constructor(lpygens: any[], definition: any) {
        super(lpygens)
        definition = (definition || "random").trim().toLowerCase();
        this.definition = definition;
        let weights = [];
        if (definition.startsWith("weighted:")) {
            definition = definition.replace("weighted:", "");
            const parts = definition.split(",");
            weights = parts.map(function (e: any) { return parseFloat(e); });
        } else {
            //Assume equally distributed
            const vran = 1.0 / lpygens.length;
            for (let i = 0, len = lpygens.length; i < len; i++) {
                weights.push(vran);
            }
        }
        this.lpygens = lpygens;
        //fix the problem of wrong length
        if (this.lpygens.length > weights.length) {
            console.log("SeqRandomWeighted:: lpygens and weights have different length");
            while (this.lpygens != weights.length) {
                weights.push(1.0);
            }
        }
        while (weights.length > lpygens.length) {
            weights.pop();
        }
        //Normalize and aggregate weigths
        const total = sum(weights);
        let old = 0.0;
        weights.forEach(function (w: number, i: number) {
            w = w / total;
            old = w + old;
            weights[i] = old;
        });
        this.weights = weights;
    };

    next() {
        //Optimization
        if (this.definition == 'random') {
            const pos = Math.floor(Math.random() * this.lpygens.length);
            return this.lpygens[pos];
        }
        const rnd = Math.random();
        let pos = 0;
        let val = this.weights[pos];
        while (val < rnd) {
            pos += 1;
            val = this.weights[pos];
        }
        return this.lpygens[pos];
    }

} 
