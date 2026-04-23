export function createChart(context,{x=0,y=0,w=10,h=10,d=0},{xAxisLabels=false,yAxisLabels=[],legend=[],callback,values=[],scale},...options){
    let amountsArr = Object.values(values);
    let dates = Object.keys(values).unique();
    amountsArr = amountsArr.map(e => e/(scale));
    for(let i=0; i<amountsArr.length; i++){
        let a = i*d;
        let b = h*amountsArr[i];
        singlebar(context,{x:x+a,y,w,h:b},options);
        if(xAxisLabels){addText(x+a,y+10,w,dates[i],context)}
        if(yAxisLabels){addText(x+a,y+b-5,w,Math.round(amountsArr[i]*scale),context)}
    }
    if (legend.length){
        let legendEl = createLegend(Object.fromEntries(["Expenses"].map((e,i) => [e,legend[i]])),["Expenses"],{});
        callback ? callback(legendEl) : "" ;
    } 
}


function lineChart(context,x,y,d,values,...options){
    let amounts = Object.values(values);
    let maxVal = Math.max(...amounts);
    let scale = new Array(maxVal.toString().length-1).fill(0).map((e,i)=>i===0? 1 : e).join("")*1
    context.beginPath();
    for (let i=0; i< amounts.length; i++){
        let a = i*d;
        let h = y-amounts[i]/scale;
        i===0 ? context.moveTo(x+a,h) : context.lineTo(x+a,h);
        addText(x+a-10,h-10,d,amounts[i].toString().replaceWithSym(),context);
    }
    context.stroke();
}

export function pieChart(context,x,y,r,sd,ed,dir,{values,legend},...options){
    values = Object.fromEntries(Object.entries(values).sort(([k1,v1],[k2,v2])=>v2-v1));
    let amounts = Object.values(values).map((e,i,arr) => (360*((e*100/arr.reduce((a,b)=>a+b))/100)).toFixed(2)*1);
    let names = Object.keys(values);
    let fRad = -90;
    let colors = colorPallete(names);    
    let legendEl = createLegend(colors,names,{});
    for(let i=0; i<amounts.length;i++){
        let options = [{"fillStyle":colors[names[i]]}];
        pieChunk(context,x,y,r,fRad,fRad+amounts[i],dir,options);
        fRad += amounts[i];
    }
    legend ? legend(legendEl) : ""; 
}

export function createStackedChart(context,{x=0,y=0,w=10,d=0,h=0},{xAxisLabels=[],yAxisLabels=[],legend,values=[]}){
    let stackedPlotSubcatInput = Object.values(values).map((obj) => Object.entries(obj)).sort(arr => arr.sort((arr1,arr2)=>arr2[1]-arr1[1]));
    let dates = Object.keys(values).unique();
    let numbers = stackedPlotSubcatInput.map(arr => arr.map(ar => ar[1])) ;
    let names = stackedPlotSubcatInput.map(arr => arr.map(ar => ar[0])) ;
    let stackedPlotSubcatNames = names.flat().unique() ;
    let colors = colorPallete(stackedPlotSubcatNames) ;    
    let legendEl = createLegend(colors,stackedPlotSubcatNames,{label:["w-5 overflow-hidden text-nowrap text-ellipsis"]});
    for(let i=0; i<numbers.length; i++){
        let options = [];
        let b = numbers[i].map(e => e*h);
        names[i].forEach(name => {options.push({"fillStyle":colors[name]})});
        stackedbar(i,context,{x,y,w,h:b,d},options,{xlabels:dates});
    } 
    legend ? legend(legendEl) : "";
}

function singlebar(context,{x=0,y=0,w=0,h=0},options){
    if(options.every(e=> e.toString()?.split(" ")?.[1]?.replace("]","") === "Object"))
    {
        options.forEach(opt => {
            let [[key,val]] = Object.entries(opt);
            context[key] = val;
        });
    }
    context.fillRect(x,y,w,h);
}

