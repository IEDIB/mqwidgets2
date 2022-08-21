import { applyPolyfills } from './polyfills';
import { cfg, loadPageInfo, shared } from './globals'
import { createLinkSheet, insertScript } from "./utils"; 
import { findQuillGroups } from './mqfy';
import { findPyGenerators } from './findPyGenerators';

applyPolyfills()

const onLoad = function() {
    loadPageInfo()
    shared.MQ = window.MathQuill.getInterface(2);
    findQuillGroups();  // Groups of quills
    findPyGenerators(); // An interface for dynamic generated questions
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