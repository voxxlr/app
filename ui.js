

(function() {
    
const template = document.createElement('template');

template.innerHTML = `

    <style>
    
        :host
        {
            position: relative;
            overflow: hidden;
        }
    
        ::slotted(*[hidden]) 
        { 
            display: none; 
        }
        
    </style>

    <slot></slot>	
        
    `;

class UiStack extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['top'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.stack = this.dom.querySelector("slot");
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "top")
        {
            this.stack.assignedElements().forEach(node =>
            {
                if (!node.hidden)
                {
                    node.hidden = true;
                }
                
                if (newValue === node.getAttribute("name"))
                {
                    node.hidden = false;
                }
            });
        }
    } 
    
    show(dom)
    {
        this.stack.assignedElements().forEach(node =>
        {
            if (!node.hidden)
            {
                node.hidden = true;
            }
            
            if (dom === node)
            {
                dom.hidden = false;
            }
        });
    }
}

customElements.define("ui-stack", UiStack);

})();



(function() {
    
const template = document.createElement('template');

template.innerHTML = `

    <style>
    
        :host
        {
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .tabs 
        { 
            display: flex;
            flex: 0;
        }
        
        .tabs > div 
        {
            min-width: 5em;
            float: left;
            padding: 0.1em 0.3em;
            cursor: pointer;
            color: black;
            border-top-left-radius: 2px;
            border-top-right-radius: 2px;
            background-color: white;
            border: 1px solid var(--border);
        }    	
        .tabs > div[selected] 
        {
            background-color: var(--panel-header);
        }

            
        ::slotted(*)
        {
            flex: 1;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
    </style>
    
    <div class="tabs">
        
    </div>
        
    `;

class UiTab extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['tabs', 'disabled'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    }
    
    connectedCallback() 
    {
        this.addEventListener("request-focus", event =>
        {
            //let input = this.dom.querySelector(`input[value="${event.detail}"]`);
            //input.checked = true;
            //input.dispatchEvent(new CustomEvent("change"));
        });
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "disabled")
        {
            this.dom.querySelectorAll("div").forEach(input => input.toggleAttribute("disabled", newValue != null));
        }
        else if (name == "tabs")
        {
            if (oldValue)
            {
                let tabs = this.dom.querySelector(".tabs");
                while (tabs.firstChild)
                {
                    tabs.firstChild.remove();
                }
                
                let visible = this.dom.querySelector("slot:not([hidden])");
                if (visible)
                {
                    visible.hidden = true;
                }
            }
            
            if (newValue)
            {
                let tabs = this.dom.querySelector(".tabs");
                
                let items = this.getAttribute("tabs").split(",");
                items.forEach((entry, index) =>
                {
                    let div = document.createElement("div");
                    div.id = entry;
                    div.textContent = entry.charAt(0).toUpperCase() + entry.slice(1);
                    tabs.appendChild(div);
                    
                    div.toggleAttribute("selected", index == 0);
                })
                
                items.forEach((entry, index) =>
                {
                    let slot = this.dom.querySelector(`slot[name="${entry}"]`);
                    if (!slot)
                    {
                        slot = document.createElement("slot");
                        slot.setAttribute("name", entry);
                        this.dom.appendChild(slot);
                    }
                    slot.hidden = index != 0;
                })
            }
            
            this.dom.querySelectorAll(".tabs > div").forEach(div =>
            {
                div.addEventListener("click", (event) =>
                {
                    this.changeTab(event.currentTarget);
                    this.dispatchEvent(new CustomEvent('tab-change', { detail: event.currentTarget.id }));
                })
            })
        }
    } 
    
    changeTab(tab)
    {
        let visible = this.dom.querySelector("slot:not([hidden])");
        visible.hidden = true;
        this.dom.getElementById(visible.getAttribute("name")).toggleAttribute("selected", false);
    
        tab.toggleAttribute("selected", true);
        visible = this.dom.querySelector(`slot[name='${tab.id}']`);
        visible.hidden = false;
    }

    select(name, notify)
    {
        this.changeTab(this.dom.getElementById(`${name}`))
        if (notify)
        {
            this.dispatchEvent(new CustomEvent('tab-change', { detail: name }));
        }
    }
    
    getSelected()
    {
        return this.dom.querySelector("div[selected]").id;
    }

}

customElements.define("ui-tab", UiTab);

})();


(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: flex;
            flex-direction: row;
        }

        input 
        {
            flex-grow: 1;
        }
        
    </style>
    
    <input type="text" placeholder="Enter search tags.." name="search">
    <button class="vx-secondary"><i class="fas fa-sync"></i></button>
        
    `;

class UiSearch extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.tags = [];
    }
    
    connectedCallback() 
    {
        let input = this.dom.querySelector("input");
        input.addEventListener("focusout", (event) =>
        {
            if (this.changed)
            {
                this.tags = this.parse(event.currentTarget.value);
                this.changed = false;
                this.dispatchEvent(new CustomEvent('changed', {  detail: this.tags }));
            }
        });

        input.addEventListener("keyup", (event) =>
        {
            if(event.keyCode == 13)
            {
                this.tags = this.parse(event.currentTarget.value);
                this.changed = false;
                this.dispatchEvent(new CustomEvent('changed', { detail: this.tags}));
            }
            else 
            {
                this.changed = true;
            }
        });

        this.dom.querySelector("button").addEventListener("click", (event) =>
        {
            this.dispatchEvent(new CustomEvent('changed', { detail: this.tags }));
        });
    }
    
    parse(string)
    {
        var tags = string.split(' ');
        var array = [];
        for (var i=0; i<tags.length; i++)
        {
            if (tags[i].length > 0)
            {
                array.push(tags[i].toLowerCase());
            }
        }
        return array;
    }
    
    
    clear()
    {
        let input = this.dom.querySelector("input");
        input.value = "";

        this.tags = [];
    }
}

customElements.define("ui-search", UiSearch);

})();






(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position: absolute;
            overflow: hidden;
            opacity: 1.0;
        }
        
        :host(:hover)  div { background: var(--hover); }
        
        :host div 
        {
            position: absolute;
            width: 4em;
            height: 4em;
            background: var(--border);
            transform: rotate(-45deg);
            border-radius: 0.8em;
        }

        i
        {
            position: absolute;
            color: var(--primary);
        }
        
        i:before
        {
            font-family: "Font Awesome 5 Free" !important;
            font-weight: 900;
            content: "\\f057";
        }

        
        :host([left]), :host([right])
        {
            height: 4em;
            width: 4em;
        }
        :host([left]) i, :host([right]) i { top: 1.5em; }
        :host([left]) i.closed:before, :host([right]) i.closed:before
        {
            font-family: "Font Awesome 5 Free" !important;
            font-weight: 900;
            content: "\\f141";
        }
        
        :host([left]) div { right: 2.8em; }
        :host([left])  i { left: 0.2em; }
         
        :host([right]) div { left: 2.8em; }
        :host([right])  i { left: 2.8em; }

        :host([bottom]), :host([top])
        {
            height: 4em;
            width: 4em;
        }
        
        :host([bottom]) i, :host([top]) i { left: 1.5em; }
        :host([tops]) i.closed:before, :host([bottom]) i.closed:before
        {
            font-family: "Font Awesome 5 Free" !important;
            font-weight: 900;
            margin-left: 5px;
            content: "\\f142";
        }

        :host([bottom]) div { bottom: -2.8em; }
        :host([top]) div { top: -2.8em; }

        :host([bottom])  i { bottom: 0.2em; }
        :host([top])  i { top: 2em; } 



    </style>
    
    <div></div>
    <i class="fas"></i>
        
    `;

