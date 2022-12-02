export class LevelIndicator {
    numLevels: number;
    container: JQuery<HTMLDivElement>;
    levelIcons: JQuery<HTMLElement>[];

    constructor(numLevels: number) {
        this.numLevels = numLevels;
        this.container = $('<div style="display:inline-block;font-size:90%;" data-toggle="tooltip"></div>') as JQuery<HTMLDivElement>;
        this.levelIcons = [];
        for (let i = 0; i < numLevels; i++) {
            const elem = $('<i class="fa fas fa-pepper-hot" style="color:lightgray;"></i>') as JQuery<HTMLElement>;
            this.container.append(elem);
            this.levelIcons.push(elem);
        }
    }

    get $div() { 
        return this.container
    }

    setLevel(n: number) {
        if (n < 0) {
            n = 0
        } else if (n > this.numLevels) {
            n = this.numLevels;
        }
        for (let i = 0; i < this.numLevels; i++) {
            if (i < n) {
                this.levelIcons[i].css("color", "darkred");
            } else {
                this.levelIcons[i].css("color", "lightgray");
            }
        }
        this.container.attr("data-original-title", "Nivell " + n);
        this.container.removeAttr("title");
    }

    setVisible(visible: boolean) {
        this.container.css("display", visible ? "" : "none");
    }

}

