class VxList extends HTMLElement 
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
                }
                    
                ui-collapsible div[slot="actions"] i 
                {
                    cursor: pointer; 
                    color: var(--primary);
                    padding: 0.3em;
                }	

                ui-collapsible div[slot="actions"] i.fa-eye-slash 
                {
                    color: var(--border);
                }

            </style>
            
            <div>
            </div>
            
            <slot name="actions"></slot>
        `;
        
        this.div = this.dom.querySelector("div")
        this.div.addEventListener("click-closed", event=>
        {
            let selected = this.div.querySelector("[selected]");
            if (selected)
            {
                this.viewer.post(selected.firstElementChild.type+".unselect", { id:selected.firstElementChild.id });
            }
            
            event.target.toggleAttribute("open", true);
            let panel = event.target.firstElementChild;
            
            this.viewer.post(panel.type+".select", { id:panel.id }, {  });
            
            this.dispatchEvent(new CustomEvent('item-focus', { bubbles: true, composed: true, detail: { id: event.target.firstElementChild.id, type: event.target.firstElementChild.type }} ));
        });
        
        this.div.addEventListener("click-opened", async(event) =>
        {
            if (!event.target.hasAttribute("selected"))
            {
                let selected = this.div.querySelector("[selected]");
                if (selected)
                {
                    this.viewer.post(selected.firstElementChild.type+".unselect", { id:selected.firstElementChild.id });
                }
                this.viewer.post(event.target.firstElementChild.type+".select", { id:event.target.firstElementChild.id });
            }
            else
            {
                event.target.removeAttribute("open");
            }
            this.dispatchEvent(new CustomEvent('item-focus', { bubbles: true, composed: true, detail: { id: event.target.firstElementChild.id, type: event.target.firstElementChild.type }} ));
        });
        
        this.div.addEventListener("close", event=>
        {
            event.target.toggleAttribute("open", false);
        });
        
        this.div.addEventListener("open", event=>
        {
            event.target.toggleAttribute("open", true);
        });
    }
    
    attach(viewer)
    {
        this.viewer = viewer;

        this.viewer.on("viewer.unload", document =>
        {
            while (this.div.firstElementChild)
            {
                this.div.firstElementChild.remove();
            }
        });
        
        this.viewer.on(["line.create", "polygon.create", "floodfill.create", "point.create","import.create"], (geometry, meta, action) =>
        {
            if (!meta.vxPanel)
            {
                return;
            }
            
            let panel = document.createElement(meta.vxPanel);
            let icon = document.createElement("i");
            icon.setAttribute("slot", "icon");
            icon.setAttribute("class", `fas ${meta.vxIcon}`);
            
            delete meta.vxIcon;
            delete meta.vxPanel;
            
            if (panel)
            {
                if (action == "import.create")
                {
                    panel.id = meta.id;
                    panel.type = meta.type;
                }
                else
                {
                    panel.id = geometry.id;
                    panel.type = geometry.type;
                }
                panel.attach(viewer, meta);
                
                let actions = document.createElement("div");
                actions.setAttribute("slot", "actions");
                if (this.hasAttribute("deletable"))
                {
                    let icon = document.createElement("i");;
                    icon.setAttribute("class", "fas fa-trash");
                    icon.addEventListener("click", event =>
                    {
                        let collabsible = event.currentTarget.closest("ui-collapsible");;
                        this.viewer.post(`${collabsible.firstElementChild.type}.delete`, { id: collabsible.firstElementChild.id  });
                        event.stopPropagation();
                        event.preventDefault();	
                    });
                    actions.appendChild(icon);
                    
                }
                
                if (this.hasAttribute("hideable"))
                {
                    let icon = document.createElement("i");;
                    icon.setAttribute("class", "fas fa-eye");
                    icon.toggleAttribute("visibility");
                    icon.addEventListener("click", event =>
                    {
                        let collabsible = event.currentTarget.closest("ui-collapsible");;
                        let classList = event.currentTarget.classList;
                        
                        if (classList.contains("fa-eye"))
                        {
                            this.viewer.post(`${collabsible.firstElementChild.type}.update`, { id: collabsible.firstElementChild.id, visible: false  });
                        }
                        else if (classList.contains("fa-eye-slash"))
                        {
                            this.viewer.post(`${collabsible.firstElementChild.type}.update`, { id: collabsible.firstElementChild.id, visible: true  });
                        }
                        event.stopPropagation();
                        event.preventDefault();	
                    });
                    actions.appendChild(icon);
                }
                    
                
                let collapsible = document.createElement("ui-collapsible");
                if (meta.vxOpen)
                {
                    delete meta.vxOpen;
                    collapsible.toggleAttribute("open");
                }
                collapsible.setAttribute("label", meta.name);
                collapsible.appendChild(panel)
                collapsible.appendChild(icon)
                collapsible.appendChild(actions)
                
                this.div.insertBefore(collapsible, this.div.firstElementChild);
            }
        });
            
        this.viewer.on(["line.delete", "polygon.delete", "floodfill.delete", "point.delete","import.delete"], (args, custom) =>
        {
            let panel = this.dom.getElementById(args.id);
            if (panel)
            {
                panel.parentElement.remove();
            }
        });

        this.viewer.on(["line.dblclick","polygon.dblclick","floodfill.dblclick","point.dblclick"], (args)=>
        {
            let selected = this.div.querySelector("[selected]");
            if (selected)
            {
                this.viewer.post(selected.firstElementChild.type+".unselect", { id:selected.firstElementChild.id });
            }
            
            this.viewer.post(args.type+".select", { id:args.id });
            
            let panel = this.dom.getElementById(args.id);
            if (panel)
            {
                panel.parentElement.toggleAttribute("open", true);
            }
        });
        
        this.viewer.on(["import.dblclick"], (args)=>
        {
            let selected = this.div.querySelector("[selected]");
            if (selected)
            {
                this.viewer.post(selected.firstElementChild.type+".unselect", { id:selected.firstElementChild.id });
            }
            
            this.viewer.post("import.select", { id:args.id });
        });		
        
        this.viewer.on(["line.select","polygon.select","floodfill.select","point.select","import.select"], (args, custom)=>
        {
            let panel = this.dom.getElementById(args.id);
            if (panel)
            {
                panel.parentElement.toggleAttribute("selected", true);
            }
        });
                
        this.viewer.on(["line.unselect","polygon.unselect","floodfill.unselect","point.unselect","import.unselect"], (args)=>
        {
            let panel = this.dom.getElementById(args.id);
            if (panel)
            {
                panel.parentElement.toggleAttribute("selected", false);
            }
        });
        
        this.viewer.on(["line.update","polygon.update","floodfill.update","point.update","import.update"], (args)=>
        {
            if (args.hasOwnProperty("visible"))
            {
                if (this.hasAttribute("hideable"))
                {
                    let panel = this.dom.getElementById(args.id);
                    
                    if (panel)
                    {
                        let icon = panel.parentElement.querySelector("i[visibility]");
                        
                        let classList = icon.classList;
                        classList.toggle("fa-eye", args.visible)
                        classList.toggle("fa-eye-slash", !args.visible)
                    }
                }					
            }
        });
        
        this.viewer.on("viewer.dblclick",  (args) =>
        {
            let collapsible = this.div.querySelector("[selected]");
            if (collapsible)
            {
                this.viewer.post(collapsible.firstElementChild.type+".unselect", { id:collapsible.firstElementChild.id });
            }
        });
    }
    
    async save(object)
    {
        object.polygon = {};
        object.line = {};
        object.floodfill = {};
        object.point = {};
        object.import = {};
        
        let list = await this.viewer.wait("*.get");
        for (var id in list)
        {
            let element = this.dom.getElementById(id);
            if (element)
            {
                if (element.save)
                {
                    element.save();
                }
                
                let type = object[list[id].type];
                
                type[id] = list[id];
                if (element.meta)
                {
                    type[id].meta = element.meta;
                    type[id].meta.name = element.parentElement.getTitle();
                }
            }
        }
    }
}

customElements.define("vx-list", VxList);

