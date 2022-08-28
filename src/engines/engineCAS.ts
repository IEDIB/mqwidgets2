import { cfg } from "../globals"
import { nerdamerCAS } from "./nerdamerCAS"
import { sympyCAS } from "./sympyCAS"

// Decide which engine to use based on global cfg and the current payload
export const engineCAS = {
    compare(payload: any): Promise<any> { 
        const engine = payload.engine || cfg.DEFAULT_ENGINE
        if(engine === 'sympy') {
            return sympyCAS.compare(payload)
        }
        return nerdamerCAS.compare(payload)
    },
    getAnswer(payload: any): Promise<any> { 
        const engine = payload.engine || cfg.DEFAULT_ENGINE
        if(engine === 'sympy') {
            return sympyCAS.getAnswer(payload)
        }
        return nerdamerCAS.getAnswer(payload)
    }
}