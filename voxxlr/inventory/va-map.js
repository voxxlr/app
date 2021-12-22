class VaMap extends HTMLElement 
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
                    position: relative;
                }
            
                vx-viewer { width: 100%; height: 100% }		
                
                ui-button-group
                {
                    position: absolute;
                    left: 0.5em;
                    top: 0.5em;
                }
                
                #edit[active] i:after 
                { 
                    vertical-align: middle;
                    position:relative;
                    font-family: "Font Awesome 5 Free";
                    display: inline-block;
                    content: "\\f0e2"; 
                }
                
                #edit:not([active]) i:after 
                { 
                    vertical-align: middle;
                    position:relative;
                    font-family: "Font Awesome 5 Free";
                    display: inline-block;
                    content: "\\f304"; 
                }


            </style>
            
            <vx-viewer>
            </vx-viewer>
            <ui-button-group>
                <button id="edit" class="vx-secondary"><i class="fas fa-2x"></i></button>
                <button id="save" class="vx-secondary" disabled><i class="fas fa-2x fa-save" disabled></i></button>
            </ui-button-group>
        `;
                
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
        this.pin.scope = { radius: 30, status: 1 };

        this.pin.activation = 
        {
            easing: "Linear", 
            p0: 2, 
            p1: 6
        }


        this.viewer = this.dom.querySelector("vx-viewer");
        this.viewer.on("viewer.load", async  (args, custom) => 
        {
            this.viewer.post("splitter", { u: 1, v: 1, visible:false });
            
            this.viewer.post("import.create", { id: "map", source: { data: "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }, type: "wmts", maxZoom: 19 });
            this.viewer.post("viewer.update", { code: encodeURI(function()
                     {
                        U.icon = [
                            new Image(),
                            new Image(),
                            new Image(),
                            new Image(),
                        ];
                        
                        U.icon[0].src = `https://voxxlr.github.io/app/voxxlr/inventory/images/pin.webp`; 
                        U.icon[1].src = `https://voxxlr.github.io/app/voxxlr/inventory/images/pin.webp`; 
                        U.icon[2].src = `https://voxxlr.github.io/app/voxxlr/inventory/images/pin.webp`; 
                        U.icon[3].src = `https://voxxlr.github.io/app/voxxlr/inventory/images/pin.webp`; 
                     }.toString())
            });
            
            
            this.setView(0, 40.5768877, 3)
        });

        this.viewer.on(["point.record"], (args)=>
        {
            let [lon,lat] = this.toLatLon(args.point.x, args.point.y);
            
            let content = this.div.content;
            content.location = { lon, lat };
            
            fetch(`${window.doc_domain}`,  
            { 
                method: 'PATCH', 
                headers: new Headers({
                 'Authorization': `Bearer ${content.token}`  //document token 
                }),
                body: JSON.stringify({ location : { lon, lat } })
            });
            
            this.pin.id = args.id;
            this.pin.point = args.point;
            this.pin.scope.selected = true;
            this.viewer.post("point.create", this.pin, {});		
            this.viewer.post("point.select", this.pin, {});		
        });
        
    
        this.save = this.dom.querySelector("#save");
        this.save.addEventListener("click", async (event)=>
        {
            this.save.disabled = true;
            
            let content = this.div.content;
            
            let pin = await this.viewer.wait("point.get", { id: content.id }, {});
            let [lon,lat] = this.toLatLon(pin.point.x, pin.point.y);
            
    //		console.log(this.toXY(lon, lat))
            
            content.location = { lon, lat };
            
            fetch(`${window.doc_domain}`,  
            { 
                method: 'PATCH', 
                headers: new Headers({
                 'Authorization': `Bearer ${content.token}`  //document token 
                }),
                body: JSON.stringify({ location : { lon, lat } })
            });
    
            this.edit.toggleAttribute("active", false);
            this.save.toggleAttribute("active", false);
            this.viewer.post("point.unselect", { id: content.id }, {});		
        });
    
        this.edit = this.dom.querySelector("#edit");
        this.edit.addEventListener("click", (event)=>
        {
            let content = this.div.content;
            
            if (!this.edit.hasAttribute("active"))
            {
    //			console.log(this.toXY(content.location.lon, content.location.lat))
                
                if (content.location)
                {
                    this.viewer.post(`point.select`, { id: content.id });
                }
                else
                {
                    this.viewer.post(`point.record`, { id: content.id });
                }
                this.save.disabled = false;
            }
            else
            {
                if (content.location)
                {
                    let [x,y] = this.toXY(content.location.lon, content.location.lat);
                    
                    this.viewer.post(`point.unselect`, { id: content.id });
                    
                    this.viewer.post(`point.update`, { id: content.id, point: {x,y} });
                }
                else
                {
                    this.viewer.post(`record.cancel`, {  });
                }
                this.save.disabled = true;
            }
        });
            
        this.div = null;
    }
        
    connectedCallback() 
    {
        this.viewer.init(JSON.stringify({ id: "openstreetmap", data: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", type: "wmts", maxZoom: 19 }));
    }
    
    toXY(lon, lat)
    {
        return [256*((lon+180)/360), 256*((1-Math.log(Math.tan(lat*Math.PI/180) + (1/Math.cos(lat*Math.PI/180)))/Math.PI)/2)];
    }
    toLatLon(x, y)
    {
        return [x/256.0*360-180, Math.atan(Math.sinh(Math.PI*(1-2*y/256.0)))*180/Math.PI];
    }


    setView(lon,lat, zoom)
    {
        let [x,y] = this.toXY(lon, lat);
        /*
        let x = 256*((lon+180)/360); 
        let y = 256*((1-Math.log(Math.tan(lat*Math.PI/180) + (1/Math.cos(lat*Math.PI/180)))/Math.PI)/2);
        */
        this.viewer.post("camera", { position: { x,y }, zoom });
    }
        
    select(div)
    {
        let content = div.content;
        if (content.location)
        {
            this.setView(content.location.lon, content.location.lat, 17)
            this.viewer.post(`point.update`, { id: content.id, scope: { selected: true } });
        }
        this.div = div;
        this.edit.disabled = false;
    }

    unselect(div)
    {
        let content = div.content;
        if (content.location)
        {
            this.viewer.post(`point.update`, { id: content.id, scope: { selected: false } });
        }
        this.div = null;
        this.edit.disabled = true;
    }
    
    add(set)
    {
        set.forEach(entry => 
        {
            if (entry.location)
            {
                let [x,y] = this.toXY(entry.location.lon, entry.location.lat);
                
                this.pin.id = entry.id;
                this.pin.point = { x, y }
                this.viewer.post("point.create", this.pin, {});		
                /*
                this.pin.id = entry.id;
                this.pin.point = {
                        x: 256*((entry.location.lon+180)/360),
                        y: 256*((1-Math.log(Math.tan(entry.location.lat*Math.PI/180) + (1/Math.cos(entry.location.lat*Math.PI/180)))/Math.PI)/2), 
                        z: 0
                    }
                this.viewer.post("point.create", this.pin, {});
                */		
            }
        })
    }
    
    async clear()
    {
        let set = await this.viewer.wait("*.get");
        for (var id in set)
        {
            this.viewer.post("point.delete", { id } );		
        }
    }
}

customElements.define("va-map", VaMap);