class UiToggle extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.addEventListener("click", event =>
        {
            let i = this.dom.querySelector("i");
            let target;
            if (!this.hasAttribute("target"))
            {
                target = this.parentNode;
            }
            else
            {
                target = document.querySelector(this.getAttribute("target"));
            }
            
            if (this.hasAttribute("opened"))
            {
                if (target)
                {
                    target.classList.toggle("open", false);
                    target.classList.toggle("close", true);
                }
                
                this.toggleAttribute("opened", false);
                this.toggleAttribute("closed", true);
                this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, detail: "close" }));

            }	
            else
            {
                if (target)
                {
                    target.classList.toggle("open", true);
                    target.classList.toggle("close", false);
                }

                this.toggleAttribute("opened", true);
                this.toggleAttribute("closed", false);
                this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, detail: "open" }));
            }
                            
            i.classList.toggle("opened", this.hasAttribute("opened"));
            i.classList.toggle("closed", this.hasAttribute("closed"));
        });
    }
    
    connectedCallback() 
    {
        let i = this.dom.querySelector("i");
        i.classList.toggle("opened", this.hasAttribute("opened"));
        i.classList.toggle("closed", this.hasAttribute("closed"));
    }

    close()
    {
        if (this.hasAttribute("opened"))
        {
            this.dom.dispatchEvent(new CustomEvent("click"));
        }
    }
    
    open()
    {
        if (this.hasAttribute("closed"))
        {
            this.dom.dispatchEvent(new CustomEvent("click"));
        }
    }
}

customElements.define("ui-toggle", UiToggle);

})();






(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>

        :host
        {
            display: block;
            border: 1px solid var(--border);
        }

        :host(:hover) { background-color: var(--hover) }
        :host([selected]) { background-color: var(--selected) }
        :host([hidden]) { display: none }
            
        div { padding: 0.2em 0.2em 0.2em 1.0em ;	}
        
        i 
        { 
            color: var(--primary);
            cursor: pointer;
            float: right; 
        }
        :host(:not([deletable])) i { display: none }
        
    </style>

    <div><slot></slot><i class="fas fa-times"></i></div>
    `;


class UiOption extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        // attach to shadow dom root ? 
        this.dom.querySelector("div").addEventListener("click", (event) =>
        {
            if (event.target.tagName == "I")
            {
                this.dispatchEvent(new CustomEvent('option-delete', { bubbles: true, detail: this }));
            }
            else
            {
                this.dispatchEvent(new CustomEvent('option-click', { bubbles: true, detail: this }));
            }
        });
    }
}

customElements.define("ui-option", UiOption);

})();











(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position: relative;
            display: inline-block;
            width:inherit;
        }
        
        header
        {
            width: 100%;
            display: flex;
            align-items: center;
            border: 1px solid var(--border);
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            box-sizing: border-box;
            padding: 0em 0em 0em 0.3em;
        }
        
        span 
        { 
            flex: 1;
            display: inline-flex;
            align-items: center;
        }
        span[placeholder] { color: var(--disabled); }
        :host([disabled]), :host(:not([value])) span { color: var(--disabled); }
        
        i 
        {
            margin-right: 0.4em;
            color: var(--border);
        }
        :host([:not([value])]) i { display: none }
        :host(:not([deletable])) i { display: none; }

        button
        {
            border: 1px;
            border-top-right-radius: 4px;
        }
        
        button:before 
        {
            font-family: "Font Awesome 5 Free";
            font-weight: 900;
            display: inline-block;
            vertical-align: middle;
            color: var(--primary);
        }
        :host([open]) button:before { content: "\\f150"; }
        :host(:not([open])) button:before { content: "\\f151"; }
        :host([waiting]) button:before{ content: "\\f110"; }

        main
        {
            position: absolute;
            z-index: 19;
            width: 100%;
            margin-top: -1px;
            background-color: white;
            display: flex;
            flex-direction: column;
            justify-content: stretch;
        }
        :host(:not([open])) main { display: none }	
        
        ui-option:last-child 
        {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
        }
        
        ui-option:button+ui-option:button { margin-top: -1px; }

    </style>

    <header>
        <span placeholder></span>
        <i class="fa fa-times" hidden></i>
        <button></button>
    </header>

    <main>
    </main>
    <slot>
    </slot>
    
    `;


class UiDropdownSelect extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['value'];
    }
    
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.main = this.dom.querySelector("main");
        this.main.addEventListener("option-click", event =>
        {
            this.dom.host.toggleAttribute("open", false);
            this.setAttribute("value", event.detail.getAttribute("value"));
            this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: event.detail }));
        });
        
        this.selection = this.dom.querySelector("span");
        this.selection.textContent = this.getAttribute("placeholder") || "...";
        
        this.button = this.dom.querySelector("button");
        this.dom.querySelectorAll("button, span").forEach(surface => surface.addEventListener("click", event => 
        {
            if (!this.hasAttribute("waiting"))
            {
                this.dom.host.toggleAttribute("open");
                this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
            }
        }));
        
        this.dom.querySelector("i").addEventListener("click", event => 
        {
            this.removeAttribute("value");
            this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: null }));
            this.dom.host.toggleAttribute("open", false);
        });
        
        this.dom.addEventListener('slotchange', event => 
        {
            event.target.assignedElements().forEach(node =>
            {
                this.main.append(node);
            });
            
            let selected = this.main.querySelector(`ui-option[selected]`);
            if (selected)
            {
                this.setAttribute("value", selected.getAttribute("value"));
            }
        });		
    }
    
    add(value, text) 
    {
        let option;
        if (value instanceof customElements.get('ui-option'))
        {
            option = value;
        }
        else
        {
            option = document.createElement("ui-option");
            option.setAttribute("value", value);
            option.textContent = text;
        }
        this.button.toggleAttribute("disabled", false);
        this.main.append(option);
        return option;
    }
    
    remove(value) 
    {
        let option;
        if (value instanceof customElements.get('ui-option'))
        {
            option = value;
        }
        else
        {
            option = this.dom.querySelector(`ui-option[value="${value}"]`);
        }
        if (option)
        {
            if (option.hasAttribute("selected"))
            {
                this.removeAttribute("value");
            }
            option.remove();
            
            if (!this.main.firstElementChild)
            {
                this.button.toggleAttribute("disabled", true);
            }
        }
        return option;
    }
    
    clear()
    {
        while (this.main.firstChild)
        {
            this.main.firstChild.remove();
        }
        this.button.toggleAttribute("disabled", true);
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "value")
        {
            if (oldValue)
            {
                this.main.querySelector(`ui-option[value='${oldValue}']`).toggleAttribute("selected", false);
            }
            if (newValue)
            {
                let option = this.main.querySelector(`ui-option[value='${newValue}']`);
                if (option)
                {
                    option.toggleAttribute("selected", true);
                    this.selection.textContent = option.textContent;
                    this.selection.toggleAttribute("placeholder", false);
                }
                this.dom.querySelector("i").hidden = false;
            }
            else
            {
                this.selection.textContent = this.getAttribute("placeholder") || "...";
                this.selection.toggleAttribute("placeholder", true);
                this.dom.querySelector("i").hidden = true;
            }
        }
    } 
}

