import { cfg } from "../globals";
import { EngineCAS } from "../types";

class SympyCAS implements EngineCAS {

    compare(payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: cfg.CAS_URL,
                data: JSON.stringify(payload),
                dataType: 'json',
                success: function (datos) {
                    resolve(datos)
                },
                error: function (datos) {
                    reject(datos)
                }
            });
        })
    }

    getAnswer(payload: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: cfg.GETANSWER_URL,
                data: JSON.stringify(payload),
                dataType: 'json',
                success: function (datos) {
                    resolve(datos)
                },
                error: function(datos) {
                    reject(datos)
                }
            });
        })
    }

}

export const sympyCAS = new SympyCAS()