class VxListing extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['tags', 'exclude'];
    }
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        
        this.dom.innerHTML = `

            <style>
            
                :host
                {
                    display: flex;
                    overflow: hidden;
                }
    
                :host > div
                {
                    flex: 1;
                    overflow-y: scroll;
                    display: flex;
                    flex-wrap: wrap;
                }
                
                div.entry 
                {
                    cursor: pointer;
                    float: left;
                    margin: 0px;
                    margin: 8px 4px 0px 4px;				    
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box; 
                }
                
                img 
                {
                    margin: 0px;
                    padding: 0px;
                    width: 100%;
                    height: 100%;
                }
                                
                p 
                {
                    position:relative; 
                    bottom: 2em;
                    height: 2em;
                    line-height: 2em;
                    padding: 0px;
                    margin: 0px;
                    text-align: center;
                    vertical-align: middle;
                    color: white;			
                    display:block;
                    background-color: rgba(0, 0, 0, 0.5);
                }
    
                div.entry.selected { border: 2px solid var(--primary); }
                div.entry.selected > p
                {
                    background-color: var(--primary);
                    opacity: 0.5;
                }
                
                :host([draggable]) div.entry.selected { cursor: move }		
                    
            </style>
            
            <slot name="actions"></slot>
            <div>
            </div>
            <slot></slot>
        `;		
        
        this.capacity = 0;
        this.cursor = null;
        this.limit = 10;
        this.tags = [];
        this.exclude = [];
        
        this.container = this.dom.querySelector(":host > div");
        
        this.scrollHandler = async (event) =>
        {
            if(event.currentTarget.scrollHeight - (event.currentTarget.clientHeight + event.currentTarget.scrollTop) < 50)
            {
                this.container.removeEventListener('scroll',this.scrollHandler);
                await this.load();
                this.container.addEventListener('scroll',this.scrollHandler);
            }
        }
        this.container.addEventListener('scroll',this.scrollHandler); 
        
        this.dom.addEventListener("click", this.click.bind(this));
        this.dom.addEventListener("dblclick", this.dblclick.bind(this));
        
        this.dom.addEventListener("dragstart", event => 
        {
            event.dataTransfer.setData("json/content", event.target.closest("div").content.token);
        })
        this.dom.addEventListener("dragend",  event => 
        {
            this.dispatchEvent(new CustomEvent('dragend', { bubbles: true, composed: true, detail: event.target.closest("div").content.token }));
        });
        
        this.overlay = this.dom.querySelector('slot[name="actions"]');
        this.overlay.remove();
    }
    
    connectedCallback() 
    {
        this.meta = ["name", "description", "preview"];
        if (this.hasAttribute("meta"))
        {
            this.meta.push(...this.getAttribute("meta").split(","))
        }
        
        this.dragEnabled = this.hasAttribute("draggable");
        //this.removeAttribute("draggable");
        
        this.exclude = [];
    }
    
    attributeChangedCallback(name, oldValue, newValue) 
    {
        if (name == "tags")
        {
            if (newValue)
            {
                this.tags = newValue.split(",");	
            }
            else
            {
                this.tags = [];			
            }
        }
        else if (name == "exclude")
        {
            if (newValue)
            {
                this.exclude = [];
                newValue.split(",").forEach(id =>
                {
                    this.exclude.push(parseInt(id));
                })
            }
            else
            {
                this.exclude = [];
            }
        }
    }
    
    clear()
    {
        let selected = this.container.querySelector("div.selected");
        if (selected)
        {
            this.dispatchEvent(new CustomEvent('dataset-unselect', { bubbles: true, composed: true, detail: selected.content }));
            this.dispatchEvent(new CustomEvent('dataset-change', { bubbles: true, composed: true, detail: { from: selected.content, to: null }} ));
        }
        
        this.container.querySelectorAll("div").forEach(entry => entry.remove());
        this.allLoaded = false;
        this.cursor = null;
    }
    
    add(entry)
    {
        var div = document.createElement("div");
        div.classList.add('entry');
        div.id = entry.id; 
        div.content = entry;
        
        var image = document.createElement("img");
        image.toggleAttribute("draggable", this.dragEnabled)
        if (entry.meta.preview)
        {
            image.src = entry.meta.preview;
        }
        image.onerror = function()
        { 
            this.src=`${window.app_source}/voxxlr/inventory/images/camera.webp`;
        }
        div.appendChild(image);
        
        var p = document.createElement("p");
        p.textContent = entry.meta.name;
        div.appendChild(p);

        this.container.appendChild(div);
    }
    
    async load()
    {
        if (!this.allLoaded)
        { 
            return fetch(`${window.doc_domain}/list`, 
            { 
                method: 'POST', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.getAttribute("key")}`, 
                 'Content-Type': "application/json",
                 }),
                body: JSON.stringify({ token: 3600, type: this.getAttribute("type"), tags: this.tags, limit: this.limit, cursor: this.cursor, meta: this.meta })
            }).then(async (response) => 
            {
                if (response.ok)
                {
                    let set = await response.json();
                    set.content.forEach(entry => 
                    {
                        if (!this.exclude.includes(entry.id))
                        {
                            this.add(entry);	
                        }				
                    });
                    
                    this.cursor = set.cursor;
                    this.allLoaded = set.content.length == 0;
                    if (this.container.scrollHeight < this.container.clientHeight)
                    {
                        await this.load();
                    }
                }
            });
        }
        else
        {
            return Promise.resolve();
        }
    }

    get(id)
    {
        return this.dom.getElementById(id);
    }
    
    unselect(notify)
    {
        let div = this.container.querySelector("div.selected");
        if (div)
        {
            this.overlay.remove();
            div.classList.toggle("selected", false);
            if (notify)
            {
                this.dispatchEvent(new CustomEvent('dataset-unselect', { bubbles: true, composed: true, detail: div.content }));
                this.dispatchEvent(new CustomEvent('dataset-change', { bubbles: true, composed: true, detail: { from: div.content, to: null  }} ));
            }
            return div.content;
        }		
        return null;
    }
        
    select(id, notify)
    {
        let from;
        let to;
        
        let selected = this.container.querySelector("div.selected");
        if (selected && selected.content.id != id)
        {
            from = selected.content;
            this.overlay.remove();
            selected.classList.toggle("selected", false);
            if (notify)
            {
                this.dispatchEvent(new CustomEvent('dataset-unselect', { bubbles: true, composed: true, detail: selected.content }));
            }
        }
                
        if (id)
        {
            let div = this.dom.getElementById(id);
            if (div)
            {
                to = div.content;
                div.appendChild(this.overlay);
                div.classList.toggle("selected", true);		
                if (notify)
                {
                    this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: div.content }));
                }
            }
        }
        
        if (from || to)
        {
            if (notify)
            {
                this.dispatchEvent(new CustomEvent('dataset-change', { bubbles: true, composed: true, detail: { from, to } }));
            }
        }
    }

    remove(document)
    {
        let div = this.dom.getElementById(document.id);
        if (div)
        {
            div.remove();
        }		
    }

    click(event)
    {
        let div = event.target.closest("div.entry");
        if (div)
        {
            let selected = this.container.querySelector("div.selected");
            if (selected)
            {
                if (selected != div)
                {
                    this.dispatchEvent(new CustomEvent('dataset-unselect', { bubbles: true, composed: true, detail: selected.content }));
                    selected.classList.toggle("selected", false);

                    div.appendChild(this.overlay);
                    this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: div.content }));
                    div.classList.toggle("selected", true);
                    
                    this.dispatchEvent(new CustomEvent('dataset-change', { bubbles: true, composed: true, detail: { from: selected.content, to: div.content }} ));
                }
            }
            else
            {
                div.appendChild(this.overlay);
                this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: div.content }));
                div.classList.toggle("selected", true);
                
                this.dispatchEvent(new CustomEvent('dataset-change', { bubbles: true, composed: true, detail: { from: null, to: div.content }} ));
            }
        }
    }
    
    dblclick(event)
    {
        let div = event.target.closest("div.entry");
        if (div)
        {
            this.dispatchEvent(new CustomEvent('dataset-dblclick', { bubbles: true, composed: true, detail: div.content }));
        }
    }
    
    empty()
    {
        return this.container.firstElementChild == null;
    }
}

customElements.define("vx-listing", VxListing);