customElements.define("ui-dropdown-select", UiDropdownSelect);

})();





(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display:inline-flex;
            flex-direction: column;
        }
        
        input 
        {
            flex: 1;
            box-sizing:border-box
        }
        
        div
        {
            overflow-y:auto;
            display: flex;
            flex-direction: column;
        }
        
    </style>
    
        <slot></slot>
        <div></div>
    `;

class UiOptionList extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.values = [];
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        this.dom.addEventListener('slotchange', (event) => 
        {
            event.target.assignedElements().forEach(node =>
            {
                this.select = node;
            });
        });

        this.div = this.dom.querySelector("div");		

        this.addEventListener("change", (event)=>
        {
            let option = this.select.remove(event.detail);
            option.toggleAttribute("selected", false);
            option.toggleAttribute("deletable", true);
            this.div.appendChild(option);
            
            let value = event.detail.getAttribute("value");
            this.values.push(value);
        });
    }
    
    connectedCallback() 
    {
        this.dom.addEventListener("option-delete", (event)=>
        {
            let option = event.detail;
            this.select.add(option);
            option.toggleAttribute("deletable", false);
            
            let value = option.getAttribute("value");
            this.values.slice(this.values.indexOf(value),1);
        });
    }
}

customElements.define("ui-option-list", UiOptionList);

})();





(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: inline-flex;		
            align-items: center;
            border: 1px solid var(--border);
            border-radius: 0.5em;
            color: var(--primary);
            background: var(--panel-header);
            box-sizing: border-box;
            font-size: 0.8em;
            line-height: 0.8em;
        }
        
        span 
        { 
            display: inline-block;
            margin: 0.1em 0.2em 0.1em 0.3em;
        }
        
        i 
        { 
            cursor: pointer;
            float: right; 
            margin: 0.2em 0.2em 0.2em 0.2em;
        }
        
        :host-context([disabled]) i { visibility: hidden; }
        
    </style>
        
    <span><slot></slot></span><i class="fas fa-times-circle"></i>
    `;

class UiTag extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.querySelector("i").addEventListener("click", event =>
        {
            this.dispatchEvent(new CustomEvent('tag-delete', { bubbles: true, detail: this }));
        });
    }
}

customElements.define("ui-tag", UiTag);

})();



(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: block;
        }
        
        :host([disabled])
        {
            opacity: 0.5;
            pointer-events: none;
        }
        
        :host > ui-tag:not(:nth-of-type(1))
        {
            margin-left: 0.2em;
        }

        
    </style>
            
    <slot></slot>

    `;

class UiTagList extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['tags'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        this.dom.addEventListener("tag-delete", event =>
        {
            let tags = this.getAttribute("tags").split(",");
            tags.splice(tags.indexOf(event.target.textContent),1);
            if (tags.length)
            {
                this.setAttribute("tags", tags.join(","));
            }
            else
            {
                this.removeAttribute("tags");
            }
            
            this.dispatchEvent(new CustomEvent('tag-delete', { bubbles: true, detail: event.target }));
            this.dispatchEvent(new CustomEvent('tags-changed', { bubbles: true, detail: tags }));			
        });
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "tags")
        {
            let newTags = newValue ? newValue.split(",") : [];
            let oldTags = oldValue ? oldValue.split(",") : [];
            
            this.dom.querySelectorAll("ui-tag").forEach(tag =>
            {
                if (!newTags.includes(tag.textContent))
                {
                    tag.remove();
                    oldTags.splice(oldTags.indexOf(tag.textContent),1);
                } 
            });
        
            newTags.forEach((newTag, index, object) =>
            {
                if (newTag.length > 0)
                {
                    if (!oldTags.includes(newTag))
                    {
                        let tag = document.createElement("ui-tag");
                        tag.textContent = newTag;
                        this.dom.appendChild(tag);
                        oldTags.push(newTag);
                    }
                }
            });
        }
    } 
    
    add(newTags)
    {
        for (var i=0; i<newTags.length; i++)
        {
            newTags[i] = newTags[i].toLowerCase();
        }
        newTags = newTags.filter(tag => { return tag !== "" });
        
        if (newTags.length)
        {
            let oldTags = [];
            if (this.hasAttribute("tags"))
            {
                let string = this.getAttribute("tags");
                if (string.length > 0)
                {
                    oldTags = string.split(",");			
                }
            }
            let tags = newTags.concat(oldTags);
            this.setAttribute("tags", `${tags.join(",")}`);
            this.dispatchEvent(new CustomEvent('tags-changed', { bubbles: true, detail: this.getAttribute("tags").split(",") }));
        }
    }
    
    get()
    {
        let result = [];
        if (this.hasAttribute("tags"))
        {
            this.getAttribute("tags").split(",").forEach(entry =>
            {
                if (entry.length > 0)
                {
                    result.push(entry);
                }
            });
        }
            
        return result;
    }
    
}

customElements.define("ui-tag-list", UiTagList);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position: relative;
        }
        
        :host-context([hidden]) { display: none; }
        
        input 
        {
            width: 100%;
            box-sizing:border-box
        }
        
    </style>
    
        <input placeholder="Enter Tags..." type="text" autocomplete="nope">
    `;

class UiTagInput extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['tags'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    
        let input = this.dom.querySelector("input");
        input.addEventListener('focusout', event =>
        {
            this.dom.host.parentNode.add(event.currentTarget.value.split(' '));
            event.currentTarget.value = "";	
        });
        input.addEventListener('keyup', event =>
        {
            if (event.keyCode == 13) 
            {
                this.dom.host.parentNode.add(event.currentTarget.value.split(' '));
                event.currentTarget.value = "";	
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "tags")
        {
            this.dom.querySelector("ui-tag-list").setAttribute("tags", newValue);
        }
        else if (name == "disabled")
        {
            let input = this.dom.querySelector("input");
            input.toggleAttribute("disabled", newValue != null);
        }
    } 
}

customElements.define("ui-tag-input", UiTagInput);

})();







