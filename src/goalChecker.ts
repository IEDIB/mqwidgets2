import { cfg } from "./globals";

export class GoalChecker {
    category: string;
    rules: any;

    constructor(category: string, rules: any) {
        this.category = category;
        this.rules = rules;
    }

    accomplished(value?: boolean) {
        const IB = window["IB"] || {};
        if(!cfg.HAS_IAPACE) {
            return false;
        }
        //getter
        if(!value) {
            const frame = IB.iapace.find(this.category);
            if(frame == null) {
                return false;
            }
            return frame.d; //done flag in tree
        }
        //setter
        const frame = IB.iapace.findCreate(this.category);
        frame.d = value;
        IB.iapace.save();
        return value;
    }

    reached() {
        const IB = window["IB"] || {};
        if(!cfg.HAS_IAPACE) {
            return false;
        }
        if(this.accomplished()) {
            return false;
        }
        const frame = IB.iapace.findCreate(this.category);
        let reach = false;
        const nrules = this.rules.length;
        let i = 0;
        while(!reach && i < nrules) {
            let partial = true;
            const crule = this.rules[i];
            let undecided = 0;
            if(isNaN(crule[0])) {
                undecided += 1;
            } else {
                //Num. questions done on category
                partial = partial && (frame.n >= parseInt(crule[0]));
            }
            if(isNaN(crule[1])) {
                undecided += 1;
            } else {
                //Average grade
                let grade = 0.0;
                if(frame.n > 0) {
                    grade = frame.s/(1.0*frame.n);
                }
                partial = partial && (grade >= parseFloat(crule[1]));
            }
            if(isNaN(crule[2])) {
                undecided += 1;
            } else {
                //current level
                partial = partial && (IB.iapace.inference(this.category) >= parseInt(crule[2]));
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
 
  
}