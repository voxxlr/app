class VaToken extends HTMLElement 
{
    static get observedAttributes() 
    {
        return ['token'];
    }
    
    constructor() 
    {
        super();
        
        this.dom = this.attachShadow({mode: 'open'});
        
        this.dom.innerHTML = `
        
            <style>
            
                <link rel="stylesheet" href="https://voxxlr.github.io/app/ui.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">

                :host
                {
                }
                
                :host([hidden])
                {
                    display: none;
                }
                
                span.copy
                {
                    width: 30em;
                    display:block;
                    background-color: var(--primary-transparent);
                    word-break:break-all;
                    font-size: 0.8em;
                }

                span.copy:hover::after
                {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    content: "click to copy";
                    color: #111;
                    background-color: var(--hover);
                    font-size: 1.2em;
                    padding: 1px 5px 2px 5px;
                    white-space: nowrap;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    z-index: 9999
                }

                
                button
                {
                    margin-top: 1em;
                } 
                        
            </style>
            
            <span class="copy"></span>
            <ui-tab tabs="encoded,plain">
                <div slot="encoded">
                    <span class="copy"></span>
                </div>
                <div slot="plain">
                    <span class="copy"></span>
                </div>
            </ui-tab>
            
            <button class="vx-secondary"><img style="height: 40px" src="https://voxxlr.github.io/app/voxxlr/inventory/images/swagger.webp">Swagger</button>
            `;
            
            this.dom.querySelector("button").addEventListener("click", event=>
            {
                window.open(`https://doc.voxxlr.com/rest.html?token=${encodeURIComponent(this.getAttribute("token"))}`, "Rest Api");
            })
            
            this.dom.querySelectorAll("span").forEach(span => span.addEventListener("click", event=>
            {
                navigator.clipboard.writeText(event.currentTarget.textContent)
            }));
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (name == "token")
        {
            let payload = JSON.parse(atob(decodeURIComponent(newValue.substring(newValue.indexOf('.')+1))));
            this.dom.querySelector(":host > span").textContent = payload.id;
                
            this.dom.querySelector("div[slot='encoded'] > span").textContent = encodeURIComponent(newValue);
            this.dom.querySelector("div[slot='plain'] > span").textContent = newValue;
        }
    }
}

customElements.define("va-token", VaToken);