(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: flex;	
            flex-direction: column;	
            justify-content: flex-end;
            background-repeat: no-repeat;
            background-position: 50% 50%;
            background-size: contain;
        }	
        
        div
        {
            display:flex;
            align-items: center;
        }
        
        .bullet
        {
            cursor: pointer;
            height: 1.1em;
            width: 1.1em;
            margin-left: 0.5em;
            background-color: #bbb;
            border-radius: 50%;
            display: inline-block;
            transition: background-color 0.6s ease;
        }
        .bullet.selected { background-color: #717171; }
        .bullet:hover { background-color: #717171; }
        
        </style>
    
        <div></div>
        
        <slot></slot>
        
    </div>		
        
        
    </style>
    `;

class UiBullets extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.bullets = this.dom.querySelector("div")
    }

    add(file, select)
    {
        var bullet = this.bullets.appendChild(document.createElement("div"));
        bullet.addEventListener("click", (event) => 
        {
            this.dom.host.style.backgroundImage = 'url('+file.url+')';
            var selected = this.bullets.querySelector(".selected");
            if (selected)
            {
                this.dispatchEvent(new CustomEvent('unselect', 
                {
                    bubbles: true,
                    composed: true,
                    detail: selected.file
                }));
                selected.classList.remove("selected");
            }
            
            this.dispatchEvent(new CustomEvent('select', 
            {
                bubbles: true,
                composed: true,
                detail: event.currentTarget.file
            }));
            
            event.currentTarget.classList.add("selected");
        });
        bullet.classList.add('bullet');
        bullet.file = file;		
        bullet.id = file.path;		
        
        if (select)
        {
            bullet.dispatchEvent(new Event("click"));		
        }
        else 
        {
            var first = this.bullets.querySelector(".bullet:first-child");
            if (first == bullet)
            {
                bullet.dispatchEvent(new Event("click"));		
            }
        } 
    }

    remove(file)
    {
        var bullet = this.dom.getElementById(file.path);
        if (bullet)
        {
            if (bullet.classList.contains("selected"))
            {
                this.dispatchEvent(new CustomEvent('unselect', 
                {
                    bubbles: true,
                    composed: true,
                    detail: bullet.file
                }));
            }

            bullet.remove();
        }

        var first = this.bullets.querySelector(".bullet:first-child");
        if (first)
        {
            first.dispatchEvent(new Event("click"));		
        }
        else 
        {
            this.dom.host.style.backgroundImage = 'url()';
        }
    }
    
    clear()
    {
        while (this.bullets.firstChild)
        {
            this.bullets.firstChild.remove();
        }
        this.dom.host.style.backgroundImage = 'url()';
    }

    selected()
    {
        var bullet = this.bullets.querySelector(".selected");
        if (bullet)
        {
            return bullet.file;
        }
        return null;
    }

}

customElements.define("ui-bullets", UiBullets);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: inline-block; 
            cursor: pointer;
        }	

        :host > div
        {
            position: absolute;
            font-size: 0.9em;
            min-width: 10em;
            box-shadow: 0 10px 10px 5px rgb(0 0 0 / 5%);
            transition: .25s ease-in-out;
            display: flex;
            flex-direction: column;
            background-color: white;
        }		
        
        :host > div[hidden]
        {
            display: none;
            opacity: 0;
        }

        slot:not([name="title"])::slotted(*)
        {
            padding: 0.8em 0.8em 0.8em 0.8em;
        }
        
        slot:not([name="title"])::slotted(*:hover)
        {
            background-color: var(--hover);
        }
        
        slot:not([name="title"])::slotted(*:not(:first-child))
        {
            border-top: 1px solid var(--border);
        }
        
            
    </style>
    
    
    <slot name="title"></slot>
    
    <div hidden>
        <slot></slot>
    </div>
    
    `;

class UiMenu extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.addEventListener('slotchange', (event) => 
        {
            if (!event.target.name)
            {
                this.choices = event.target.assignedElements();
                this.choices.forEach(entry =>
                {
                    entry.addEventListener("click", event =>
                    {
                        this.dom.querySelector('div').toggleAttribute("hidden", true);
                    })
                });
            }
        });

        this.dom.host.addEventListener('mouseleave', (event) => 
        {
            this.dom.querySelector('div').toggleAttribute("hidden", true);
        });
        
    }
    
    connectedCallback() 
    {
        this.dom.querySelector('slot[name="title"]').addEventListener("click", (event) => 
        {
            this.dom.querySelector('div').toggleAttribute("hidden", false);
        });		

        this.dom.querySelector('slot[name="title"]').addEventListener("mouseenter", (event) => 
        {
            this.dom.querySelector('div').toggleAttribute("hidden");
        });		
    }


}

customElements.define("ui-menu", UiMenu);

})();



(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: flex;
        }
        
        :host([horz])
        {
            flex-direction: row;
            padding: 0 6px 0 6px;
        }	

        :host([vert])
        {
            flex-direction: column;
            padding: 6px 0 6px 0;
        }
        
        .segment 
        { 
            background: #40C4FF;
            overflow: visible;
        }
            
        .handle 
        {
            background: #3F51B5;
            width: 12px;
            height: 12px;
            cursor: pointer;
            z-index: 9;
            border-radius: 6px;
            overflow: visible;
        }
        
        
        :host([horz]) .segment { height: 2px; margin-top: 5px;  } 
        :host([horz]) .segment.slider { flex-direction: row; } 
        :host([horz]) .handle 
        { 
            margin-left: -6px;
            margin-right: -6px;
        }
        
        :host([vert]) .segment { width: 2px; margin-left: 5px; } 
        :host([vert]) .segment.slider { flex-direction: column; } 
        :host([vert]) .handle 
        { 
            margin-top: -6px;
            margin-bottom: -6px;
        }		
        
        :host > div:nth-of-type(3) { flex-grow: 1 }
        
    </style>
    
    <div class="segment"></div>
    <div class="handle"></div>
    <div class="segment"></div>
    `;


class UiSlider extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.range1 = this.dom.querySelector('.segment:nth-of-type(1)');
        this.handle = this.dom.querySelector('.handle');
        this.range2 = this.dom.querySelector('.segment:nth-of-type(2)');
        
        this.move = (event)  =>
        {
            if (this.orient == "vert")
            {
                let top = this.bounds.top + 6;
                let bottom = this.bounds.bottom - 6;
                let height = bottom - top;
                
                var position = Math.min(Math.max(top, event.pageY), bottom) - top;
                this.range1.style.height = Math.max(0, position) + "px";
                
                this.dispatchEvent(new CustomEvent('change', 
                {
                    bubbles: true,
                    composed: true,
                    detail: 1.0-position/(height)
                }));
            }
            else
            {
                let left = this.bounds.left + 6;
                let right = this.bounds.right - 6;
                let width = right - left;
                
                var position = Math.min(Math.max(left, event.pageX), right) - left;
                this.range1.style.width = Math.max(0, position) + "px";
                
                this.dispatchEvent(new CustomEvent('change', 
                {
                    bubbles: true,
                    composed: true,
                    detail: position/width
                }));
            }
        };
        
        this.up = (event) =>
        {
            document.removeEventListener('mousemove', this.move);
            document.removeEventListener('mouseup', this.up);
            this.hasAttribute("mouseout")
            {
                document.removeEventListener("mouseout",this.out);
            }
        };
        
        this.out = (event)  =>
        {
            document.removeEventListener('mousemove', this.move);
            document.removeEventListener('mouseup', this.up);
            this.hasAttribute("mouseout")
            {
                document.removeEventListener("mouseout",this.out);
            }
        };
        
        this.handle.addEventListener('mousedown', (event)=>
        {
            this.bounds = this.dom.host.getBoundingClientRect();
            document.addEventListener('mousemove', this.move);
            document.addEventListener('mouseup', this.up);
            this.hasAttribute("mouseout")
            {
                document.addEventListener("mouseout",this.out);
            }
        });
        
        this.A = 12; // px handle size
    }
    
    connectedCallback() 
    {
        this.orient = this.getAttribute("horz") != null ? "horz" : "vert";
        if (this.orient == "vert")
        {
            //this.handle.style.height = "0%";
        }
        else
        {
            //this.handle.style.width = "0%";
        }
    }
    
    set(value, update)
    {
        this.bounds = this.dom.host.getBoundingClientRect();
        if (this.orient == "vert")
        {
            this.range1.style.height = `${value*100}%`;//`${value*(this.bounds.height-12)}px`;
        }
        else
        {
            this.range1.style.width = `${value*100}%`;//`${value*(this.bounds.width-12)}px`;
        }
    }			
}

customElements.define("ui-slider", UiSlider);

})();







(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: flex;
            align-items: center;
        }
        
        :host([horz])
        {
            flex-direction: row;
            padding-bottom: 5px;
        }	

        :host([vert])
        {
            flex-direction: column;
            padding-left: 5px;
        }
        
        
        .segment { overflow: visible; }
        .segment.range 
        {
            background: #40C4FF;
            flex-grow: 1;
            position:relative;
            display: flex;
            justify-content: space-between;
        }
        
        .handle 
        {
            background: #3F51B5;
            width: 12px;
            height: 12px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 9;
            overflow: visible;
        }
        
        :host([large]) .handle
        {
            width: 18px;
            height: 18px;
            border-radius: 9px;
        } 
        
        
        :host([horz]) .segment.range { flex-direction: row; } 
        :host([horz]) .segment { height: 2px; margin-top: 6px} 
        :host([horz]) .handle.A { margin-top: -5px }
        :host([horz]) .handle.B { margin-top: -5px }
        
        :host([vert]) .segment.range { flex-direction: column; } 
        :host([vert]) .segment { width: 2px; } 
        :host([vert]) .handle.A { margin-left: -5px }
        :host([vert]) .handle.B { margin-left: -5px }
        
        :host([large][vert]) .segment { width: 3px; } 
        :host([large][vert]) .handle.A { margin-left: -7px }
        :host([large][vert]) .handle.B { margin-left: -7px }

    </style>
    
        <div class="segment"></div>
        <div class="segment range">
            <div class="handle A"></div>
            <div class="handle B"></div>
        </div>
        <div class="segment"></div>
        
    `;


