import { MQDefinition, QuestionType } from "../types";

export interface EditorTAD {
    setQtype(t: QuestionType): void,
    setStatus(s: number): void,
    clear(): void,
    focus(): void,
    latex(tex?: string): string[],
    checkMsg(status:number, msg: string): void,
    get_qid(): number,
    get_gid(): string,
    dispose(): void,
    reflow(): void,
    setDefinition(def: MQDefinition): void,
    increment_wrong(): void
}