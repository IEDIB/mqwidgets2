import { applyPolyfills } from './polyfills';
import { cfg, loadPageInfo } from './globals'
import { createLinkSheet, insertScript } from "./utils";

applyPolyfills()

const onLoad = function() {
    loadPageInfo()
    //1. find all div.mq-group
    //2. process all ...
}

// Inject required dependencies on the page
// On jquery ready
$(function() {
    createLinkSheet(cfg.BASE_URL + "/lib/mathquill.matrix.css");
    //check if iedibAPI is in page
    if(window.iedibAPI) {
        insertScript(cfg.BASE_URL + "/lib/mathquill.matrix.min.js", onLoad);
    } else {
        insertScript('https://piworld.es/iedib/assets/iedib-api.js',
            function() {
                insertScript(cfg.BASE_URL + "/lib/mathquill.matrix.min.js", onLoad)
            }
        );
    }
});