class UiRange extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    
        this.range1 = this.dom.querySelector('.segment:nth-of-type(1)');
        this.range2 = this.dom.querySelector('.segment:nth-of-type(2)');
        this.range3 = this.dom.querySelector('.segment:nth-of-type(3)');
        
        this.A = 0;
        this.handleA = this.dom.querySelector('.handle.A');
        this.B = 1;
        this.handleB = this.dom.querySelector('.handle.B');

        this.moveA = (event) =>
        {
            if (this.hasAttribute("horz"))
            {
                let pos = Math.min(Math.max(this.bounds.left, event.pageX), this.boundsMax.left-this.SIZE) - this.bounds.left;
                this.range1.style.width = pos + "px";
                this.A = pos/(this.bounds.width-2*this.SIZE);
                this.dispatchEvent(new CustomEvent('change', { detail: { min: this.A, max: this.B } }));
            }
            else
            {
                let pos = Math.min(Math.max(this.bounds.top, event.pageY), this.boundsMax.top-this.SIZE) - this.bounds.top;
                this.range1.style.height = pos + "px";
                this.A = pos/(this.bounds.height-2*this.SIZE);
                this.dispatchEvent(new CustomEvent('change',  { detail: { min: 1-this.B, max: 1-this.A } }));
            }
        };
        
        this.upA = (event) =>
        {
            document.removeEventListener('mousemove', this.moveA);
            document.removeEventListener('mouseup', this.upA);
            if (this.hasAttribute("strict"))
            {
                this.dom.host.removeEventListener('mouseleave', this.upA);
            }
        };
        
        this.handleA.addEventListener('mousedown', (event) =>
        {
            this.bounds = this.dom.host.getBoundingClientRect();
            this.boundsMax = this.handleB.getBoundingClientRect();
            document.addEventListener('mousemove', this.moveA);
            document.addEventListener('mouseup', this.upA);
            if (this.hasAttribute("strict"))
            {
                this.dom.host.addEventListener('mouseleave', this.upA);
            }
        });

        this.moveB = (event) =>
        {
            if (this.hasAttribute("horz"))
            {
                let pos = Math.max(Math.min(this.bounds.right, event.pageX), this.boundsMin.right+this.SIZE) - this.bounds.left;
                this.range3.style.width = (this.bounds.width-pos) + "px";
                this.B = (pos-2*this.SIZE)/(this.bounds.width-2*this.SIZE);
                this.dispatchEvent(new CustomEvent('change', { detail: { min: this.A, max: this.B } }));
            }
            else
            {
                let pos = Math.max(Math.min(this.bounds.bottom, event.pageY), this.boundsMin.bottom+this.SIZE) - this.bounds.top;
                this.range3.style.height = (this.bounds.height-pos) + "px";
                this.B = (pos-2*this.SIZE)/(this.bounds.height-2*this.SIZE);
                this.dispatchEvent(new CustomEvent('change', {detail: { min: 1-this.B, max: 1-this.A } }));
            }
        };
        
        this.upB = (event)  =>
        {
            document.removeEventListener('mousemove', this.moveB);
            document.removeEventListener('mouseup', this.upB);
            if (this.hasAttribute("strict"))
            {
                this.dom.host.removeEventListener('mouseleave', this.upB);
            }
        };
        
        this.handleB.addEventListener('mousedown', (event) =>
        {
            this.bounds = this.dom.host.getBoundingClientRect();
            this.boundsMin = this.handleA.getBoundingClientRect();
            document.addEventListener('mousemove', this.moveB);
            document.addEventListener('mouseup', this.upB);
            if (this.hasAttribute("strict"))
            {
                this.dom.host.addEventListener('mouseleave', this.upB);
            }
        });

        this.SIZE = 12; // px handle size		
    }
    
    set(min, max, update)
    {
        this.bounds = this.getBoundingClientRect();
    
        if (this.hasAttribute("horz"))
        {
            let width = this.bounds.width - 2*this.SIZE;
            this.range1.style.width = width*min + "px";
            this.range3.style.width = width*(1.0-max) + "px";
            this.A = min;
            this.B = max;
        }
        else
        {
            let height = this.bounds.height - 2*this.SIZE;
            this.range1.style.height = height*(1.0-max) + "px";
            this.range3.style.height = height*min + "px";
            this.A = 1-max;
            this.B = 1-min;
        }
        if (update)
        {
            this.dispatchEvent(new CustomEvent('change', { detail: { min, max } }));
        }
    }			
}

customElements.define("ui-range", UiRange);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host {
            border: 1px solid var(--border);
            padding: 1em 1em 1em 1em;
            margin-top: 1.0em;
            position: relative;
            display: inline-block;
        }
        
        span 
        { 
            position: absolute;
            background-color: white;
            top: -0.7em !important; 
            z-index: 10;
            color: var(--border);
            padding-left: 0.2em;
            padding-right: 0.2em;
        }
        
        :host([required]) span:after
        {
            position:relative;
            font-family: "Font Awesome 5 Free";
            color: var(--important);
            font-size: 0.5em;
            margin-left:0.5em;
            font-weight: 900;
            display: inline-block;
            vertical-align: 0.7em;
            content: "\\f005";
        }
        
        :host([disabled]) { opacity: 0.5; pointer-events: none; }
        :host([hidden]) { visibility: hidden; }
        
    </style>
    
    <span></span>
    
    <slot></slot>
    `;


class UiPanel extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['name'];
    }
    
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {	
        if (name === "name") // remove eventually
        {
            this.dom.querySelector("span").textContent = newValue;
        }
    }

}

customElements.define("ui-panel", UiPanel);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            border: 1px solid var(--border);
            padding: 1em 1em 1em 1em;
            display: flex;
            flex-direction: column;
            overflow-y: hidden;
            box-sizing: border-box
        }
        
        :host([disabled]) { opacity: 0.5; pointer-events: none; }
        
        
        h4
        {
            background-color: var(--hover);
            padding-left: 1em;
            padding-top: 0.4em;
            padding-bottom: 0.4em;
            margin-left: -1em;
            margin-top: -1em;
            margin-right: -1em;
        }
        
    </style>
    
    <h4>
    </h4>
    
    <slot></slot>
    `;


