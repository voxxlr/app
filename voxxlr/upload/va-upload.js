class VaDropZone extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['ext','title', 'disabled', 'message'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    cursor: pointer;
                    padding: 1em;
                }
                :host-context([hidden]) { display: none; }
                                
                :host-context(.waiting) { border: 3px solid var(--primary); background-color: var(--primary-transparent); }
                :host-context(.ready) { border: 3px solid #00aa00; ; background-color: #00aa0033;}
                :host-context(.uploading) { border: 3px solid #aaaaaa;  ; background-color: #aaaaaa33;}
                :host-context(.error) { border: 3px solid #ff0000; ; background-color: #ff000033; }
                        
                :host > div
                {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                
                input 
                {
                    position: absolute;
                    left: 0px;
                    top: 0px;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    z-index: 10;
                }
                
                div.msg  
                {
                    position: absolute;
                    left: 0px;
                    top: 40px;
                    bottom: 0px;
                    right: 40px;
                    overflow-y: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;					
                }
                
                div.msg > p  
                {
                    font-style: italic;
                    text-align: center;
                    margin-right: 40px;
                    overflow: hidden;
                }
        
                div.msg > p.progress 
                { 
                    font-size: 3em; 
                    line-height: 3em;
                    margin: 0;
                    padding: 0;
                    font-style: normal;
                }
                 
                .ext  
                {
                    position: absolute;
                    right: 0px;
                    top: 65px;
                    bottom: 0px;
                    width: 30px;
                    font-size: 0.98em;
                    overflow: hidden;
                }

                                    
                header { width: 100%; }
                header i { float: right; opacity: 0.6; }
                header p { font-style: italic };

            </style>
                
            <div>
                <header>
                    <span>Point Cloud</span><i class="fas fa-2x fa-paperclip"></i>
                </header>
                <div class="ext">asdasd asd asd</div>
                <div class="msg"><p>click or drop file</p></div>
                <input type="file">
            </div>
        `;
        
        this.status = this.dom.querySelector(':host > div');
        this.message = this.dom.querySelector("div.msg > p"); 
        this.icon =  this.dom.querySelector("header > i"); 
        
        this.files = [];

        this.dom.addEventListener("drop", async (e) =>
        {
            e.stopPropagation();
            e.preventDefault();
        
            if (!this.input.disabled)
            {
                this.files = [];
        
                var items = e.dataTransfer.items;
                let promises = [];
                for (var i=0; i<items.length; i++) 
                {
                    var item = items[i].webkitGetAsEntry();
                    if (item) 
                    {
                        promises.push(this._traverseItem(item, ""));
                    }
                } 
            
                await Promise.all(promises).catch(err => 
                {
                    this.message.textContent = err;
                });
                
                this.dispatchEvent(new CustomEvent('selected', {
                    bubbles: true,
                    composed: true,
                    detail: this.files
                }));
            }
        });	  	


        this.input = this.dom.querySelector("input");
        this.input.addEventListener("change", async (event) =>
        { 
            this.files = [];
                    
            let files = event.currentTarget.files;
            let types = this.getAttribute("ext").split(",");
            for (var i=0; i<files.length; i++) 
            {
                var ext = files[i].name.substring(files[i].name.lastIndexOf('.')+1).toLowerCase();
                if (types.includes(ext))
                {
                    let path = files[i].name;
                    this.files.push({ path, file: files[i], ext });
                }
            } 
    
            this.dispatchEvent(new CustomEvent('selected', {
                bubbles: true,
                composed: true,
                detail: this.files
            }));
    
        });
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "title")
        {
            this.dom.querySelector("header > span").textContent = newValue;
        }
        else if (name == "ext")
        {
            if (newValue != null)
            {
                let list = newValue.split(",");
                this.dom.querySelector(".ext").innerHTML = list.join("</br>");
            }
            else
            {
                this.dom.querySelector(".ext").innerHTML = "";
            }
        }
        else if (name == "disabled")
        {
            this.input.toggleAttribute("disabled", newValue != null);				
        }
        else if (name == "message")
        {
            this.message.innerHTML = newValue;				
        }
        this.status.setAttribute("class", "waiting");
    }


    onProgress(p)
    {
        this.message.textContent = `${(100*p).toFixed(1)}%`
    }	
    
    onStartUpload()
    {
        this.message.classList.toggle("progress", true);
        this.message.textContent = "";
        this.icon.setAttribute("class", "fas fa-2x fa-upload");
    }

    reset()
    {
        this.files = [];
        this.message.textContent = "click or drop file";
        this.message.classList.toggle("progress", false);
        this.icon.setAttribute("class", "fas fa-2x fa-paperclip");
    }
        
    _traverseItem(entry) 
    {
        let types = this.getAttribute("ext").split(",");
            
        if (entry.isFile)
        {
            return new Promise(resolve=>
            {
                entry.file(file =>
                {
                    var ext = file.name.substring(file.name.lastIndexOf('.')+1).toLowerCase();
                    
                    if (types.includes(ext))
                    {
                        let path = entry.fullPath;
                        if (path[0] === '/')
                        {
                            path = path.substring(1);
                        }
                        //path = encodeURIComponent(path);
                        
                        this.files.push({ path, file, ext });
                    }
                    resolve();
                });                            		
            });
        }
        else
        {
            var dirReader = entry.createReader();
            return new Promise((resolve, reject) => 
            {
                var iteration_attempts = [];
                let read_entries = ()=> 
                {
                    dirReader.readEntries((entries) => 
                    {
                        if (this.files.length < 201)
                        {
                            if (!entries.length) 
                            {
                                resolve(Promise.all(iteration_attempts));
                            } 
                            else 
                            {
                                iteration_attempts.push(Promise.all(entries.map( entry =>
                                {
                                    return this._traverseItem(entry);
                                })));
                                
                                read_entries();
                            }
                        }
                        else
                        {
                            reject("too many files");
                        }
                    }, function() { console.log("big error"); } );
                };
                read_entries();
            });
        };
    };
}

customElements.define("va-dropzone", VaDropZone);







class VaInfo extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    display: flex;
                    justify-content:center ;
                    align-items: stretch; 
                }

                :host > div 
                {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    margin-top: 1em;
                }

                :host > div:nth-of-type(1) 
                {
                    flex-basis: 50%;
                    margin-right: 1em;
                    padding-right: 2em;
                    padding-left: 2em;
                }
                
                    
                :host > div:nth-of-type(1)  i { 
                    color: var(--warn);
                    float: left;
                    margin-right: 0.3em;
                    margin-bottom: 0.3em;
                }


                :host > div:nth-of-type(2) 
                {
                    flex-basis: 50%;
                    margin-right: 1em;
                    display: flex;
                    flex-direction: column;
                }

                textarea { flex-grow: 2; }
                
                ui-tag-list
                {
                    display:inline-flex;
                    flex-wrap: wrap;
                    margin-top: 1em;
                }
                
                ui-tag-input { flex-basis: 100%; }
                
            </style>

            <div>
                <p><i class="fas fa-3x fa-lightbulb"></i>Define revelant tags! They are important to assign datasets to Apps and users.</p>
                <ui-tag-list tags="">
                    <ui-tag-input type="text" ></ui-tag-input>
                </ui-tag-list>
            </div>
            <div>
                <input id="title" placeholder="title..." type="text" autocomplete="nope">
                <textarea id="description" placeholder="description..." rows="3" autocomplete="nope"></textarea><span></span>
                <label><input id="keep" type="checkbox">Store original files</label>
            </div>
                
        `;
    }
    
    getMeta(meta)
    {
        return { name : this.dom.getElementById("title").value, description : this.dom.getElementById("description").value };
    }
    
    getConfig()
    {
        return { keep : this.dom.getElementById("keep").checked };
    }
    
    getTags()
    {
        return this.dom.querySelector("ui-tag-list").get();
    }
    
    
}

customElements.define("va-info", VaInfo);








class VaDensity extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    display: flex;
                    justify-content:space-around;
                }
            
                :host > div:first-of-type
                {
                    width: 350px;
                }
                
                :host > div:last-of-type
                {
                    width: 15em;
                }
                
                .image 
                {
                    height: 15em;
                    width: 15em;
                    min-height: 15em;
                    min-width: 15em;
                    max-height: 15em;
                    max-width: 15em;
                    opacity: 0.6;
                }
        
                .image.density 
                {
                    background: url('${window.app_source}/voxxlr/upload/images/radiusfilter.png') center;
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                }

            </style>
            

            <div>
                <div>
                    <label><input id="density-switch" type="checkbox" checked=""></label>
                    <input id="density-value" placeholder="Filter off" type="number" step="0.1" value="0.2" min="0.1" max="20.00"><span></span>
                </div>						
                <div class="description">
                    <p>The density filter ensures that a sphere of radius 5*<i>resolution</i> is 
                    filled to the specified percentage with points. Apply a low density filter to reduce noise.</p>
                </div>
            </div>					
            <div class="image density"></div>
        `;

        
        this.densityswitch = this.dom.getElementById("density-switch");
        this.densityvalue = this.dom.getElementById("density-value");
        this.densityswitch.addEventListener("change", (event) =>
        {
            if (event.currentTarget.checked)
            {
                this.densityvalue.disabled = false;   	       		
                this.densityvalue.value = "0.2";
            }
            else
            {
                this.densityvalue.disabled = true;   	       		
                this.densityvalue.value = "";
            }
        });
    }
    
    get(source)
    {
        if (this.densityswitch.checked)
        {
            source.density = parseFloat(this.densityvalue.value)/100.0;
        }	
        else
        {
            source.density = 0;
        }
    }
}

customElements.define("va-density", VaDensity);



class VaResolution extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    display: flex;
                    justify-content:space-around;
                }
            
                :host > div:first-of-type
                {
                    width: 350px;
                }
                
                :host > div:last-of-type
                {
                    width: 25em;
                }

                .image 
                {
                    height: 15em;
                    width: 15em;
                    min-height: 15em;
                    min-width: 15em;
                    max-height: 15em;
                    max-width: 15em;
                    opacity: 0.6;
                }
        
                .image.resolution 
                {
                    background: url('${window.app_source}/voxxlr/upload/images/gridfilter.webp') center;
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                }

                #resolution-value
                {
                    width: 7em;
                    text-align: right;
                }                
            </style>
            
            <div>
                <div>
                    <label>
                        <input id="resolution-switch" type="checkbox" checked="">
                    </label>
                    <input id="resolution-value" placeholder="Auto detect" type="number" step="0.001" value="" min="0.001" max="1.00" disabled=""><span>m</span>
                </div>
                <div class="description">
                    <p>The resolution filter ensures that any cube of the given size (in meters) contains at most one point. 
                        If more than one point fall into a cube their position and colors are averaged. For noisy data, auto detection generates a low resolution</p> 
                </div>
            </div>					
            <div class="image resolution"></div>
        `;
        
        this.resolutionswitch = this.dom.getElementById("resolution-switch");
        this.resolutionvalue = this.dom.getElementById("resolution-value");
        this.resolutionswitch.addEventListener("change", (event)=>
        {
            if (event.currentTarget.checked)
            {
                this.resolutionvalue.disabled = true;   	       		
                this.resolutionvalue.value = "";
            }
            else
            {
                this.resolutionvalue.disabled = false;   	       		
                this.resolutionvalue.value = "0.02";
            }
        });
    }
    
    get(source)
    {
        if (!this.resolutionswitch.checked)
        {
            source.resolution = parseFloat(this.resolutionvalue.value);
        }	
    }
}

