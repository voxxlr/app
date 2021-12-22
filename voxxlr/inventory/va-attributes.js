

class VaAttributes extends HTMLElement 
{
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
                }
                
                #values
                {
                    flex-basis: 40%;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                }
                
                #values > div { margin-top:auto; }
                #values button { width: 4em; }
                    
                #preview
                {
                    flex-basis: 60%;
                    flex-grow: 0;
                    margin-left: 1em;
                    position: relative;
                    overflow: hidden;
                }
                
                #preview > div:nth-of-type(1) 
                {
                    position: absolute;
                    bottom: 0.5em;
                    right: 0.5em;
                }
                
                #preview img 
                {
                    min-height: 100%;
                    min-width: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                    margin: 0;
                    padding: 0;
                }
                
                ui-button-group > button { width: 25%; }
                
                button[name='delete'],  button[name='token'] { flex-basis:25%; }
                
                vx-file 
                {
                    z-index: 98;
                    background: white;	
                    padding: 3px 5px;
                }
                
                vx-file i { color: var(--primary) }
                                
                textarea 
                { 
                    width: 100%;
                    resize: none;
                    height: 8em; 
                    margin-top: 1em;
                }
                
                input { width: 100%; }
                ui-tag-list { margin-top: 1em; }
                
                vx-viewer > div { position: relative; z-index: 999 }
                    
            </style>
        
            <div id="values">
                <input type="text" placeholder="name...">
                <textarea placeholder="description..."></textarea>
                <ui-tag-list>
                    <ui-tag-input  placeholder="tags..." type="text" ></ui-tag-input>
                </ui-tag-list>
                <div>
                    <button name="token" class="vx-tool vx-secondary">
                        <i class="fas fa-2x fa-key"></i>
                        API
                        <ui-tooltip hidden>
                            <p>Show document token</p>
                        </ui-tooltip>
                    </button>
                    <button name="delete" class="vx-tool vx-secondary">
                        <i class="fas fa-2x fa-trash"></i>
                        Delete
                        <ui-tooltip hidden>
                            <p>Delete dataset</p>
                        </ui-tooltip>
                    </button>
                </div>
            </div>
            <div id="preview">
                <vx-viewer>
                    <div>
                        <button name="snapshot" class="vx-secondary">Record Preview ...</button>
                        <vx-file ext="jpg" path="" name="preview.jpg"><i class="fas fa-upload"></i></vx-file>
                    </div>
                </vx-viewer>
            </div>
            
            <ui-modal id="delete-dialog" hidden close>
                <div>
                    <p>Are you certain ? This cannot be undone. </p>
                </div>
                <div>
                    <button name="delete" class="vx-primary" type="button"><span>Yes</span></button>
                </div>
            </ui-modal>
                
            <ui-modal id="token-dialog" hidden close>
                <va-token></va-token>
            </ui-modal>

            `;		
        
        //
        // Actions
        //
        this.dom.querySelector("button[name='delete']").addEventListener("click", async (event) => { this.dom.getElementById("delete-dialog").hidden = false; });
        this.dom.querySelector("ui-modal button[name='delete']").addEventListener("click", (event) => 
        { 
            this.dom.getElementById("delete-dialog").hidden = true;
             
            fetch(`${window.doc_domain}`, 
            { 
                method: 'DELETE', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.div.content.token}` 
                })
            });
    
            this.div.remove();
            this.dispatchEvent(new CustomEvent('delete-dataset', { detail: this.div }));
        });
        
        
        this.viewer = this.dom.querySelector("vx-viewer");
        this.dom.querySelector("button[name='snapshot']").addEventListener("click", async (event) => 
        {
            this.div.content.meta.preview = await this.viewer.recordPreview();
            this.dispatchEvent(new CustomEvent('update-dataset', { detail: this.div }));
        });
        this.dom.querySelector("button[name='token']").addEventListener("click", async (event) => 
        { 
            this.dom.querySelector("va-token").setAttribute("token", this.div.content.token);
            this.dom.getElementById("token-dialog").hidden = false;
        });


        //
        // Attribute
        //
        this.dom.querySelector("ui-tag-list").addEventListener("tags-changed", event =>  
        {
            this.div.content.tags = event.detail;
            fetch(`${window.doc_domain}`,  
            { 
                method: 'PATCH', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.div.content.token}`  //document token 
                }),
                body: JSON.stringify({ tags: event.detail })
            });
        })

        this.dom.querySelector("input").addEventListener("change", event =>  
        {
            this.div.content.meta.name = event.currentTarget.value;
            fetch(`${window.doc_domain}/meta`, 
            { 
                method: 'PATCH', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.div.content.token}`,  //document token 
                 'Content-Type': "application/json",
                 'Content-Encoding': 'gzip'
                }),
                body: JSON.stringify({name:event.currentTarget.value})
            });
    
            this.dispatchEvent(new CustomEvent('update-dataset', { detail: this.div }));
        })
        
        this.dom.querySelector("textarea").addEventListener("change", event =>  
        {
            this.div.content.meta.description = event.currentTarget.value;
            fetch(`${window.doc_domain}/meta`, 
            { 
                method: 'PATCH', 
                headers: new Headers({
                 'Authorization': `Bearer ${this.div.content.token}`,  //document token
                 'Content-Type': "application/json",
                 'Content-Encoding': 'gzip'
                }),
                body: JSON.stringify({description:event.currentTarget.value})
            });
    
            this.dispatchEvent(new CustomEvent('update-dataset', { detail: this.div }));
        })
        
        this.dom.querySelector("vx-file").addEventListener("item-done", event=>
        {
            fetch(`${window.doc_domain}/file/preview.jpg`, 
            {
                headers: new Headers({ 'Authorization': `Bearer ${this.div.content.token}` }),
            }).then(async (response) =>
            {
                let file = await response.json();
                this.div.content.meta.preview = file.url;
                this.dispatchEvent(new CustomEvent('update-dataset', { detail: this.div }));
            });
        });
        
        this.content= null;
    }
    
    async select(div)
    {
        let content = div.content;
        
        this.dom.querySelector("input").value = content.meta.name;
        this.dom.querySelector("textarea").value = content.meta.description;
        this.dom.querySelector("ui-tag-list").setAttribute("tags", content.tags);
        this.dom.querySelector("vx-file").setAttribute("token", content.token);

        await this.viewer.init(content.token);
        this.viewer.post("controller", { name: "orbiter" });
        
        this.div = div;
    }
    
    unselect()
    {
        this.div = null;
        this.dom.querySelector("input").value = "";
        this.dom.querySelector("textarea").value = "";
        this.dom.querySelector("ui-tag-list").setAttribute("tags", "");
        this.dom.querySelector("vx-file").removeAttribute("token");
        
        this.viewer.unload();
    }

    update(document)
    {
        let div = this.dom.getElementById(document.id);
        let image = div.querySelector("img");
        image.src = document.meta.preview;
    }
}

customElements.define("va-attributes", VaAttributes);