class UiSection extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['label'];
    }
    
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {	
        if (name === "label")
        {
            this.dom.querySelector("h4").textContent = newValue;
        }
    }

}

customElements.define("ui-section", UiSection);

})();





(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: flex;
        }
        
        :host([hidden]) { display: none }
        :host([disabled]) 
        {
            pointer-events: none; 
            opacity: 0.5;  
        }

        ::slotted(*:first-child) 
        {
            margin-left: 0;
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
        }
        
        ::slotted(*:not(:first-child))
        {
            margin-left: -1px;
        }			
        
        ::slotted(*:last-child) 
        {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
        }
        
        ::slotted(*)
        {
            border: 1px solid var(--border);
            box-sizing: border-box;
        }		
                    
    </style>

    <slot></slot>
    
    `;


class UiButtonGroup extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.buttons = this.dom.querySelector("slot").addEventListener("click", event=>
        {
            if (!this.hasAttribute("manual"))
            {
                this.press(event.target.closest("button"), true);
            }
        });
    }
    
    
    press(target, notify)
    {
        let buttons = this.dom.querySelector("slot").assignedElements();
        buttons.forEach(button =>
        {
            if (button != target)
            {
                if (button.hasAttribute("active"))
                {
                    if (this.hasAttribute("single"))
                    {
                        button.toggleAttribute("active");
                        if (notify)
                        {
                            this.dispatchEvent(new CustomEvent("up", { detail: button } ));
                        }
                    }
                }
            }
            else 
            {
                if (button.hasAttribute("active"))
                {
                    if (!this.hasAttribute("required"))
                    {
                        button.toggleAttribute("active");
                        if (notify)
                        {
                            this.dispatchEvent(new CustomEvent("up", { detail: button } ));
                        }
                    }
                }
                else
                {
                    button.toggleAttribute("active");

                    if (notify)
                    {
                        this.dispatchEvent(new CustomEvent("down", { detail: button } ));
                    
                        if (this.hasAttribute("spring"))
                        {
                            setTimeout( ()=>
                            {
                                button.toggleAttribute("active")
                            }, 300);
                        }
                    }
                }
            }
        })
        this.dispatchEvent(new CustomEvent("change"));
    }
}

customElements.define("ui-button-group", UiButtonGroup);

})();



(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host {
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,.5);
            pointer-events: auto;
            opacity: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99;
        }
        
        :host([local]) { position: absolute; }
        
        :host([hidden]) { display: none; }
        
        div 
        {
            position: relative;
            padding: 2.1em 2.1em 2.1em 2.1em;
            border: none;
            box-shadow: 0 9px 46px 8px rgba(0,0,0,.14), 0 11px 15px -7px rgba(0,0,0,.12), 0 24px 38px 3px rgba(0,0,0,.2);
            background: #ffffff;
            opacity: 1.0;
        }
        
        button 
        {
            position: absolute;
            top: 0.5em;
            right: 0.5em;
        }
        
        :host(:not([close])) button { display: none; }
            
    </style>
        
    <div>
        <button class="vx-round vx-secondary"><i class="fas fa-times-circle"></i></button>
        <slot></slot>
    </div>
    
    `;


class UiModal extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['hidden'];
    }
    
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.querySelector("button").addEventListener("click", event=>
        {
            this.hidden = true;
            
            this.dispatchEvent(new CustomEvent("close"));
        });
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name === "hidden")
        {
            if (newValue != null)
            {
                this.dispatchEvent(new CustomEvent("close"));
            }
            else
            {
                this.dispatchEvent(new CustomEvent("open"));
            }
        }
    }
}

customElements.define("ui-modal", UiModal);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
        
        :host
        {
            position: relative;
            height: 100%;
        }
        
        .slides 
        { 
            height: 60vh; 
        }
        .slide { display: none;  }
        .slide img 
        { 
            max-height: 100%; 
            max-width: 100%; 
            margin: auto;
        }
            
        .slide.visible { display: block; height: 100% }
        
        .prev, .next 
        {
            cursor: pointer;
            padding: 16px;
            color: white;
            font-weight: bold;
            font-size: 20px;
            transition: 0.6s ease;
            border-radius: 0 3px 3px 0;
            user-select: none;
            background-color: rgba(0, 0, 0, 0.2);
        }
        
        .next 
        {
            position: absolute;
            right: 0;
            top: 50%;
            margin-top: -50px;
        }
        
        .prev 
        {
            position: absolute;
            left: 0;
            top: 0;
            margin-top: -50px;
        }
        
        .prev:hover, .next:hover { background-color: rgba(0, 0, 0, 0.8); }
        
        .caption-container 
        {
            text-align: center;
            background-color: black;
            padding: 2px 16px;
            color: white;
        }
        
        .preview 
        {
            height: 15vh;
            display: flex;
            flex-direction: row;
        }
        
        .column 
        {
            flex: 1;
            height: 100%;
            opacity: 0.3;
        }
        
        .column img 
        { 
            height: 100%; 
            object-fit: cover;  
        }
        
        img.hover-shadow { transition: 0.3s; }
        .column.active { opacity: 1 }
        .column:hover { opacity: 1; }
        
        .hover-shadow:hover { box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); }		 
                        
    </style>
        
    <div>
        <div class="slides"></div>
        <div class="prev">&#10094;</div>
        <div class="next">&#10095;</div>
    </div>

    <div class="caption-container">
        <p class="caption"></p>
    </div>

    <div class="preview"></div>
    `;


class UiImages extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));

        this.slides = this.dom.querySelector(".slides");
        this.preview = this.dom.querySelector(".preview");
        
        this.dom.querySelectorAll("a").forEach(button => button.addEventListener("click", (event) =>
        {
            let visible = this.dom.querySelector(".slides .slide.visible");
            let index = Array.prototype.indexOf.call(this.slides.children, visible);
            if (event.currentTarget.classList.contains("next"))
            {
                this.setSlide((index + 1) % this.slides.children.length);
            }
            else
            {
                this.setSlide((index - 1 + this.slides.children.length) % this.slides.children.length);
            };
        }));
    }
    
    
    async init(images)
    {
        while (this.slides.firstChild)
        {
            this.slides.firstChild.remove();
        }
        while (this.preview.firstChild)
        {
            this.preview.firstChild.remove();
        }
        
        images.forEach((entry, index) => 
        {
            let image = document.createElement("img");
            image.src = entry.url;
            
            let slide = document.createElement("div");
            slide.classList.add("slide");
            if (index == 0)
            {
                slide.classList.add("visible");
                this.dom.querySelector(".caption").textContent = entry.caption;
            }
            slide.setAttribute("data-caption",  entry.caption);
            slide.appendChild(image);
            this.slides.appendChild(slide);
        });
        
        let preview = this.dom.querySelector(".preview");
        images.forEach((entry,index) => 
        {
            let column = document.createElement("div");
            column.classList.add("column");
            let image = document.createElement("img");
            image.src = entry.url;
            column.appendChild(image);
            if (index == 0)
            {
                column.classList.add("active");
            }
            preview.appendChild(column);
            
            column.addEventListener("click", (event)=>
            {
                this.setSlide(Array.prototype.indexOf.call(this.preview.children, event.currentTarget));
            })
        });
    }

    
    setSlide(index)
    {
        let current = Array.prototype.indexOf.call(this.slides.children, this.dom.querySelector(".slides .slide.visible"))
        
        this.slides.children[current].classList.remove("visible");
        this.preview.children[current].classList.remove("active");
        this.dom.querySelector(".caption").textContent = this.slides.children[index].getAttribute("data-caption");
        this.slides.children[index].classList.add("visible");
        this.preview.children[index].classList.add("active");
    }	
}

customElements.define("ui-images", UiImages);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position:absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 1030;
            align-items: center;
            display: flex;			
        }

        button 
        { 
            font-size: 1.25rem; 
            width: 100%;
            margin-top: 20px;
            padding: 0 40px;
            line-height: 53px;
        }
                
        input 
        { 
            font-size: 1.25rem; 
            width: 100%;
            padding: 0 10px;
            height: 55px;
            margin: 0;
            background: #fff;
            color: #666;
            border: 1px solid #e5e5e5;
            box-sizing: border-box;
            font: inherit;
        }		

         h3 
        { 
            text-align: center!important;
            font-size: 1.5rem;
            line-height: 1.4;
        }	
                                
    </style>

    <ui-modal>		
        <h3>Password Required</h3>
        <input type="password">	
        <button>Verify</button>
    </ui-modal>
    `;