customElements.define("va-resolution", VaResolution);





class VaCoordinates extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    display: flex;
                    justify-content:space-around;
                }
            
                :host > div:first-of-type
                {
                    width: 350px;
                }
                
                :host > div:last-of-type
                {
                    width: 15em;
                }
                    
                .coordimage 
                {
                    height: 15em;
                    width: 15em;
                    min-height: 15em;
                    min-width: 15em;
                    max-height: 15em;
                    max-width: 15em;
                }			
    
                .coordinput { width: 60%; }
                
                .coordinput > div:first-of-type
                { 
                    display: flex;
                    flex-direction: column;
                }
                    
                .svg-hidden { display: none; }
                svg .x { stroke:rgb(255,0,0);stroke-width:1 }
                svg .y { stroke:rgb(0,255,0);stroke-width:1 }
                svg .z { stroke:rgb(0,0,255);stroke-width:1 }
                svg text { font-size: 14px; }
         
                        
            </style>
            
            <div class="coordinput">
                <div>
                    <label><input type="radio" id="right-y" name="coords" value="right-y"><span>Right-handed Y Up</span></label>
                    <label><input type="radio" id="right-z" name="coords" value="right-z" checked=""><span>Right-handed Z Up</span></label>							
                    <label><input type="radio" id="left-y" name="coords" value="left-y"><span>Left-handed Y Up</span></label>							
                    <label><input type="radio" id="left-z" name="coords" value="left-z"><span>Left-handed Z Up</span></label>							
                </div>
                <div>
                    <p>Specify the coordinate system of the data being uploaded. It will be converted to the Voxxlr coordinate system, Right-handed Y Up. When in doubt leave the default setting...</p>
                </div> 		
            </div>
            <div class="coordimage">
                <svg viewBox="-100 -100 200 200" style="overflow:visible;" xml:space="preserve" >
                    <g class="svg-hidden" data-right-y>
                        <line x1="-80" y1="-36" x2="80" y2="30" class="x"></line>
                        <line x1="-80" y1="30" x2="80" y2="-30" class="z"></line>
                        <line x1="0" y1="-80" x2="0" y2="80" class="y"></line>
                        <text x="85" y="38">x</text>
                        <text x="-99" y="38">z</text>
                        <text x="-6" y="-93">y</text>
                    </g>
                    <g data-right-z>
                        <line x1="-80" y1="-30" x2="80" y2="30" class="x"></line>
                        <line x1="-80" y1=" 30" x2="80" y2="-30" class="y"></line>
                        <line x1="0" y1="-80" x2="0" y2="80" class="z"></line>
                        <text x="85" y="38">x</text>
                        <text x="85" y="-34">y</text>
                        <text x="-5" y="-88">z</text>
                    </g>
                    <g class="svg-hidden" data-left-y>
                        <line x1="-80" y1="-36" x2="80" y2="30" class="x"></line>
                        <line x1="-80" y1="30" x2="80" y2="-30" class="z"></line>
                        <line x1="0" y1="-80" x2="0" y2="80" class="y"></line>
                        <text x="85" y="38">x</text>
                        <text x="85" y="-34">z</text>
                        <text x="-6" y="-93">y</text>
                    </g>
                    <g class="svg-hidden" data-left-z>
                        <line x1="-80" y1="-30" x2="80" y2="30" class="x"></line>
                        <line x1="-80" y1=" 30" x2="80" y2="-30" class="y"></line>
                        <line x1="0" y1="-80" x2="0" y2="80" class="z"></line>
                        <text x="85" y="38">x</text>
                        <text x="-99" y="38">y</text>
                        <text x="-5" y="-88">z</text>
                    </g>
                </svg>
            </div>
        `;
        

        this.dom.querySelectorAll(".coordinput input").forEach((item) =>
        {
            item.addEventListener("change", (event) =>
            {
                this.dom.querySelectorAll(".coordimage g").forEach((item) =>
                {
                    item.classList.add("svg-hidden");
                });
                this.dom.querySelector("g[data-"+event.currentTarget.id+"]").classList.remove("svg-hidden");
            });	
        });
    }
    
    get(source)
    {
        source.coords = this.dom.querySelector(".coordinput input:checked").value;
    }
    
}

customElements.define("va-coordinates", VaCoordinates);





class VaUnits extends HTMLElement 
{
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
         
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
            :host
            {
                display: flex;
                justify-content:space-around;
            }
         
            .selection
            { 
                display: flex;
                flex-direction: column;
            }
    
            </style>
            
            <div>
                <div class="selection">
                    <label><input type="radio" id="option-1" name="options" value="1.0" checked><span>m</span></label>
                    <label><input type="radio" id="option-2" name="options" value="0.01"><span>cm</span></label>
                    <label><input type="radio" id="option-3" name="options" value="0.001"><span>mm</span></label>
                    <label><input type="radio" id="option-4" name="options" value="0.0254"><span>in</span></label>
                    <label><input type="radio" id="option-5" name="options" value="0.3048"><span>ft</span></label>
                </div>
                <div class="description">
                    <p>Specify the units of the data being uploaded. </p>
                </div> 		
            </div>
        `;
        

        this.dom.querySelectorAll(".coordinput input").forEach((item) =>
        {
            item.addEventListener("change", (event) =>
            {
                this.dom.querySelectorAll(".coordimage g").forEach((item) =>
                {
                    item.classList.add("svg-hidden");
                });
                this.dom.querySelector("g[data-"+event.currentTarget.id+"]").classList.remove("svg-hidden");
            });	
        });
    }
    
    get(source)
    {
        source.scalar = parseFloat(this.dom.querySelector("input:checked").value);
    }
    
}

customElements.define("va-units", VaUnits);



class VaProcessing extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['meter'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        this.dom.innerHTML = `
    
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <link rel="stylesheet" href="${window.app_source}/ui.css">

            <style>
            
                :host
                {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    vertical-align: middle;
                    font-style: italic;
                    color: var(--primary);
                    justify-self: end;
                }
                
                :host([hidden]) { display: none }
                
                :host span:nth-of-type(2)
                {
                    padding-top: 0.4em;
                    font-size: 2em;
                    margin-bottom: 0.4em;
                }

            </style>

            <span>Currently processing</span>
            <span></span>
            <span>datasets</span>

        `;		
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        let meter = JSON.parse(newValue);
        if (meter.processing.length)
        {
            this.dom.host.hidden = false;
            this.dom.querySelector("span:nth-of-type(2)").textContent = `${meter.processing.length}/4`;
        }
        else
        {
            this.dom.host.hidden = true;
        }
    }
}

customElements.define("va-processing", VaProcessing);
