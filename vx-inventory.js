class VxInventory extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

            <style>
            
                :host 
                { 
                    width: 80vw;
                    height: 80vh;
                    display: flex;
                }
            
                ui-tab { flex: 1 }		
                
                aside
                {
                    width: 20em;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                }
                aside > div
                {
                    position: relative;
                    overflow-y: auto;
                    padding-left: 1em;
                    margin-bottom: 1em;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                aside > button { margin-left: 1em; }
                
                #list 
                { 
                    width: 100%; 
                    height: 100%;
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    grid-auto-rows: 170px;
                    grid-gap: 4px;
                    overflow-y: scroll;
                    background: var(--border);
                }
                    
                div.entry 
                {
                    position: relative;
                    cursor: pointer;
                    transition: .5s ease;
                    text-align: center
                }
                div.entry.no-image img { opacity: 1.0; }
                div.entry.no-image div { opacity: 1.0; }
                div.entry:hover img { opacity: 0.3; }
                div.entry:hover div { opacity: 1.0; }
                div.entry[selected] img { opacity: 0.3; }
                div.entry[selected] div { opacity: 1.0; }
                div.entry[selected] { background-color: var(--primary-transparent) }
                
                div.entry > div
                {
                    opacity: 0;
                    transition: .5s ease;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                
                div.entry .text
                {
                    background-color: var(--primary);
                    transition: .5s ease;
                    color: white;
                    padding: 0.5em 1em;
                }

                div.entry > img
                {
                    transition: .5s ease;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
    
            </style>
            
            <ui-tab tabs="list,map">
                <div slot="map" label="Map">
                    <vx-viewer></vx-viewer>
                </div>
                <div slot="list" label="Listing">
                    <div id="list"></div>
                </div>
            </ui-tab>
            
            <aside>
                <div>
                    <slot></slot>
                </div>
                <button disabled class="vx-primary">Load Dataset...</button>
            </aside>
            
            <template>
                <div class="entry">
                    <img>
                    <div>
                        <div class="text"><div>
                    </div>
                </div>
            </template>
            
        `;
                
        this.selected = null;
                
        //
        // Map
        // 

        this.pin = {  type: "point", };
        this.pin.code =
        {
             render2d: encodeURI(function(ctx, state)
             {
                let a = this.radius/2;
            
                ctx.drawImage(U.icon[this.status], -a, -a, this.radius, this.radius);
                if (this.selected)
                {
                    ctx.beginPath();
                    ctx.strokeStyle = "#0075FF";
                    ctx.lineWidth = 4;
                    ctx.arc(0, 0, this.radius/1.47, 0, 2*Math.PI);
                    ctx.stroke();
                }
                return false;
             }.toString()),
         
             intersect: encodeURI(function(ctx, x, y, state)
             {
                var r = this.radius/1.47*state.scale;
                var dx = state.x - x;
                var dy = state.y - y;
                return dx*dx+dy*dy < r*r;
             }.toString()),
        }
        this.pin.scope = { radius: 30 };
        this.pin.activation = { easing: "Linear", p0: 2, p1: 6 }

        this.viewer = this.dom.querySelector("vx-viewer");
        this.viewer.on("viewer.load", async  (args, custom) => 
        {
            this.viewer.post("splitter", { u: 1, v: 1, visible:false });
            
            //"https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiam9jaGVuc3RpZXIiLCJhIjoiY2s4cTZweWh4MDBycDNlcThtdGtkNzAwbyJ9.sSmRS_ITSl95JqGyOaPbcA" })));
            //"https://tile.stamen.com/toner/{z}/{x}/{y}.png" })));
            
            this.viewer.post("import.create", { id: "map", source: { data: "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }, type: "wmts", maxZoom: 19 });
            
            this.viewer.post("viewer.update", { code: encodeURI(function()
                     {
                        U.icon = [
                            new Image(),
                            new Image(),
                            new Image(),
                            new Image(),
                            new Image(),
                        ];
                        
                        U.icon[0].src = "https://voxxlr.github.io/app/voxxlr/inspect/pinGrey.webp";  
                        U.icon[1].src = "https://voxxlr.github.io/app/voxxlr/inspect/pinGreen.webp"; 
                        U.icon[2].src = "https://voxxlr.github.io/app/voxxlr/inspect/pinBlue.webp"; 
                        U.icon[3].src = "https://voxxlr.github.io/app/voxxlr/inspect/pinOrange.webp";  
                        U.icon[4].src = "https://voxxlr.github.io/app/voxxlr/inspect/pinRed.webp";  
                        
                        U.redIcon = new Image();
                        U.redIcon.src = "https://voxxlr.github.io/app/voxxlr/inspect/pinRed.webp";
                     }.toString())
            });
            
            this.setView(0, 40.5768877, 3);
            
        });

        // 
        this.viewer.on(["point.click"], async (args)=>
        {
            if (this.selected)
            {
                this.viewer.post(`point.update`, { id: this.selected.id, scope: { selected: false } });
                this.unselectOnList(this.selected);
            }
            
            this.selected = args;
            
            // not so nice but necessary
            this.selected.token = args.meta.token;
            delete args.meta.token;
            // not so nice but necessary
            
            this.dom.querySelector("aside > button").disabled = false;
            this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: args.meta }));
            this.selectOnList(args);
            this.viewer.post(`point.update`, { id: args.id, scope: { selected: true } });
        });


        //
        // List
        // 
        this.template = this.dom.querySelector("template");

        this.listing = this.dom.getElementById("list");
        this.scrollHandler = async (event) =>
        {
            if(event.currentTarget.scrollHeight - (event.currentTarget.clientHeight + event.currentTarget.scrollTop) < 50)
            {
                this.listing.removeEventListener('scroll',this.scrollHandler);
                await this.list();
                this.listing.addEventListener('scroll',this.scrollHandler);
            }
        }
        this.listing.addEventListener('scroll',this.scrollHandler); 
        this.listing.addEventListener("click", async (event) =>
        {
            let div = event.target.closest("div.entry");
            if (div)
            {
                let selected = this.listing.querySelector("div[selected]");
                if (selected)
                {
                    if (selected != div)
                    {
                        this.dispatchEvent(new CustomEvent('dataset-unselect', { bubbles: true, composed: true, detail: selected.content }));
                        selected.toggleAttribute("selected", false);
                        this.unselectOnMap(selected.content);

                        this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: div.content }));
                        div.toggleAttribute("selected", true);
                        this.selectOnMap(div.content);
                    }
                }
                else
                {
                    this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: div.content }));
                    div.toggleAttribute("selected", true);
                    this.selectOnMap(div.content);
                }
                
                this.selected = div.content;
                this.dom.querySelector("aside > button").disabled = false;
            }
        });
        this.listing.addEventListener("dblclick", async (event) =>
        {
            this.dom.querySelector("aside > button").dispatchEvent(new CustomEvent("click"));
        });

        
        this.tab = this.dom.querySelector("ui-tab");
        
        this.dom.querySelector("aside > button").addEventListener("click", event =>
        {
            this.dispatchEvent(new CustomEvent('dataset-load', { detail: this.selected }));
            
            window.parent.postMessage({ action: "dataset-load", dataset: this.selected }, "*");

        });
    }
        
    connectedCallback() 
    {/*
        this.viewer.domain = this.getAttribute("domain");
        this.viewer.init(JSON.stringify({ id: "wmts", source: { data: "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }, type: "wmts", maxZoom: 19 }));
        */
        
        this.viewer.iframe.src = "https://doc.voxxlr.com/viewer/2D.html";
        this.viewer.iframe.onload = async (event) =>
        {
            await this.list(); 
            await this.search();
        };
        
        
        this.meta = ["name", "description", "preview"];
        if (this.hasAttribute("meta"))
        {
            this.meta.push(...this.getAttribute("meta").split(","))
        }
        
        this.tags = [];
        if (this.hasAttribute("tags"))
        {
            this.tags.push(...this.getAttribute("tags").split(","))
        }
    }
    
    async reload()
    {
        this.tags = [];
        if (this.hasAttribute("tags"))
        {
            this.tags.push(...this.getAttribute("tags").split(","))
        }
        
        while (this.listing.firstElementChild)
        {
            this.listing.firstElementChild.remove();
        }
        
        this.listing.allLoaded = false;
        this.listing.cursor = null;
        
        await this.list(); 
        await this.search();
    }
    
    setView(lon,lat, zoom)
    {
        let x = 256*((lon+180)/360); 
        let y = 256*((1-Math.log(Math.tan(lat*Math.PI/180) + (1/Math.cos(lat*Math.PI/180)))/Math.PI)/2);
        this.viewer.post("camera", { position: { x,y }, zoom });
    }

    select(dataset)
    {
        if (dataset)
        {
            if (this.selected)
            {
                if (this.selected.id != dataset.id)
                {
                    this.unselectOnMap(this.selected);
                    this.unselectOnList(this.selected);
                }
            }
            this.selectOnMap(dataset);
            this.selectOnList(dataset);
            this.selected = dataset;
            this.dispatchEvent(new CustomEvent('dataset-select', { bubbles: true, composed: true, detail: dataset }));
        }
        else
        {
            this.setView(0, 40.5768877, 3);
            this.dom.querySelector("aside > button").disabled = true;
        }
    }

    //
    // Map
    //
    
    unselectOnMap(dataset)
    {
        if (dataset.location)
        {
            this.viewer.post(`point.update`, { id: dataset.id, scope: { selected: false } });
        }
    }
        
    selectOnMap(dataset)
    {
        if (dataset.location)
        {
            this.setView(dataset.location.lon, dataset.location.lat, 17)
            this.viewer.post(`point.update`, { id: dataset.id, scope: { selected: true } });
        }
        else
        {
            this.setView(0, 40.5768877, 3);
        }
    }
    
    async search()
    {
        return fetch('https://app.voxxlr.com/search', 
        { 
            method: 'POST', 
            headers: new Headers({
             'Authorization': `Bearer ${this.getAttribute("key")}`, 
             'Content-Type': "application/json",
             }),
            body: JSON.stringify({ type: this.getAttribute("type"), tags: this.tags, meta: this.meta })
        }).then(async (response) => 
        {
            if (response.ok)
            {
                let set = await response.json();
                set.forEach(entry => 
                {
                    this.pin.id = entry.id;
                    this.pin.point = {
                            x: 256*((entry.location.lon+180)/360),
                            y: 256*((1-Math.log(Math.tan(entry.location.lat*Math.PI/180) + (1/Math.cos(entry.location.lat*Math.PI/180)))/Math.PI)/2), 
                            z: 0
                        }
                    this.pin.meta = entry;
                    this.pin.scope.status = entry.meta.status || 0;
                    this.viewer.post("point.create", this.pin, {});		
                })
            }
        });
    }


    //
    // List
    //

    selectOnList(dataset)
    {
        let selected = this.dom.getElementById(dataset.id);
        if (selected)
        {
            selected.toggleAttribute("selected", true);
        }
    }

    unselectOnList(dataset)
    {
        let selected = this.dom.getElementById(dataset.id);
        if (selected)
        {
            selected.toggleAttribute("selected", false);
        }		
    }


    async list()
    {
        if (!this.listing.allLoaded)
        { 
            return fetch('https://app.voxxlr.com/list', 
            { 
                method: 'POST', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.getAttribute("key")}`, 
                 'Content-Type': "application/json",
                }),
                body: JSON.stringify({ token: 3600, type: this.getAttribute("type"), tags: this.tags, meta: this.meta, limit: 30, cursor: this.listing.cursor })
            }).then(async (response) => 
            {
                if (response.ok)
                {
                    let set = await response.json();
                    set.content.forEach(entry => 
                    {
                        let template = this.template.content.cloneNode(true);
            
                        let div = template.firstElementChild; 
                        div.classList.add('entry');
                        div.id = entry.id; 
                        div.content = entry; 
                        var image = div.querySelector("img");
                        if (entry.meta.preview)
                        {
                            image.src = entry.meta.preview;
                            image.onerror = function()
                            { 
                                this.src="https://voxxlr.github.io/app/voxxlr/inventory/images/camera.webp";
                                this.parentElement.classList.add("no-image")
                            }
                        }
                        else
                        {
                            image.src="https://voxxlr.github.io/app/voxxlr/inventory/images/camera.webp";
                            image.parentElement.classList.add("no-image")
                        }
                        div.querySelector(".text").textContent = entry.meta.name;

                        this.listing.appendChild(template);
                    });
                    
                    this.listing.cursor = set.cursor;
                    this.listing.allLoaded = set.content.length == 0;
                    if (this.listing.scrollHeight < this.listing.clientHeight)
                    {
                        await this.list();
                    }
                }
            });
        }
        else
        {
            return Promise.resolve();
        }
    }
    
    update(id, status)
    {
        this.viewer.post(`point.update`, { id, scope: { status } });
    }
}