class UiPassword extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.querySelector("button").addEventListener("click", ()=>this.validate());
        this.dom.querySelector("input").addEventListener("keyup", (event) =>
        {
            if (event.keyCode == 13) 
            {
                this.validate();
            }
        });
    }

    validate()
    {
        var password = CryptoJS.MD5(this.dom.querySelector("input").value);
        if (password.toString() === this.getAttribute("password"))
        {
            this.remove();
            this.dispatchEvent(new CustomEvent("verified"));
        }
    }; 
}

customElements.define("ui-password", UiPassword);

})();










(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
        }
        
        ::slotted(*)
        {
            border: 1px solid var(--border);
            box-sizing: border-box;
        }		
        ::slotted(*[selected]) 
        { 
            border: 2px solid var(--primary); 
        }
                                
    </style>
    
    <slot></slot>
    
    `;


class UiList extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.addEventListener("click", event=>
        {
            let path = event.path || (event.composedPath && event.composedPath());
            for (var i=0; i<path.length; i++)
            {
                if (path[i].nodeName === "SLOT")
                {
                    if (!path[i-1].hasAttribute("selected"))
                    {
                        this.content.assignedElements().forEach(element =>
                        {
                            if (element.hasAttribute("selected"))
                            {
                                element.toggleAttribute("selected", false);	
                                this.dispatchEvent(new CustomEvent('item-unselect', { bubbles: true, composed: true, detail: element }));
                            }
                        });
                        
                        path[i-1].toggleAttribute("selected", true);
                        this.dispatchEvent(new CustomEvent('item-select', { bubbles: true, composed: true, detail: path[i-1] }));
                    }
                    break;
                }
            }
        });
        
        this.dom.addEventListener("dblclick", event=>
        {
            let path = event.path || (event.composedPath && event.composedPath());
            for (var i=0; i<path.length; i++)
            {
                if (path[i].nodeName === "SLOT")
                {
                    this.dispatchEvent(new CustomEvent('item-dblclick', { bubbles: true, composed: true, detail: path[i-1] }));
                    break;
                }
            }
        });
        
        this.content = this.dom.querySelector("slot");
    }
    
    select(entry, notify)
    {
        this.content.assignedElements().forEach(element =>
        {
            if (element.hasAttribute("selected"))
            {
                element.toggleAttribute("selected", false);	
                this.dispatchEvent(new CustomEvent('item-unselect', { bubbles: true, composed: true, detail: element }));
            }
        });

        if (entry)
        {
            entry.toggleAttribute("selected", true);
            if (notify)
            {
                this.dispatchEvent(new CustomEvent('item-select', { bubbles: true, composed: true, detail: entry }));
            }
        }		
    }
    
    clear()
    {
        this.content.assignedElements().forEach(element =>
        {
            if (element.hasAttribute("selected"))
            {
                this.dispatchEvent(new CustomEvent('item-unselect', { bubbles: true, composed: true, detail: element }));
            }
            element.remove()	
        });		
    }
}

customElements.define("ui-list", UiList);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <style>
    
        :host
        {
            position: fixed;
            padding: 1em  1em  1em  1em;
            background: white;
            z-index: 9999; 
            /*box-shadow: 5px 0px 10px 0px var(--border);*/
            border: 1px solid var(--border)
        }
        
                                    
    </style>
    
    <slot></slot>
    
    `;


class UiPopup extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    }
    
    connectedCallback() 
    {
        if (!this.hasAttribute("manual"))
        {
            this.dom.host.addEventListener("mouseleave", event =>
            {
                this.dispatchEvent(new CustomEvent("close"));
                this.toggleAttribute("hidden", true);
            });
        }
    }

    open(x, y)
    {
        this.dom.host.style.left = `${x}px`;
        this.dom.host.style.top = `${y}px`;;
        this.toggleAttribute("hidden", false);
    }
    
    openAt(u, v, dom)
    {
        let box = dom.getBoundingClientRect();
        
        if (u == "left")
        {
            this.dom.host.style.left = `${box.left}px`;
        }
        if (v == "bottom")
        {
            this.dom.host.style.top = `${box.bottom}px`;;
        }
        
        this.toggleAttribute("hidden", false);
    }
    
    close()
    {
        this.toggleAttribute("hidden", true);
    }
}

