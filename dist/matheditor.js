/**
     * Creates a basic dialog which can be extended for further functionality
     * @param {*} title
     * @param {*} width
     * @param {*} height
*/
System.register("dialog", [], function (exports_1, context_1) {
    "use strict";
    var PwDialog;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            PwDialog = /** @class */ (function () {
                function PwDialog(title, width, height) {
                    this.id = "pwdlg_" + Math.random().toString(32).substring(2);
                    this.window = $('<div id="' + this.id + '" class="pw-me-dlg" style="width:' + width + 'px;height:' + height + 'px;display:none;"></div>');
                    var topBar = $('<div class="pw-me-dlg-header"></div>');
                    this.topBar = topBar;
                    var headerTitle = $('<span class="pw-me-dlg-headertitle">' + title + '</span>');
                    this.closeBtn = $('<button class="btn btn-sm pw-me-btn-dlgclose" title="Tancar"><i class="fas fa-times"></i></button>');
                    var self = this;
                    this.closeBtn.on("click", function (ev) {
                        ev.preventDefault();
                        self.window.css("display", "none");
                    });
                    topBar.append(headerTitle);
                    topBar.append(this.closeBtn);
                    this.window.append(topBar);
                    //Add dialog to body
                    $('body').append(this.window);
                    // Make this dialog draggable
                    var active = false;
                    var currentX;
                    var currentY;
                    var initialX;
                    var initialY;
                    var xOffset = 0;
                    var yOffset = 0;
                    this.dragStart = function (e) {
                        if (e.type === "touchstart") {
                            initialX = e.touches[0].clientX - xOffset;
                            initialY = e.touches[0].clientY - yOffset;
                        }
                        else {
                            initialX = e.clientX - xOffset;
                            initialY = e.clientY - yOffset;
                        }
                        if (e.target === topBar[0]) {
                            active = true;
                        }
                    };
                    this.dragEnd = function (e) {
                        initialX = currentX;
                        initialY = currentY;
                        active = false;
                    };
                    this.setTranslate = function (xPos, yPos, el) {
                        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
                    };
                    this.drag = function (e) {
                        if (active) {
                            e.preventDefault();
                            if (e.type === "touchmove") {
                                currentX = e.touches[0].clientX - initialX;
                                currentY = e.touches[0].clientY - initialY;
                            }
                            else {
                                currentX = e.clientX - initialX;
                                currentY = e.clientY - initialY;
                            }
                            xOffset = currentX;
                            yOffset = currentY;
                            self.setTranslate(currentX, currentY, self.window[0]);
                        }
                    };
                    topBar[0].addEventListener("touchstart", this.dragStart, false);
                    topBar[0].addEventListener("touchend", this.dragEnd, false);
                    topBar[0].addEventListener("touchmove", this.drag, false);
                    topBar[0].addEventListener("mousedown", this.dragStart, false);
                    topBar[0].addEventListener("mouseup", this.dragEnd, false);
                    topBar[0].addEventListener("mousemove", this.drag, false);
                }
                PwDialog.prototype.append = function (element) {
                    this.window.append(element);
                };
                PwDialog.prototype.show = function () {
                    this.window.css("display", "initial");
                };
                PwDialog.prototype.close = function () {
                    this.window.css("display", "none");
                };
                PwDialog.prototype.remove = function () {
                    this.closeBtn.off();
                    this.window.remove();
                    this.topBar[0].removeEventListener("touchstart", this.dragStart);
                    this.topBar[0].removeEventListener("touchend", this.dragEnd);
                    this.topBar[0].removeEventListener("touchmove", this.drag);
                    this.topBar[0].removeEventListener("mousedown", this.dragStart);
                    this.topBar[0].removeEventListener("mouseup", this.dragEnd);
                    this.topBar[0].removeEventListener("mousemove", this.drag);
                };
                PwDialog.prototype.dispose = function () {
                    this.remove();
                };
                return PwDialog;
            }());
            exports_1("PwDialog", PwDialog);
            ;
        }
    };
});
System.register("utils", [], function (exports_2, context_2) {
    "use strict";
    var BASE_URL, _createLinkSheet, pageInfo, scriptMQ;
    var __moduleName = context_2 && context_2.id;
    function reflowLatex() {
        if (window.MathJax) {
            window.MathJax.typesetPromise && window.MathJax.typesetPromise();
            window.MathJax.Hub && window.MathJax.Hub.Queue && window.MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        }
    }
    exports_2("reflowLatex", reflowLatex);
    function forEach(obj, cb) {
        if (Array.isArray(obj)) {
            for (var i = 0, len = obj.length; i < len; i++) {
                cb(i, obj[i]);
            }
        }
        else {
            var keys = Object.keys(obj);
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                cb(key, obj[key]);
            }
        }
    }
    exports_2("forEach", forEach);
    function copyPropsFromTo(source, target) {
        var props = Object.keys(source);
        for (var i = 0, len = props.length; i < len; i++) {
            var prop = props[i];
            target[prop] = source[prop];
        }
    }
    exports_2("copyPropsFromTo", copyPropsFromTo);
    function MD5(d) { var r = M(V(Y(X(d), 8 * d.length))); return r.toLowerCase(); }
    exports_2("MD5", MD5);
    function M(d) { for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)
        _ = d.charCodeAt(r), f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _); return f; }
    function X(d) { for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++)
        _[m] = 0; for (m = 0; m < 8 * d.length; m += 8)
        _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32; return _; }
    function V(d) { for (var _ = "", m = 0; m < 32 * d.length; m += 8)
        _ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255); return _; }
    function Y(d, _) { d[_ >> 5] |= 128 << _ % 32, d[14 + (_ + 64 >>> 9 << 4)] = _; for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) {
        var h = m, t = f, g = r, e = i;
        f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551), m = safe_add(m, h), f = safe_add(f, t), r = safe_add(r, g), i = safe_add(i, e);
    } return Array(m, f, r, i); }
    function md5_cmn(d, _, m, f, r, i) { return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m); }
    function md5_ff(d, _, m, f, r, i, n) { return md5_cmn(_ & m | ~_ & f, d, _, r, i, n); }
    function md5_gg(d, _, m, f, r, i, n) { return md5_cmn(_ & f | m & ~f, d, _, r, i, n); }
    function md5_hh(d, _, m, f, r, i, n) { return md5_cmn(_ ^ m ^ f, d, _, r, i, n); }
    function md5_ii(d, _, m, f, r, i, n) { return md5_cmn(m ^ (_ | ~f), d, _, r, i, n); }
    function safe_add(d, _) { var m = (65535 & d) + (65535 & _); return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m; }
    function bit_rol(d, _) { return d << _ | d >>> 32 - _; }
    function _insertScript(url) {
        var tag = document.createElement('script');
        tag.src = url;
        tag.type = "text/javascript";
        tag.async = true;
        document.head.appendChild(tag);
        return tag;
    }
    exports_2("_insertScript", _insertScript);
    function _createStyleSheet(src, id) {
        if (id && document.getElementById(id)) {
            return;
        }
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = src;
        if (id) {
            style.id = id;
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    exports_2("_createStyleSheet", _createStyleSheet);
    return {
        setters: [],
        execute: function () {
            exports_2("BASE_URL", BASE_URL = "https://piworld.es/iedib/matheditor");
            ;
            ;
            ;
            ;
            ;
            ;
            _createLinkSheet = function (href, id) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = href;
                document.getElementsByTagName('head')[0].appendChild(link);
            };
            pageInfo = null;
            if (window.iedibAPI) {
                pageInfo = window.iedibAPI.getPageInfo();
                //console.log(pageInfo);
            }
            scriptMQ = _insertScript(BASE_URL + "/lib/mathquill.matrix.min.js");
            _createLinkSheet(BASE_URL + "/lib/mathquill.matrix.css");
        }
    };
});
