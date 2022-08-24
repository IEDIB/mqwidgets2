import { I18n } from "../../I18n"
import { items } from "../../utils"

// TabMenu
export class PwTabMenu {
    $panel: JQuery<HTMLDivElement>
    parent: JQuery<HTMLElement> | undefined
    tabs: {[name: string]: any}
    currentTab: JQuery<HTMLElement> | null
    tabsPanel: JQuery<HTMLDivElement>
    contentsPanel: JQuery<HTMLDivElement>
    gid: string | undefined

    constructor(parent?: JQuery<HTMLElement>, gid?: string) { 
        this.$panel = $('<div class="pw-me-tabmenu"></div>') as JQuery<HTMLDivElement>
        this.parent = parent;
        this.tabs = {};
        this.currentTab = null;
        this.tabsPanel = $('<div class="pw-me-tabspanel"></div>') as JQuery<HTMLDivElement>;
        this.contentsPanel = $('<div class="pw-me-tabcontents"></div>') as JQuery<HTMLDivElement>;
        this.$panel.append(this.tabsPanel);
        this.$panel.append(this.contentsPanel);
        if(this.parent) {
            this.parent.append(this.$panel);
        }
        this.gid = gid
    }

    get $div() {
        return this.$panel
    }

    addTab(name: string){
        if(this.tabs[name]) {
            //already exists
            return;
        }
        var self = this;
        var tab = $('<button style="display:none;" class="btn btn-sm pw-me-btn-tab">' + I18n(name, this.gid) + '</button>');
        var container = $('<div style="display:none;" class="pw-me-tabcontainer"></div>');
        tab.on('click', function(ev){
            ev.preventDefault();
            self.setTab(name);
        });
        this.tabsPanel.append(tab);
        this.contentsPanel.append(container);
        this.tabs[name] = {
            tab: tab,
            container: container
        };
        if(Object.keys(this.tabs).length === 1) {
            this.setTab(name);
        }
    }

    addContentsToTab(name: string, contents: JQuery<HTMLElement>) {
        if(this.tabs[name]) {
            this.tabs[name].container.append(contents);
        }
    }

    setVisible(name: string, visibility: boolean) {
        console.log(name, this.tabs)
        if(this.tabs[name]) {
            this.tabs[name].tab.css('display', visibility?'':'none');
            this.tabs[name].container.css('display', visibility?'flex':'none');
        }
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.contentsPanel.css("pointer-events", "initial");
            this.$panel.css("cursor", "initial");
        } else {
            this.contentsPanel.css("pointer-events", "none");
            this.$panel.css("cursor", "not-allowed");
        }
    }

    setTab(name: string){
        items(this.tabs, function(key: string, value: any) {
            if(key==name) {
                value.tab.addClass('pw-me-btn-active');
                value.tab.css('display', '');
            } else {
                value.tab.removeClass('pw-me-btn-active');
            }
            value.container.css('display', key==name?'flex':'none');
        });
    }

    dispose() {
        this.tabsPanel.children().off();
        this.tabsPanel.html('');
        this.contentsPanel.html('');
        this.tabs = {};
    }
};
 