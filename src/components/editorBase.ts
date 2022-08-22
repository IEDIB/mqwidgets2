import { cfg } from "../globals";
import { MQDefinition, QuestionType } from "../types";
import { EditorTAD } from "./editorTAD";

export abstract class EditorBase implements Partial<EditorTAD> {
    parent: JQuery<HTMLDivElement>
    gid: string; 
    def?: MQDefinition;
    status: number; 
    wrong_attemps: number;
    answerShown: boolean
    qtype?: QuestionType;
    ansType: any;

    constructor(parent: JQuery<HTMLDivElement>, gid: string) {
        this.parent = parent
        this.gid = gid
        this.status = cfg.STATUS.UNMODIFIED
        this.wrong_attemps = 0
        this.answerShown = false
    }

    get_gid(): string {
        return this.gid
    }
    
    setDefinition(def: MQDefinition): void {
        this.def = def
        this.ansType = def.ansType;
    }

    increment_wrong() {
        this.wrong_attemps += 1;
    }

    setStatus(status: number): void {
        this.status = status
    }

    setQtype(qtype: QuestionType): void {
        this.qtype = qtype
    }
}