customElements.define("ui-popup", UiPopup);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: stretch;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid var(--border);
        }
        
        input 
        {
            border: none;
            background-color: transparent;	
            flex: 1;
            pointer-events:none; 
        }
        
        :host > div 
        {
            display: flex;
            align-items: center;
            padding: 0.75em 1em;
            text-align: left;
        }
        
        :host([open]) > div 
        {
            background-color: var(--panel-header);
            box-shadow: inset 0 -1px 0 rgb(0 0 0 / 13%);
        }
        
        :host(:not([open])) > div 
        {
            background-color: white;
        }
    
        i 
        {     
            cursor: pointer; 
            color: var(--primary);
            margin-left: 0.5em;
            padding: 0.3em;
        }
        
        .opener:after 
        {
            font-family: "Font Awesome 5 Free";
            font-weight: 900;
            color: var(--primary);
            display: inline-block;
            vertical-align: middle;
            float: right;
        }
        :host([open]) .opener:after { content: "\\f107"; }
        :host(:not([open])) .opener:after { content: "\\f106"; }
        
        main 
        { 
            overflow: hidden;
            transition: max-height 0.25s;
        }
        
        :host([open]) main  { max-height: 25em; }
        :host(:not([open])) main { max-height:0; }
        
        slot[name="icon"] 
        { 
            color: grey;
            display: inline-block;
            margin-right: 0.5em; 
        }
        slot[name="actions"] 
        {
            display: inline-block;
            margin-left: 0.5em; 
            flex-shrink: 0;
        } 
        
        :host([selected]) { border: 2px solid var(--primary) }
        
        /*:host([selected]) slot[name="icon"] { color: var(--primary) }*/
        
            
    </style>

    <div>
        <slot name="icon"></slot>
        <input></input><i class="fas fa-edit"></i></input>
        <slot name="actions"></slot>
        <i class="fas opener"></i>
    </div>
    <main>
        <div>
            <slot></slot>
        </div>
    </main>
    
    `;


class UiCollapsible extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['label'];
    }
    
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.querySelector("div").addEventListener("click", event=>
        {
            if (this.hasAttribute("open"))
            {
                this.dispatchEvent(new CustomEvent('click-opened', { bubbles: true, composed: true }));
            }
            else			
            {
                this.dispatchEvent(new CustomEvent('click-closed', { bubbles: true, composed: true }));
            }			
        });
        
        this.input = this.dom.querySelector("input");
        this.input.addEventListener("blur", event => 
        { 
            this.dispatchEvent(new CustomEvent('title-changed', { bubbles: true, composed: true }));
            this.input.style.pointerEvents = "none";	
        });
        this.input.addEventListener('keyup', event =>
        {
            if (event.keyCode == 13) 
            {
                this.blur();
            }
        });
        
        this.edit = this.dom.querySelector(".fa-edit");
        this.edit.addEventListener("click", event =>
        {
            this.input.focus();
            this.input.setSelectionRange(0, this.input.value.length)
            this.input.style.pointerEvents = "auto";	
            event.stopPropagation();
            event.preventDefault();	
        });
        
        this.dom.querySelector(".opener").addEventListener("click", event =>
        {
            if (this.hasAttribute("open"))
            {
                this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            }
            else			
            {
                this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
            }			
            event.stopPropagation();
            event.preventDefault();	
        });		
    }
        
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name === "label")
        {
            this.input.value = newValue;
        }
    }
    
    getTitle()
    {
        return this.input.value;
    }
    
    editTitle()
    {
        this.edit.dispatchEvent(new CustomEvent("click"));
    }

}

customElements.define("ui-collapsible", UiCollapsible);

})();




(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" >
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            display: inline-block;
            height: inherit;
            width: inherit;
            font-size: inherit;
            border: 2px solid var(--primary);
            border-radius: 4px;
            line-height: 1;
        }

        input 
        {
            font-size: inherit;
            min-height: 1em;
            min-width: 1em;
            height: 100%;
            width: 100%;
            appearance: none;
            outline: none;
            transition-duration: 0.3s;
            cursor: pointer;
            padding: 0.15em;
            margin: 0;
            background-clip: content-box;
        }

        input:checked:after
        {
            font-family: "Font Awesome 5 Free" !important;
            font-weight: 900;
            content: "\\f00c";
            font-size: 0.7em;
            color: var(--primary);
            position: absolute;
        }
                
    </style>
    
    <input type="checkbox" />
        
    `;

class UiCheckbox extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['checked'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.dom.querySelector("input").addEventListener("change", event=>
        {
            this.toggleAttribute("checked", event.currentTarget.checked);	
            this.dispatchEvent(new CustomEvent(event.type, event));
        });
    }
    
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        this.dom.querySelector("input").checked = newValue != null && newValue != "false";
    } 

}

customElements.define("ui-checkbox", UiCheckbox);

})();



(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            position: fixed;
            color: white;
            background: black;
            font-size: 1em;
            z-index: 99;
            padding:  0 1.0em;
            border-radius: 0.5em;
        }
        
        i
        {
            margin-right: 0.5em;
        }
        
        ::slotted(*)
        {
            font-size: 1em;
        }

    </style>

    <div>
        <slot></slot>
    </div>
    
    
    `;


class UiTooltip extends HTMLElement 
{
    constructor() 
    {
        super();
            
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
        
        this.timer = null;
        
        this.scrollEvent = (event)=>
        {
            if (this.timer)
            {
                clearTimeout(this.timer);				
            }
            
            document.removeEventListener('scroll', this.scrollEvent);
            this.hidden = true;
        }
    }
    
    connectedCallback()
    {
        
        this.parentElement.addEventListener("mouseenter", event =>
        {
            if (this.timer)
            {
                clearTimeout(this.timer);				
            }

            this.timer = setTimeout(() => 
            {
                let rect = this.parentElement.getBoundingClientRect();
                
                let style = this.dom.host.style;
                
                if (window.innerWidth - rect.right < 100)
                {
                    style.right = `${window.innerWidth-rect.right+8}px`;
                    style.removeProperty("left");
                } 
                else
                {
                    style.left = `${rect.left}px`;
                    style.removeProperty("right");
                }
                
            
                if (rect.bottom > window.innerHeight/2)
                {
                    style.bottom = `${window.innerHeight-rect.top+8}px`;
                    style.removeProperty("top");
                } 
                else
                {
                    style.top = `${rect.bottom+8}px`;
                    style.removeProperty("bottom");
                }

                document.addEventListener('scroll', this.scrollEvent);
                this.hidden = false;
                this.timer = null;
            }, 700);
        });
        
        this.parentElement.addEventListener("mouseleave", event =>
        {
            if (this.timer)
            {
                clearTimeout(this.timer);				
            }
            
            document.removeEventListener('scroll', this.scrollEvent);
            this.hidden = true;
        });
    }
}

customElements.define("ui-tooltip", UiTooltip);

})();



(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

    <style>
    
        :host
        {
            visibility: hidden; 
            position: fixed;
            left: 50%; 
            bottom: 2em; 
        }
        
        :host > div
        {
            margin-left: -50%;
            color: white;
            background: black;
            z-index: 1;
            border-radius: 0.5em;
            text-align: center;
            padding:  0.5em 1.0em;
        }
        
        :host p
        {
            margin-block-start: 0;
            margin-block-end: 0;
        }

        :host([open])
        {
            visibility: visible;
            animation: fadein 0.5s, fadeout 0.5s 2.5s;
        }
        
        @-webkit-keyframes fadein {
          from {bottom: 0; opacity: 0;}
          to {bottom: 30px; opacity: 1;}
        }
        
        @keyframes fadein {
          from {bottom: 0; opacity: 0;}
          to {bottom: 30px; opacity: 1;}
        }
        
        @-webkit-keyframes fadeout {
          from {bottom: 30px; opacity: 1;}
          to {bottom: 0; opacity: 0;}
        }
        
        @keyframes fadeout {
          from {bottom: 30px; opacity: 1;}
          to {bottom: 0; opacity: 0;}
        }
                
    </style>
    
    <div>
        <p><slot></slot></p>
    </div>

    `;

class UiSnackbar extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.appendChild(template.content.cloneNode(true));
    }
    
    show(string)
    {
        if (string)
        {
            this.dom.querySelector("p").textContent = string;
        }
        
        this.dom.host.toggleAttribute("open", true); 
        setTimeout(() =>
        { 
            this.dom.host.toggleAttribute("open", false); 
        }, 3000);		
    }
}

customElements.define("ui-snackbar", UiSnackbar);

})();


