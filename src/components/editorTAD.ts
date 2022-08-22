import { MQDefinition, QuestionType } from "../types";

export interface EditorTAD {
    showAnswer(): void,
    isPigen(): boolean,
    setPigen(pigen: boolean): void,
    getQType(): QuestionType,
    setQType(t: QuestionType): void,
    isComodiUsed(): boolean,
    setComodiUsed(comodi: boolean): void,
    getHash(): string,
    setHash(hash: string): void,
    setStatus(s: number): void,
    getStatus(): number, 
    clear(): void,
    focus(): void,
    latex(tex?: string): string[],
    checkMsg(status:number, msg: string): void,
    get_qid(): number,
    get_gid(): string,
    dispose(): void,
    reflow(): void,
    setDefinition(def: MQDefinition): void,
    getDefinition(): MQDefinition,
    increment_wrong(): void,
    getWrong_attemps(): number
}