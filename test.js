


(function() {

const template = document.createElement('template');

template.innerHTML = `

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="${window.app_source}/ui.css">

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

class UiTest extends HTMLElement 
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

customElements.define("ui-test", UiTest);

})();


