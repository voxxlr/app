class VaDocuments extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['processing'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        
        this.dom.innerHTML = `

            <link rel="stylesheet" href="${window.app_source}/ui.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <style>
            
                :host
                {
                    display: flex;
                    flex-direction: column;
                    overflow-y: hidden;
                }
    
                header
                {
                    display: flex;
                    align-items:stretch;
                    justify-content:flex-start;
                    margin-bottom: 0.5em;
                }
                
                ui-tag-list 
                { 
                    display: flex;
                    margin-left: 1em; 
                }

                ui-tag-input 
                { 
                    width: 6em
                    margin-right: 0.5em; 
                }
                
                ui-list 
                { 
                    width: 100%;
                    overflow-y: scroll;
                    display: grid;
                    justify-content: start;
                    grid-gap: 10px;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    grid-auto-rows: minmax(120px, 120px);					
                }
                
                ui-list > div
                {
                    cursor: pointer;
                    float: left;
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box; 
                    height: 120px;
                }
                
                ui-list img 
                {
                    margin: 0px;
                    padding: 0px;
                    width: 100%;
                    height: 100%;
                }
                                
                ui-list p 
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
                
                    
            </style>
            
            <header>
                <ui-button-group single>
                    <button name="cloud" class="vx-secondary">Cloud</button>
                    <button name="model" class="vx-secondary">Model</button>
                    <button name="map" class="vx-secondary">Map</button>
                    <button name="panorama" class="vx-secondary">360</button>
                </ui-button-group>
                <ui-tag-list>
                    <ui-tag-input  placeholder="tags..." type="text" ></ui-tag-input>
                </ui-tag-list>
            </header>	
            <ui-list>
            </ui-list>
        `;		

        //
        // Search
        //
        
        this.dom.querySelector("ui-tag-list").addEventListener("tags-changed", event =>  
        {
            this.tags = event.detail;
            this.clear()
            this.load();
        })
        
        let group = this.dom.querySelector("ui-button-group");
        group.addEventListener("change", event => 
        {
            let button = group.querySelector("button[active]");
            if (button)
            {
                this.type = button.getAttribute("name");
            }
            else
            {
                this.type = null;
            }
            
            this.clear()
            this.load();
        });

        
        //
        //  List
        //
        
        this.capacity = 0;
        this.cursor = null;
        this.limit = 10;
        this.tags = [];
            
        this.list = this.dom.querySelector("ui-list");
        
        this.list.addEventListener('scroll', (event) =>
        {
            if(event.currentTarget.scrollHeight - (event.currentTarget.clientHeight + event.currentTarget.scrollTop) < 50)
            {
                this.load();
            }
        }); 
    }
    
    connectedCallback() 
    {
        let observer = new ResizeObserver(entries => 
        {
            let rect = entries[0].contentRect;
            // observe resize and adjust style
            this.capacity = Math.ceil(rect.width/250)*Math.ceil(rect.height/150);
            if (this.capacity >= this.list.children.length)
            {
                this.load();
            }
        });
        observer.observe(this.list);
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "processing")
        {
            this.clear();
            this.load();
        }
    }

    clear()
    {
        this.dispatchEvent(new CustomEvent('clear-datasets', { bubbles: true, composed: true }));
    
        this.list.clear();
        this.allLoaded = false;
        this.cursor = null;
    }
    
    add(entry)
    {
        var div = document.createElement("div");
        div.id = entry.id; 
        div.content = entry;
        
        var image = document.createElement("img");
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

        this.list.appendChild(div);
    }
        
    update(div)
    {
        let content = div.content;
        div.querySelector("img").src = content.meta.preview;
        div.querySelector("p").textContent = content.meta.name;
    }
    
    load()
    {
        if (!this.loading && !this.allLoaded)
        { 
            this.loading = true;
            //this.dom.querySelector("#search").toggleAttribute("disabled", true);
            console.log(window.doc_domain)
            fetch(`${window.doc_domain}/list`, 
            { 
                method: 'POST', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.getAttribute("key")}`, 
                 'Content-Type': "application/json",
                }),
                body: JSON.stringify({ token: 3600, type: this.type, tags: this.tags, limit: this.limit, cursor: this.cursor, meta: ["preview", "name", "description"] })
            }).then(async (response) => 
            {
                if (response.ok)
                {
                    let set = await response.json();
                    
                    this.cursor = set.cursor;
                    this.allLoaded = set.content.length == 0;
                    
                    this.dispatchEvent(new CustomEvent('load-datasets', { bubbles: true, composed: true, detail: JSON.stringify(set.content) }));
                    
                    set.content.forEach(entry => this.add(entry));
                    if (this.capacity >= this.list.children.length)
                    {
                        this.loading = false;
                        this.load();
                    }
                    else
                    {
                        this.loading = false;
                        //this.dom.querySelector("#search").toggleAttribute("disabled", false);
                    }
                }
                else
                {
                    this.loading = false;
                    //this.dom.querySelector("#search").toggleAttribute("disabled", false);
                }
            });
        }
        else if (this.allLoaded)
        {
            //this.dom.querySelector("#search").toggleAttribute("disabled", false);
        }
    }
}

customElements.define("va-documents", VaDocuments);

