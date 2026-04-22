class SearchBox extends HTMLElement{
    constructor(){
        super()

        this.attachShadow({mode:"open"});
        this.shadowRoot.append(SearchBox.template.content.cloneNode("true"))
    
        this.input = this.shadowRoot.querySelector("#searcharea");
        let rightSlot = this.shadowRoot.querySelector("slot[name='right']")
        
        const handleClick = (e)=>{
            e.stopPropagation();
            let searchString = this.input.value;
            if (this.disabled) return;
            this.dispatchEvent(new CustomEvent("search",{detail : searchString}));    
        }
        rightSlot.addEventListener("touchend", handleClick);
        
    }

    attributeChangedCallback(name,oldValue,newValue){
        if (name === "disabled"){
            this.input.disabled = newValue !== null;
        }
        else if(name==="placeholder"){
            this.input.placeholder = newValue;
        }
        else if(name==="value"){
            this.input.value = newValue;
        }
    }

    get disabled(){return this.getAttribute("disabled");}
    get placeholder(){return this.getAttribute("placeholder");}
    get value(){return this.getAttribute("value");}
    
    set disabled(value){
        if (value) this.setAttribute("disabled","")
        else this.removeAttribute("disabled")
    }
    set placeholder(value){this.setAttribute("placeholder",value)}
    set value(string){this.setAttribute("value",string)}
}
SearchBox.observedAttributes = ["disabled","placeholder","value"];
SearchBox.template = document.createElement("template")
SearchBox.template.innerHTML = `
    <style>
        ::placeholder{
            letter-spacing: normal;
            font-size: 0.5rem;
        }
        #searcharea{
            height: 2.5rem;
            border:none;
            padding: 0.5rem;
        }
        #searcharea:focus{
            outline:none;
        }
        #searcharea:disabled{
            background-color:gray;
            opacity:50%;

        }
    </style>
    <input id="searcharea" type="search"/>
    <slot id="icon" name="right">\u{1f50d}</slot>
`
customElements.define("search-box", SearchBox);
