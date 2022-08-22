import { cfg } from "../globals";
import { MQDefinition, QuestionType } from "../types";
import { EditorTAD } from "./editorTAD";

export abstract class EditorBase implements Partial<EditorTAD> {
    parent: JQuery<HTMLDivElement>
    gid: string; 
    def: MQDefinition;
    status: number; 
    wrong_attemps: number;
    isAnswerShown: boolean
    qtype: QuestionType;
    ansType: any;
    pigen: boolean;
    comodi: boolean;
    hash: string;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, def: MQDefinition, qtype: QuestionType) {
        this.parent = parent
        this.gid = gid
        this.status = cfg.STATUS.UNMODIFIED
        this.wrong_attemps = 0
        this.isAnswerShown = false
        this.def = def
        this.qtype = qtype
        this.pigen = false
        this.comodi = false
        this.hash = ''
    }

    get_gid(): string {
        return this.gid
    }
    
    setDefinition(def: MQDefinition): void {
        this.def = def
        this.ansType = def.ansType;
    }

    getDefinition(): MQDefinition {
        return this.def
    }

    increment_wrong() {
        this.wrong_attemps += 1;
    }
    
    getWrong_attemps() {
        return this.wrong_attemps
    }

    getStatus(): number {
        return this.status
    }

    setStatus(status: number): void {
        this.status = status
    }

    getQType(): QuestionType {
        return this.qtype
    }

    setQType(qtype: QuestionType): void {
        this.qtype = qtype
    }

    isPigen(): boolean {
        return this.pigen
    }

    setPigen(pigen: boolean): void {
        this.pigen = pigen 
    }

    isComodiUsed(): boolean {
        return this.comodi
    }

    setComodiUsed(comodi: boolean): void {
        this.comodi = comodi
    }

    getHash(): string {
        return this.hash
    }

    setHash(hash: string): void {
        this.hash = hash
    }
}