function stackedbar(j=0,context,{x=0,y=0,w=0,d=0,h=[]},options,{xlabels,yLabels}){
    let a = j*d;
    let l = h.length;
    if (!l) return;
    let s = h.reduce((x,y)=>(x+y));
    s = s>0 ? s : s*-1
    for (let i=0; i<l; i++){
        let b = Math.round(h[i]*100/s);
        let c = i>0 ? Math.round(h[i-1]*100/s) : 0;
        y += c
        singlebar(context,{x:x+a,y,w,h:b},[options[i]]);
        if(i===0) addText(x+a,y+10,w,xlabels[j],context);
    }
    // singlebar(context,{x:x+a,y:y+b,w,h:c},[options[0]]);
}

export function pieChunk(context,x,y,r,sd,ed,dir,options){
    if(options.every(e=> e.toString()?.split(" ")?.[1]?.replace("]","") === "Object"))
    {
        options.forEach(opt => {
            let [[key,val]] = Object.entries(opt);
            context[key] = val;
        });
    }
    context.beginPath();
    context.moveTo(x,y);
    context.arc(x,y,r,rads(sd),rads(ed),dir);
    context.closePath();
    context.fill();
    context.stroke();
}

function rads(x) { return Math.PI*x/180; }

function colorPallete(array){
    let colors = {}
    for(let entry of array){
        let r = Math.floor(Math.random()*256);
        let g = Math.floor(Math.random()*256);
        let b = Math.floor(Math.random()*256);
        colors[entry] = `rgb(${r},${g},${b})`
    }
    return colors;
}

function createLegend(colors,names,{label=[],span=[],box=[]}){
    let legendBox = createElement("div",[["mt-2 gridmembercss pt-2 pr-2 justify-self-end flex flex-col w-[fit-content] h-30 z-10 bg-transparent overflow-y-auto"].concat(box).join(" ")]);
    let legendSpan = createElement("span",[["flex justify-between items-center"].concat(span).join(" ")]);
    let legendLabel = createElement("p",[["text-[0.5rem] mr-1"].concat(label).join(" ")]);
    // debugger
    if(legendLabel.classList.contains("text-ellipsis")){
        legendBox.addEventListener("touchend",(e)=>{
            let target = e.target.localName === "p" && e.target.textContent ? e.target : "";
            if (target){
                e.target.classList.toggle("text-ellipsis");
                e.target.classList.toggle("w-[fit-content]");
                setTimeout(()=>{e.target.classList.toggle("text-ellipsis");e.target.classList.toggle("w-[fit-content]");},1000);
            }   
        })
    }
    for (let name of names){
        let legendSpanClone = legendSpan.cloneNode("true");
        let colName = legendLabel.cloneNode("true")
        colName.textContent = name;
        let col = `bg-[${colors[name]}]`
        let legendColor = createElement("p",[`h-2.5 w-2.5 ${col}`]);
        legendSpanClone.append(colName,legendColor)
        legendBox.append(legendSpanClone);
    }
    return legendBox;
}

function createElement(name,classlist,...properties){
    let el = document.createElement(name);
    Array.isArray(classlist) ? el.classList = classlist : "";
    for (let property of properties){
        let [propname, propvalue] = Object.entries(property);
        el.setAttribute(propname,propvalue)
    }
    return el; 
}

function addText(x,y,mxW,text,context){
    context.strokeText(text,x,y,mxW);
}

String.prototype.replaceWithSym = function(){
    let res;
    let len = this.toString().length;
    switch (len){
        case 0:
        case 1: 
        case 2:
        case 3:
            res = this*1;
            break;
        case 4:   
        case 5: 
            res = ((this*1)/1000).toFixed(1) + "K";
            break;
        case 6:
        case 7:
            res = ((this*1)/100000).toFixed(1) + "L";
            break;
        default:
            res = ((this*1)/10000000).toFixed(1) + "Cr";
            break;
    }
    return res;
} 