customElements.define("vx-inventory", VxInventory);



class VxDatasetInfo extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

            <style>
            
                :host 
                { 
                }
    
            </style>

            <h3></h3>
            <p></p>			
            <div>
            </div>
        `;
        
    }
        
    connectedCallback() 
    {
        this.parentElement.addEventListener("dataset-select", event=>
        {
            this.dom.querySelector("h3").textContent = event.detail.meta.name;
            this.dom.querySelector("p").textContent = event.detail.meta.description;
            
            let div = this.dom.querySelector("div");
            while (div.firstElementChild)
            {
                div.firstElementChild.remove();
            }
            
            let tags = event.detail.tags || [];
            tags.forEach(entry =>
            {
                if (entry.length > 0) // remove this test sometimes
                {
                    let tag = document.createElement("ui-tag");
                    tag.textContent = entry;
                    tag.toggleAttribute("disabled", true);
                    div.appendChild(tag);
                } 
            });
        });
    }
}

customElements.define("vx-dataset-info", VxDatasetInfo);




class VxSearchFilter extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">

            <style>
            
                :host 
                { 
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
            
                header { margin-top: 1em }
                main { margin-top: 1em }
                
                ui-tag-list { margin-top: 0.5em }
    
            </style>

            <main>
                <ui-button-group single>
                    <button name="cloud" class="vx-secondary">Cloud</button>
                    <button name="model" class="vx-secondary">Model</button>
                    <button name="map" class="vx-secondary">Map</button>
                    <button name="panorama" class="vx-secondary">360</button>
                </ui-button-group>
                <ui-tag-list>
                    <ui-tag-input  placeholder="tags..." type="text" ></ui-tag-input>
                </ui-tag-list>
            </main>	

        `;
        
        this.dom.querySelector("ui-tag-list").addEventListener("tags-changed", event =>  
        {
            this.parentElement.setAttribute("tags", event.detail);
            this.parentElement.reload();
        })
        
        let group = this.dom.querySelector("ui-button-group");
        group.addEventListener("change", event => 
        {
            let button = group.querySelector("button[active]");
            if (button)
            {
                this.parentElement.setAttribute("type", button.getAttribute("name"));
            }
            else
            {
                this.parentElement.removeAttribute("type");
            }
            this.parentElement.reload();
        });
        
    }
        
    connectedCallback() 
    {
    }
}

customElements.define("vx-search-filter", VxSearchFilter);
