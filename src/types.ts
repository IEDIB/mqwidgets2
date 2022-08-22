export interface IedibAPIStruct {
    getPageInfo: Function
}

export interface IBStruct {
    iapace?: any
}

/**
 * Interace to Mathquill instance
 * https://raw.githubusercontent.com/trevorhanus/mathquill-types/master/index.d.ts
 */
 
 export declare namespace MQ {
 
     export interface IMathFieldConfig {
         spaceBehavesLikeTab?: boolean;
         leftRightIntoCmdGoes?: 'up' | 'down';
         restrictMismatchedBrackets?: boolean;
         sumStartsWithNEquals?: boolean;
         supSubsRequireOperand?: boolean;
         charsThatBreakOutOfSupSub?: string;
         autoSubscriptNumerals?: boolean;
         autoCommands?: string;
         autoOperatorNames?: string;
         substituteTextarea?: () => void;
         handlers?: {
             deleteOutOf?: (direction: Direction, mathField: MathField) => void;
             moveOutOf?: (direction: Direction, mathField: MathField) => void;
             selectOutOf?: (direction: Direction, mathField: MathField) => void;
             downOutOf?: (mathField: MathField) => void;
             upOutOf?: (mathField: MathField) => void;
             edit?: (mathField: MathField) => void;
             enter?: (mathField: MathField) => void;
         }
     }
 
     export enum Direction {
         R,
         L,
     }

     export interface InnerFieldController {
        textarea: JQuery<HTMLTextAreaElement>
     }

     export interface InnerField {
        latex(latex: string): void,
        latex(): string,
        __controller: InnerFieldController
     }
 
     export interface MathField {
         id: any;
         innerFields: InnerField[];
         revert(): void;
         reflow(): void;
         el(): HTMLElement;
         latex(): string;
         latex(latexString: string): void;
         focus(): void;
         blur(): void;
         write(latex: string): void;
         cmd(latexString: string): void;
         select(): void;
         clearSelection(): void;
         moveToLeftEnd(): void;
         moveToRightEnd(): void;
         keystroke(keys: string): void;
         typedText(text: string): void;
         config(newConfig: IMathFieldConfig): void;
     }
 
     export class MathQuill {
         MathField(div: HTMLElement, config: IMathFieldConfig): MathField;
     }
 }


 export type QuestionType = 'basic' | 'simple' | 'cloze' | 'mchoice' | 'mchoice*' | 'panel'


/**
 * Definition of a data-mq structure
*/
export interface MQRules {
    factor: boolean,
    expanded: boolean,
    precision: number,
    comma_as_decimal: boolean 
}

export interface MQDefinition {
    editor: string,
    symbols: string[],
    right_answer: string,
    initial_latex: string,
    rules: MQRules,
    palettes: string[],
    formulation?: string,
    ansType?: string,
    ans?: string,
    anse?: string
}

/**
 * A generic dictionary type with string keys
 */
export type DictStrKeys = { [name: string]: any}

