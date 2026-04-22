// import { expenses } from "./expenseInput.js"
let contentArea = document.getElementById("calendar");
let header = document.getElementById("header");
let footer = document.getElementById("footer");
let calendarElem = document.getElementById("datesarea");
let dynamicDisplayArea = document.getElementById("dynamicsec");
let plotsArea = document.getElementById("plots");
let plotContainers = Array.from(plotsArea.children);
let historyArea = document.getElementById("history");
let cssScript = document.getElementById("tailwind");
let expenseBtn = document.getElementById("expenseupdate");
let editExpenseBtn = document.getElementById("expenseedit");
let incomeBtn = document.getElementById("incomeupdate");
let timestampEl = document.getElementById("timestamp");
let incometimestampEl = document.getElementById("incometimestamp");
let detailsModal = document.getElementById("detailsmodal");
let costDetails = document.getElementById("costdetails");
let incomeDetails = document.getElementById("incomedetails");
let costDisplay  = document.getElementById("cost");
let incomeDisplay  = document.getElementById("income");
let expenseTodayDisplay  = document.getElementById("expensetoday");
let incomeTodayDisplay  = document.getElementById("incometoday");
let balanceTodayDisplay  = document.getElementById("expensebalance");
let categoryEl = document.getElementById("category");
let sourceEl = document.getElementById("source");
let showHistory = document.getElementById("showhistory");
let selectView = document.getElementById("switchview");
let showPlots = document.getElementById("showplots");
let uploadBtn = document.getElementById("fileupload");
let downloadBtn = document.getElementById("filedownload");
let zoomOutBtn = document.getElementById("expand");
let zoomInBtn = document.getElementById("collapse");
let sessionOutput ;
let activeMonthExpensesByDate = {};
const expenseReceipts = {};
const ledger = {}
const monthlyincome = "";
const date = new Date();
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const canvas = document.createElement("canvas");
canvas.className = "gridmembercss box-border w-full my-1 border-1 p-1 bg-white";
let timelines = ["daily","weekly","monthly"]
let incomeByDate = {};
let categoryPlotData = {};
let subcategoryPlotData = {};
let categoryDatePlotData = {};
let subcategoryDatePlotData = {};
let valuesPlotData = {};
let scale;
const resizeFunc = () => contentArea.style.height = screen.height - header.getBoundingClientRect().height - header.nextElementSibling.getBoundingClientRect().height - footer.getBoundingClientRect().height + "px" ;

const size = (o) => o? Object.keys(o).length : "";

// Format date is app acceptabe format
Date.prototype.toAppFormatDate = function(I,II,III,sym){
    let dd =  this.getDate().toString();
    dd = dd.length === 1 ? "0"+dd : dd ;
    let mm =  this.getMonth()+1;
    mm = mm.toString().length===1 ? "0"+mm : mm;
    let yy = this.getFullYear().toString().substring(2,4);
    let yyyy = this.getFullYear();
    I = I.includes("d") ? dd : I.includes("m") ? mm : I === "yyyy" ? yyyy : yy;
    II = II.includes("d") ? dd : II.includes("m") ? mm : II === "yyyy" ? yyyy : yy;
    III = III.includes("d") ? dd : III.includes("m") ? mm : III === "yyyy" ? yyyy : yy; 
    return `${I}${sym}${II}${sym}${III}`;    
}

// unique method added to array to get unique elements in array
Array.prototype.unique = function(){
    let res = [];
    this.forEach(e => res.includes(e) ? "" : res.push(e));
    return res;
}

// wortAt method added to String constructor to find word in at a specified position in a array of words.     
String.prototype.wordAt = function(num){return this.split(" ")[num]}

// Initialize indexedDB
let db = null;
createIndexedDB("ledgerDB",1,{"expenseDB":{timestamp:"timestamp",category:"category"}},{"incomeDB":{timestamp:"timestamp",source:"category"}})
// Dynamically size the content area
window.addEventListener('DOMContentLoaded', resizeFunc);
let timeout;
window.addEventListener('resize', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        resizeFunc()
        console.log('Adjustment logic triggered');
    }, 250); // Wait for 250ms of no resizing
})

// document.body.addEventListener("resize", ()=>{debugger;document.location = "index.html"})
expenseBtn.addEventListener("touchstart",submitBtnClick);
editExpenseBtn.addEventListener("touchstart",editBtnClick);
incomeBtn.addEventListener("touchstart",submitBtnClick);
costDetails.addEventListener("touchend",handleModal);
incomeDetails.addEventListener("touchend",handleModal);
selectView.addEventListener("touchend", changeView);
showPlots.addEventListener("touchend", showPlotFunction);
showHistory.addEventListener("touchend", showHistoryFunction);
uploadBtn.addEventListener("touchend", uploadFile);
downloadBtn.addEventListener("touchend", downloadFile);
plotContainers.forEach(el => el.addEventListener("touchstart", swipeChart))
// Calendar looks and function

// reset inputs and timestamp
function reset(e){
    sessionOutput = {}; 
    categoryEl.value = '';
    costDisplay.value = '';
    timestampEl.value = new Date().toAppFormatDate("yyyy","mm","dd","-");
    let child = detailsModal.lastElementChild;
    detailsModal.replaceChildren();
    detailsModal.append(child);
    editExpenseBtn.disabled = true;
}

// Fetches expense data from IndexedDB for calendar view and returns transaction.
function getExpensesByCurrMonth(date = new Date()){
    activeMonthExpensesByDate = {};
    let dates = new Date(`${date.getMonth()+1}/31/${date.getFullYear()}`).getMonth() === date.getMonth() ? 31 : 30 ; 
    dates =  new Date(`1/29/${date.getFullYear()}`).getMonth() === 1 ? 29 : date.getMonth()===1 ? 28 : dates ;
    let s = new Date(`${date.getMonth()+1}/01/${date.getFullYear()}`).toAppFormatDate("yyyy","dd","mm","-");
    let e = new Date(`${date.getMonth()+1}/${dates}/${date.getFullYear()}`).toAppFormatDate("yyyy","dd","mm","-");
    return findRange(db,"expenseDB","timestamp",(res)=> {activeMonthExpensesByDate[res.timestamp] = activeMonthExpensesByDate?.[res.timestamp] ? activeMonthExpensesByDate[res.timestamp]+res.value : res.value},s,e);
}

// Creates calendar
function createCalendar(d){
    const _date = new Date(d);
    let tx = getExpensesByCurrMonth(_date);
    tx.oncomplete= () => {
        const label = document.createElement("h1");
        label.className = "block font-bold text-center";
        label.textContent = months[_date.getMonth()]+ " " + _date.getFullYear() ;
        calendarElem.append(label);
        calendarElem.classList.add("h-full");
        const scrollBtn = document.createElement("p");
        scrollBtn.className = "flex h-[inherit] items-center bg-black-100";
        let left = scrollBtn.cloneNode("true");
        let right = scrollBtn.cloneNode("true");
        left.addEventListener("touchend",scrollMonth,{once:true});
        right.addEventListener("touchend",scrollMonth,{once:true});
        left.textContent = "<<";
        right.textContent = ">>";    
        const calendarSuperArea = document.createElement("div");
        calendarSuperArea.className = "flex h-[95%]"
        const calendarBody = document.createElement("div");
        calendarBody.className = "box-border flex justify-between gap-1 flex-wrap p-2 overflow-auto"
        const dateBody = document.createElement("button");
        dateBody.className = "box-border pl-2 pr-1 pt-[0.5vh] text-left text-base/5 text-[1.5rem] whitespace-pre h-15 min-w-10 flex justify-between flex-auto basis-1/4 border-1 bg-white focus:outline-2";
        const frag = document.createDocumentFragment();
        let len = _date.getMonth()+1 === new Date(new Date(_date).getTime()+(31-new Date(_date).getDate())*24*60*60*1000).getMonth()+1 ? 31 : 30;
        let startDate = new Date(`${_date.getMonth()+1}/01/${_date.getFullYear()}`)  ;
        let n = startDate.getDay();
        for (let i=1;i<=len;i++){
            let clone = dateBody.cloneNode(true);
            n = n > 6 ? 0 : n;
            clone.textContent = `${dayNames[n++]}\n${i}`;
            let dmy = new Date(`${_date.getFullYear()}-${_date.getMonth()+1}-${i}`);
            clone.id = dmy.toAppFormatDate("yyyy","m","d","-");
            clone.addEventListener("click",handleDateClick);
            date.getDate() === i && date.getDay() === n-1 && date.getFullYear() === _date.getFullYear() ? (clone.classList.remove("bg-white"),clone.classList.add("bg-gray-300")) : "";
            i===31 ? (clone.classList.toggle("basis-1/4"),clone.classList.toggle("basis-1/3"),clone.classList.toggle("flex-auto")) : "";
            let expVal = activeMonthExpensesByDate[clone.id];
            snapshotDisplay(clone,expVal);
            findRange(db,"expenseDB","timestamp",function(entry){hasEntry(clone,entry)},"",clone.id);
            frag.append(clone);
            let len =  calendarElem.getBoundingClientRect().height
            dynamicDisplayArea.style.height = screen.height - header.getBoundingClientRect().height - footer.getBoundingClientRect().height - len - header.nextElementSibling.getBoundingClientRect().height+ "px";
        }
        calendarBody.append(frag);
        calendarSuperArea.append(left,calendarBody,right);
        calendarElem.append(calendarSuperArea);
        dynamicDisplayArea.classList.contains("hidden")? "" : (changeView(),dynamicDisplayArea.classList.toggle("hidden"));
        if (!dynamicDisplayArea.classList.contains("hidden")){
            let len =  calendarElem.getBoundingClientRect().height;
            dynamicDisplayArea.style.height = screen.height - header.getBoundingClientRect().height - header.nextElementSibling.getBoundingClientRect().height*2 - footer.getBoundingClientRect().height - len + "px";
        }
    }
}

//Toggles calendar view between full screen and update entries view. Triggered when second footer button "switchview" is clicked. Also available in scrollMonth function.   
function changeView(e){
    calendarElem.classList.toggle("h-full");
    let dateBoxes = Array.from(calendarElem.children[1].children[1].children);
    calendarElem.children[1].classList.toggle("h-[95%]");
    calendarElem.children[1].children[1].classList.toggle("overflow-auto")    
    dateBoxes.forEach((el,i) => {
        i<=29 ? el.classList.toggle("basis-1/4") : el.classList.toggle("basis-1/3");
        i<=29 ? el.classList.toggle("flex-auto") : "";
        el.classList.toggle("basis-1/7");
        el.classList.toggle("text-base/5");
        el.classList.toggle("text-base/4");
        el.classList.toggle("text-[1.5rem]");
        el.classList.toggle("h-10");
        el.classList.toggle("h-15");
        el.classList.toggle("text-left");
        if (!calendarElem.classList.contains("h-full")) el.lastChild.classList.add("hidden") ;
        else  {
            el.lastChild.classList.remove("hidden")
            if(activeMonthExpensesByDate[el.id]) el.lastChild.lastChild.textContent = zsToWords(activeMonthExpensesByDate[el.id]) ; 
        }
    })
    dynamicDisplayArea.classList.toggle("hidden");
    if (!dynamicDisplayArea.classList.contains("hidden")){
        setTimeout(() => {
            let len =  calendarElem.getBoundingClientRect().height;
            dynamicDisplayArea.style.height = screen.height - header.getBoundingClientRect().height - header.nextElementSibling.getBoundingClientRect().height*2 - footer.getBoundingClientRect().height - len + "px"
        },10)
    }
}

// Populates expense data in the actively displayed month in the UI. 
function snapshotDisplay(el,expense = "-",income = "-"){
    let div = document.createElement("div");
    div.className = "flex flex-col justify-between mb-1"
    el.append(div);
    let p = document.createElement("p");
    p.className = "text-center min-w-7 md:min-w-20 w-auto h-auto border-1 text-[0.5rem]"
    let pInc = p.cloneNode(true);
    let pExp = p.cloneNode(true);
    pExp.textContent = expense !== "-" ? "₹"+zsToWords(expense) : "₹ - " ;
    pInc.textContent = income !== "-" ? "₹"+zsToWords(income) : "₹ - " ;
    el.lastElementChild.append(pInc,pExp);
}

// Enables switching months forwards and backwards. Triggered from elements within the calendar area created using the createCalendar function. 
function scrollMonth(e){
    e.preventDefault();
    e.stopPropagation();
    let year = e.target.parentElement.previousElementSibling.textContent.wordAt(1);
    let monthnum = months.findIndex(m => m===e.target.parentElement.previousElementSibling.textContent.wordAt(0))+1;
    if(e.target.textContent === "<<"){
        monthnum -= 1;
    }
    else if(e.target.textContent === ">>"){
        monthnum += 1;
    }
    if (monthnum > 12) {
        monthnum = 1;
        year = year*1+1;  
    } 
    if (monthnum < 1) {
        monthnum = 12;
        year = year*1-1;  
    } 
    e.target.parentElement.previousElementSibling.remove();
    e.target.parentElement.remove();
    createCalendar(`${monthnum}/01/${year}`);
}

// unused
function monthlyWorkoutDates(){
    let monthnum = months.findIndex(m => m===calendarElem.lastElementChild.children[1].textContent);
    return [].flatMap(([k,{workoutName, ...v}])=> { 
        let d = new Date(k);
        return d.getMonth() === monthnum ? [d.getDate()] : [] ;
    })
}

// Changes the state of UI to the selected date. Trigged when date element is clicked, created using createCalendar function.
function handleDateClick(e){
    e ? e.stopPropagation() : "";
    sessionOutput = {};
    // let dateVal = e?.target.textContent.split("\n")[1] || "" ;
    // let clickedDate = dateVal ? new Date(dateVal + calendarElem.firstElementChild.textContent) : date;
    // let dt = clickedDate.getDate() < 10 ? "0"+clickedDate.getDate() : clickedDate.getDate() ;
    // let mn = clickedDate.getMonth()+1;
    // mn = mn < 10 ? "0"+mn : mn; 
    
    let displayDate = e?.target?.id || date.toAppFormatDate("yyyy","m","d","-");
    timestampEl.value = displayDate;
    let dateArr = displayDate.split("-");
    let start = `${dateArr[0]}-${dateArr[1]}-01`;
    incometimestampEl.value = displayDate;
    databyDate("expenseDB","",displayDate,function(res){if (res.length) {expenseTodayDisplay.textContent = res.map(obj => obj["value"]).reduce((a,b)=> a+b); e ? res.forEach(obj => sessionOutput[obj.category] = obj) : ""; if(Object.keys(sessionOutput).length){editExpenseBtn.disabled = false} }});
    // balanceTillDate(start,displayDate);
}

// Trigged when expenseupdate or incomeupdate UI buttons are clicked. Adds data to IndexedDB. 
function submitBtnClick(e){
    e.stopPropagation() ;
    let dbname;
    let bool = e.target.id === "expenseupdate" ? true : false ;
    dbname = bool ? "expenseDB" : "incomeDB";
    let expenseEntry = {} ;  
    let value = bool ? costDisplay.value*1 : incomeDisplay.value*1  ;
    let category = bool ? categoryEl.value : sourceEl.value ;
    let timestamp = bool ? timestampEl.value : incometimestampEl.value ;
    let detail = sessionOutput?.[Symbol.for("new")] ? sessionOutput[Symbol.for("new")]["detail"] : sessionOutput[category]?.["detail"] ;
    if (!value || !category || !timestamp){return}
    expenseEntry = {timestamp,category,value,detail};
    let tx = addEntry(db,expenseEntry,dbname);
    tx.oncomplete = (e) => {
        activeMonthExpensesByDate[timestampEl.value] = activeMonthExpensesByDate?.[timestampEl.value] ? activeMonthExpensesByDate[timestampEl.value]+value*1 : value*1;
        bool ? (categoryEl.value = "",costDisplay.value = "") : (sourceEl.value = "", incomeDisplay.value = "");
        let dateArr = timestamp.split("-");
        let start = `${dateArr[0]}-${dateArr[1]}-01`;
        databyDate("expenseDB","value",timestamp,function(res){expenseTodayDisplay.textContent = res.reduce((a,b)=> a+b);});
        balanceTillDate(start,timestamp);
        sessionOutput = {};
    }
}

// Trigged when expenseedit UI button is clicked. Updates existing IndexedDB data.
function editBtnClick(e){
    e.preventDefault();
    let dbname;
    let bool = e.target.id === "expenseedit" ? true : false ;
    dbname = bool ? "expenseDB" : "incomeDB";
    let expenseEntry = {} ;  
    let value = bool ? costDisplay.value*1 : incomeDisplay.value*1  ;
    let category = bool ? categoryEl.value : sourceEl.value ;
    let timestamp = bool ? timestampEl.value : incometimestampEl.value ;
    let detail = sessionOutput?.[Symbol.for("new")] ? sessionOutput[Symbol.for("new")]["detail"] : sessionOutput[category]?.["detail"] ;
    if (!value || !category || !timestamp){return}
    expenseEntry = {timestamp,category,value,detail};
    editEntry(db,expenseEntry,dbname);
    bool ? (categoryEl.value = "",costDisplay.value = "") : (sourceEl.value = "", incomeDisplay.value = "");
    sessionOutput = {};
    // let dateArr = timestamp.split("-");
    // let start = `${dateArr[0]}-${dateArr[1]}-01`;
    // databyDate("expenseDB","value",timestamp,function(res){expenseTodayDisplay.textContent = res.reduce((a,b)=> a+b);});
    // balanceTillDate(start,timestamp);
    // sessionOutput = "";
}

// Triggered on selecting a radio option based sub-category option when visiting past dates to update past data. Invoked from the handleModal function.
function populateDetailsItems(btn){
    let evt = new CustomEvent("touchend");
    let dataArr = Object.entries(sessionOutput);
    for (let [key,entry] of dataArr){ 
        btn.dispatchEvent(evt);
        [...detailsModal.firstElementChild.children].forEach((el,i) => {
            el.value = Object.values(entry)[i]    
        })
    }
}

// Event handling function triggered on clicking the "costdetails" or "incomedetails" <a> element. Includes all functionalities within the modal.
// Includes event listeners for checking each line entry to include in the record and sending details to expense area for adding/updating to DB.   
function handleModal(e){
    e.preventDefault();
    detailsModal.showModal();
    let handleAddNew;
    let bool = e.target.id === "costdetails" ? true : false;
    let currDate = timestampEl.value;
    // if (! expenseReceipts?.[currDate]) expenseReceipts[currDate] = {} ; 
    let constituents =  {}  ;
    let newentryBtn = document.getElementById("newentrybtn");
    let doneBtn = document.getElementById("donebtn");
    newentryBtn.addEventListener("touchend", handleAddNew = function(e){
        e.preventDefault();
        let row = document.createElement("span");
        let yesorno = document.createElement("p");
        let nameCol = document.createElement("input");
        nameCol.type ="text";
        let valueCol = document.createElement("input");
        valueCol.type = "number";
        let qtCol = document.createElement("input");
        qtCol.type = "number";
        let subCategoryCol = document.createElement("input");
        subCategoryCol.type = "text";
        let storeCol = document.createElement("input");
        storeCol.type = "text";
        row.className = "flex items-center gap-1";
        nameCol.className = "w-12 flex-auto justify-between tracking-widest border-b-1";
        valueCol.className = "w-12 flex-auto justify-between tracking-widest border-b-1";
        qtCol.className = "w-7.5 flex-auto justify-between tracking-widest border-b-1";
        subCategoryCol.className = "w-12 flex-auto justify-between tracking-widest border-b-1";
        storeCol.className = "w-12 flex-auto justify-between tracking-widest border-b-1";
        nameCol.value = "Item"+(detailsModal.childElementCount-1);
        valueCol.placeholder = "Amount";
        subCategoryCol.placeholder = "Sub-category" ;
        storeCol.placeholder = "Store-name" ;
        qtCol.value = 1 ;
        valueCol.required = true;
        yesorno.textContent = "✔️";
        yesorno.className = "yes w-4 flex-auto justify-between"
        yesorno.addEventListener("touchend",(e)=>{
            let spanChildren = [...e.target.parentElement.children];
            let inputs = spanChildren.slice(0,spanChildren.length-1);
            if(inputs.some(el => !el.value)){return}
            yesorno.classList.toggle("yes");
            if (!yesorno.classList.contains("yes")) {
                yesorno.textContent = "❌" ;
                let name = inputs[0].value ;
                let val = inputs[1].value ;
                let qty = inputs[2].value ;
                let subCat = inputs[3].value ;
                let store = bool ? inputs[4].value : "" ;
                constituents[name] = constituents?.[name]?.["name"] === name && constituents?.[name]?.["subCategory"] === subCat ? {name: name, value: constituents[name]["value"] + val*1, quantity: constituents[name]["quantity"]+qty*1, subCategory : subCat, storeName:  constituents[name]["storeName"]+ ", " + store} : {name: name, value: val*1, quantity: qty*1, subCategory : subCat, storeName: store};
                for(let elem of inputs){
                    elem.disabled = true;
                }
                e.target.parentElement.classList.toggle("bg-gray-200");
            }
            else {
                yesorno.textContent = "✔️";
                let name = inputs[0].value;
                for(let elem of inputs){
                    elem.disabled = false;
                }
                e.target.parentElement.classList.toggle("bg-gray-200");
                delete constituents[name];
            }
    })
    bool ? row.append(nameCol,valueCol,qtCol,subCategoryCol,storeCol,yesorno) : row.append(nameCol,valueCol,qtCol,subCategoryCol,yesorno);
    detailsModal.firstElementChild.before(row);
})
    doneBtn.addEventListener("touchend",()=>{
        e.preventDefault();
        let n = Object.keys(constituents).length;
        if (n){
            let sum = Object.values(constituents).map(o => o["value"]);
            if (bool) {costDisplay.value = sum.length ? sum.reduce((a,b)=>a+b) : costDisplay.value}
            else { incomeDisplay.value = sum.length ? sum.reduce((a,b)=>a+b) : costDisplay.value }
            categoryEl.value && sessionOutput?.[categoryEl.value] ? sessionOutput[categoryEl.value] = {timestamp:timestampEl.value ,category: categoryEl.value, value: costDisplay.value, detail: Object.values(constituents)} : sessionOutput[Symbol.for("new")] = {timestamp:timestampEl.value ,category: categoryEl.value, value: costDisplay.value, detail: Object.values(constituents)} ;
        }
        let len = detailsModal.childElementCount-1;
        [...detailsModal.children].slice(0,len).forEach(e => e.remove());
        newentryBtn.removeEventListener("touchend", handleAddNew);
        detailsModal.close()
    },{once:true})

    if(Object.keys(sessionOutput).length){
        let keys = Object.keys(sessionOutput);
        if(!sessionOutput[keys[0]]?.hasOwnProperty("detail")){
            return;
        }
        if (keys.length === 1) {
            let entryCopy = sessionOutput;
            categoryEl.value = keys[0];
            sessionOutput = sessionOutput[keys[0]]?.["detail"] ;
            populateDetailsItems(newentryBtn);
            sessionOutput =  entryCopy ;
        } 
        else if(keys.length > 1) {
            [...detailsModal.lastElementChild.children].forEach((el,i) => {el.disabled=true; i===0? el.removeEventListener("touchend",handleAddNew) : ""});
            let container = document.createElement("span")
            container.classList = ["flex justify-evenly flex-wrap"]
            let radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "category";
            let label = document.createElement("label");
            keys.forEach(k => {
                let innerSpan = container.cloneNode("")
                let radioClone = radio.cloneNode("true"); 
                let labelClone = label.cloneNode("true");
                radioClone.addEventListener("change",(e)=>{
                    let entryCopy = sessionOutput;
                    categoryEl.value = e.target.value;
                    sessionOutput = sessionOutput[e.target.value]?.["detail"] ;
                    detailsModal.firstElementChild.remove();
                    [...detailsModal.lastElementChild.children].forEach((el,i) => {el.disabled = false; i===0 ? el.addEventListener("touchend",handleAddNew) : ""});
                    populateDetailsItems(newentryBtn);
                    sessionOutput = entryCopy;
                })
                radioClone.value = k;
                labelClone.textContent = k;
                innerSpan.append(radioClone, labelClone);
                container.append(innerSpan); 
            });
            detailsModal.lastElementChild.before(container);
        }   
    }
}

// Extracts expense data from IndexedDB based on storename and key which is date. 
function databyDate(storename,data,date,callback){
    let promise = findEntry(db,storename,"timestamp",date)
    promise.onsuccess = request =>{
        let entries = request.target.result;
        let result = entries?.length > 0 ? entries.map(obj=> data ? obj[data] : obj) : 0 ;   
        callback(result);
    }
    promise.onerror = console.error;
}

// Returns expense till date value
function setValue(request,expenseTD){
    expenseTD = expenseTD*1 + request.value*1;
    return expenseTD
}

// Updates balance data on the current/selected day's status area UI 
function balanceTillDate(...range){
    incomeTodayDisplay.textContent = 0 ;
    balanceTodayDisplay.textContent = 0 ;
    let expenseTD = 0;
    findRange(db,"expenseDB","timestamp", request => {expenseTD = setValue(request,expenseTD)} ,range[0],range[1])
    setTimeout(()=>findRange(db,"incomeDB","timestamp",function(request){console.log(expenseTD,"2"); incomeTodayDisplay.textContent = incomeTodayDisplay.textContent*1 + request.value*1; balanceTodayDisplay.textContent = incomeTodayDisplay.textContent - expenseTD;},range[0],range[1]),100);

}

// color coding calendar dates based on presence of expense entry on that date. 
function hasEntry(elem,entry){
    // if(expenseReceipts.hasOwnProperty(elem.id)){
        let expense = Array.isArray(entry) ? entry.map(obj => obj["value"]).reduce((a,b)=>a*1+b*1) : entry["value"];
        let income = monthlyincome/30 || 0;
        let balance = income-expense;
        if(balance > 0 ) {elem.classList.add("bg-green-200"); elem.classList.remove("bg-white") ; elem.classList.remove("bg-red-200");}
        if(balance < 0 ) {elem.classList.remove("bg-green-200") ; elem.classList.add("bg-red-200"); elem.classList.remove("bg-white") ; }
        if(balance === 0 ) {elem.classList.remove("bg-green-200") ; elem.classList.remove("bg-red-200"); elem.classList.add("bg-white")} 
    // }
}

// Returns number as short decimal based value with symbols k,l,cr.
function zsToWords(num) {
    num = num.toString();
    if (num.length <= 3) {return num*1} 
    let wordsObj = {"000": "k", "00000":"L", "0000000":"Cr"}
    let zeros = num.toString().match(/0+$/)?.[0];
    if (!zeros || zeros.length < 3){
        let len = num.length-1;
        let keys = Object.keys(wordsObj);
        let zeros = keys.findLast(e => e.length <= len);
        let sym = wordsObj[zeros];
        let mult = zeros.length === len ? len : len-1
        return ((num/(Math.pow(10,mult))).toFixed(2)+sym)
    }
    else{
        for(let i= zeros; i != ""; i=i.slice(0,i.length-1)){
            let res = wordsObj[i]
            if(res){
                res = num.toString().replace(i,res)
                let ints = res.match(/\d+/g).join("");
                let sym = res.match(/[a-z]+/ig)[0];
                return (ints+sym)
            }
        }
    }
}

// Toggle to plot section. Triggered by clicking "plotsarea" element in the footer section.   
function showPlotFunction(e,period,baseDt=new Date()){
    if(baseDt > new Date()) return;
    let id = e.target.id; 
    if (e.target.localName === "path") id = e.target.parentElement.id;  
    if (id === "showplots") plotsArea.classList.toggle("hidden");
    !historyArea.classList.contains("hidden") ? historyArea.classList.toggle("hidden") : "";
    !plotsArea.classList.contains(`h-[${contentArea.style.height}]`) ? plotsArea.classList.toggle(`h-[${contentArea.style.height}]`) : "";
    if (plotsArea.classList.contains("hidden")) {
            plotContainers.forEach(el => el.replaceChildren());
            incomeByDate = {};
            categoryPlotData = {};
            subcategoryPlotData = {};
            categoryDatePlotData = {};
            subcategoryDatePlotData = {};
            valuesPlotData = {};
            zoomInBtn.removeEventListener("touchend",changePlotTimelines);
            zoomOutBtn.removeEventListener("touchend",changePlotTimelines);
        } 
    else {
            let promise = findEntry(db,"expenseDB","timestamp")
            promise.onsuccess = (res) => {
            if (!res.target.result.length) return;
            let firstDBEntryDate = new Date(res.target.result.at(0).timestamp);
            let weeknumLastEntry = getWeek (new Date(res.target.result.at(-1).timestamp));
            let lastEntryWeekDates =  getDateFromWeek(weeknumLastEntry).map(e => new Date(e));
            let end = e.target.nodeName !== "CANVAS" ? lastEntryWeekDates[1] : baseDt;
            let pastWeekStartEndDates = period === "weekly"? getDateFromWeek(getWeek(new Date(end - 5*7*24*60*60*1000)),1).map(e => new Date(e)) : "";
            let start = period === "weekly"? pastWeekStartEndDates[0]  : period === "monthly"? (new Date(end - 6*30*24*60*60*1000))  : new Date(end - 6*24*60*60*1000);
            console.log(start,end,period)
            let fullDBExtract = start.getTime() > end.getTime() ? [res.target.result.at(-1)] : res.target.result.filter(({timestamp,...o})=> new Date(timestamp)>=start && new Date(timestamp)<=end) ;
            if(!fullDBExtract.length || firstDBEntryDate.getTime() > new Date(end).getTime()) {
                zoomInBtn.addEventListener("touchend",changePlotTimelines);
                zoomOutBtn.addEventListener("touchend",changePlotTimelines);
                return
            }; 
            if(e.target.localName === "canvas") e.target.parentElement.replaceChildren();
                groupData(fullDBExtract,period||"daily",transformDataFromDB,e)
                createCanvas ()
            }
            promise.onerror = console.warn ;
        }
        
}

// Part of showPlotFunction. Changes the timeslines displayed by all available plots between daily, weekly and monthly. 
function changePlotTimelines(e){
    changePlotTimelines.counter = changePlotTimelines.counter || 0;
    let n = changePlotTimelines.counter;
    let i = e.target.dataset.value*1;
    let container = e.target.parentElement.parentElement;
    incomeByDate = {};
    categoryPlotData = {};
    subcategoryPlotData = {};
    categoryDatePlotData = {};
    subcategoryDatePlotData = {};
    valuesPlotData = {};
    n =  n+i;
    if (n>=0 && n <= 2){
        console.log(timelines[n]);
        [...container.children].forEach(el => el !==e.target.parentElement  ? el.replaceChildren() : "");
        showPlotFunction(e,timelines[n]);
    }
    else{
        n = n>2 ? n-1 : n<0 ? n+1 : n;
    }
    changePlotTimelines.counter = n ;
}

// returns week of year based on date argument.
function getWeek(date=new Date(),reverse){
    let yr = new Date(date).getFullYear();
    let targetDt = new Date(date);
    let first = new Date(`01/01/${yr}`);
    let firstdayofWeek = first.getDay() <= 3 ? 1 : 9-new Date(`01/01/${yr}`).getDay() ;   
    let firstWeekStartDate = new Date(`01/${firstdayofWeek}/${yr}`);
    let dateDifference = targetDt.getTime()-firstWeekStartDate.getTime();
    let lastWeekOfYr = Math.floor((new Date(`12/31/${yr}`).getTime()-new Date(`01/01/${yr}`).getTime())/(24*60*60*1000)/7)+1
    let weekNum = dateDifference >= 0 ? Math.floor(dateDifference/(7*24*60*60*1000))+1 : lastWeekOfYr ;
    yr = dateDifference >= 0 ? yr : yr-1 ;
    return weekNum +"-" + `${yr}`.slice(2,4) ;
    let firstWeek = new Date(first).getDay()-1 || 7;
    let fullWeekStartDate = `01/${7-firstWeek+1}/${new Date(date).getFullYear()}`;
    let firstWeekMax = `01/${7-firstWeek}/${new Date(date).getFullYear()}`;
    let week = new Date(date) < new Date (firstWeekMax) ? 1 :  Math.floor((new Date(date) - new Date(fullWeekStartDate))/(7*24*60*60*1000))+2;
    return week > 52 ? `1-${(new Date(date).getFullYear()+1).toString().slice(2,4)}` : `${week}-${new Date(date).getFullYear().toString().slice(2,4)}`
}

// returns date of year based on week argument.
function getDateFromWeek(week,num){
    // if (num > 6) num = 0; 
    let [mt,yr] = week.split("-");
    yr = (20+yr)*1 ;
    mt = mt*1-1;
    let first = new Date(`01/01/${yr}`);
    let gap = first.getDay() <= 3 ? first.getDay()-1 : 0;
    let firstdayofWeek = first.getDay() <= 3 ? 1 : 9-new Date(`01/01/${yr}`).getDay() ;   
    let firstWeekStartDate = new Date(`01/${firstdayofWeek}/${yr}`);
    // let gap = (firstWeekStartDate.getTime() - firstDate.getTime())/(24*60*60*1000) ;
    let daysToTargetDate = mt*7;
    targetWeekStart = new Date(firstWeekStartDate.getTime() + daysToTargetDate*24*60*60*1000 - gap*24*60*60*1000) // : new Date(firstWeekStartDate.getTime() + (daysToTargetDate-1)*24*60*60*1000) ;
    targetWeekEnd =  new Date(targetWeekStart.getTime() + 6*24*60*60*1000) //: new Date(targetWeekStart.getTime() - 6*24*60*60*1000) ;
    return [Math.min(targetWeekStart,targetWeekEnd),Math.max(targetWeekStart,targetWeekEnd)];
    if (mt === secondWeek) {return new Date(nextWeekStart.getTime()+(num??6)*24*60*60*1000)}
    else if (mt < secondWeek) {return new Date(nextWeekStart.getTime()-(num??1)*24*60*60*1000)}
    else{
        while (mt !==secondWeek){
            nextWeekStart = new Date(nextWeekStart.getTime()+7*24*60*60*1000) ;
            mt--;
        }
        return new Date(nextWeekStart.getTime()+(num??7)*24*60*60*1000)
    }
}
// Part of showPlotFunction. Get data from the DB and call functions to create plots. -------Unused
function storeDBData(filter,callback,evt){

        //     let promiseInc = findEntry(db,"incomeDB","timestamp");
        //     promiseInc.onsuccess = request => {
        //         let incomeDBData = request.target.result;
        //         let incomeStartDateYear =  incomeDBData.filter(({timestamp,...o})=> timestamp.includes(start.getFullYear()));
        //         let incomeTillPrevPeriod = incomeStartDateYear.filter(({timestamp,...o})=> new Date(timestamp) < start);
        //         let incomeTargetPeriod = incomeDBData.filter(({timestamp,...o})=> new Date(timestamp) >= start && new Date(timestamp) <= end);
        //         let cumulativeIncomePrev = incomeTillPrevPeriod.length ? incomeTillPrevPeriod.map(({value,...o})=>value*1).reduce((a,b)=>a+b) : 0 ;
        //         let days = (end-start)/(24*60*60*1000);
        //         for(let i=0 ; i<days; i++){
        //             let date = new Date(start.getTime()+i*24*60*60*1000).toAppFormatDate("yyyy","mm","dd","-");
        //             let k = incomeTargetPeriod.findIndex(({timestamp,...o})=>timestamp === date);                
        //             if (k>=0){
        //                 cumulativeIncomePrev += incomeTargetPeriod[k]["value"];
        //                 incomeByDate[date] = cumulativeIncomePrev;
        //             }
        //             else{
        //                 incomeByDate[date] = cumulativeIncomePrev;
        //             }
        //         }
        //     }      
        // promiseInc.onerror = console.error ;
}

// Part of showPlotFunction. Creates/Updates data objects to be used to create plots. 
function transformDataFromDB(dbData,bool,e){
    
    let swipeObj = e.target.dataset?.date ? [e.target.id] : ["categoryPlotData","subcategoryPlotData","subcategoryDatePlotData","categoryDatePlotData","valuesPlotData"];  
    for (let expenseDBData of dbData){
        let filteredDBData = expenseDBData//.filter(({timestamp,...o})=> timestamp >= start && timestamp <= end);
        let subcategories = filteredDBData.map(({detail,...o})=> detail?.map(({subCategory,value,...ob})=>[subCategory,value])||[]).flat();
        let periodSubCategories = filteredDBData.map(({timestamp, week, monthYr, detail,...o})=> [timestamp, week, monthYr, detail?.map(({subCategory,value,...ob})=>[subCategory,value])||[]]);
        if (swipeObj.includes("subcategoryPlotData")){
            for (let [subcategory,value] of subcategories){
                if(!subcategories || !value) continue; 
                let entry = subcategoryPlotData?.[subcategory] ? subcategoryPlotData?.[subcategory] + value*1 : value*1 ;
                subcategoryPlotData[subcategory] = entry;
            }
        }
        if (swipeObj.includes("subcategoryDatePlotData")){
            for (let [timestamp,week,monthYr,details] of periodSubCategories){
                let key = bool === "weekly" ? week : bool === "monthly" ? monthYr : timestamp;
                let subcatObj = subcategoryDatePlotData?.[key] || {}; 
                for(let [subcategory,value] of details){
                    let entry = subcatObj?.[subcategory] ? subcatObj?.[subcategory] + value*1 : value*1 ;
                    subcatObj[subcategory] = entry;
                }
                subcategoryDatePlotData[key] = subcategoryDatePlotData?.[key] ? {...subcategoryDatePlotData[key],...subcatObj} : subcatObj;
            }
        }
        if (swipeObj.includes("categoryDatePlotData") || swipeObj.includes("categoryPlotData")){
            for (let {category,value,timestamp,week,monthYr} of filteredDBData){
                    let key = bool === "weekly" ? week : bool === "monthly" ? monthYr : timestamp;
                    categoryPlotData[category] = categoryPlotData?.[category] ? categoryPlotData[category] + value*1 : value*1;   
                    let entry = categoryDatePlotData?.[key]?.[category] ? categoryDatePlotData?.[key]?.[category] + value*1 : value*1 ;
                    categoryDatePlotData[key] ? categoryDatePlotData[key][category] = entry : categoryDatePlotData[key] = {[category]:entry};
            }
        }
        if (swipeObj.includes("valuesPlotData")|| swipeObj.includes("categoryPlotData") || swipeObj.includes("subcategoryPlotData")){
            for (let {value,timestamp,week,monthYr} of filteredDBData){
                    let key = bool === "weekly" ? week : bool === "monthly" ? monthYr : timestamp;
                    valuesPlotData[key] = valuesPlotData?.[key] ? valuesPlotData?.[key] + value*1 : value*1 ;
            }
        }
        scale = new Array(Math.max(...Object.values(valuesPlotData)).toString().length-1).fill(0).map((e,i) => i===0 ? 1 : e).join("")*1;
    }
}

// Part of showPlotFunction.Groups data extracted from DB into periods based on the default daily option or as selected from the UI.
function groupData(dbArray,period,callback,e){
    if (period==="daily"){
        callback ([dbArray],period,e)
    }
    else{
        let firstEntryDate = dbArray[0].timestamp; 
        let periodStart = period==="weekly" ? getWeek(firstEntryDate) : `${new Date(firstEntryDate).getMonth()+1}-${new Date(firstEntryDate).getFullYear()}` ;
        let updatedDB = [];
        let len = dbArray.length; 
        let newEntries = [];
        for (let entry of dbArray){
            let entryDate = new Date(entry["timestamp"]);
            let entryWeek = getWeek(entryDate);
            let entryMonthYear = `${entryDate.getMonth()+1}-${entryDate.getFullYear()}`;
            newEntries.push({...entry,week:entryWeek,monthYr:entryMonthYear})
        }
        for (let i=0; i<len; i++){
            let elem = [];
            let bool = period === "weekly" ? (i) => newEntries[i]?.["week"] === periodStart :  (i) => newEntries[i]?.["monthYr"] === periodStart ;
            while(bool(i)){
                elem.push(newEntries[i++]) 
            }
            i--;
            if (period==="weekly") {
                let p = periodStart.split("-")[0]*1;
                let y = periodStart.split("-")[1]*1;
                let lastWeekOfYr = Math.floor((new Date(`12/31/${y}`).getTime()-new Date(`01/01/${y}`).getTime())/(24*60*60*1000)/7)+1
                periodStart = p+1 > lastWeekOfYr ? `1-${y+1}` : `${p+1}-${y}`;
            }
            else {
                let k;
                let key = periodStart.split("-").map((e,i,arr) =>{
                    if(i===0) {k = e*1+1<=12 ? e*1+1 : 1; return k}
                    if(i===1) {return e = k<arr[0] ? e*1+1 : e }
                })
                periodStart = key.join("-")
            }
            updatedDB.push(elem);
        }
        callback(updatedDB,period,e);
    }
}

// unused
function addperiodControlElem (){
    let controlView = document.createElement("p");
    controlView.classList = ["box-border p-[0.5vw] flex justify-center items-center size-3 border-1 text-[0.75rem] text-white"];
    controlView.addEventListener("touchend",(e)=>console.log(e.target.id));
    let controlViewContainer = document.createElement("span");
    controlViewContainer.classList = ["w-[fit-content] flex gap-1 bg-gray/75 bg-color-white justify-self-center"];
    let zoomIn = controlView.cloneNode("true");
    zoomIn.textContent = "+";
    zoomIn.id = "collapse";
    let zoomOut = controlView.cloneNode("true");
    zoomOut.textContent = "-";
    zoomOut.id = "expand";
    controlViewContainer.append(zoomIn,zoomOut);
    return controlViewContainer;
}

// Part of showPlotFunction. Creates canvas for each plot and calls svg JS file to run code to create appropriate plot.
function createCanvas (){
    let variables = {}
    for (let i=1; i<=5; i++){
        variables[`plot${i}`] = canvas.cloneNode(true);   
        variables[`context${i}`] = variables[`plot${i}`].getContext("2d");   
    }
    variables["plot1"].dataset["date"] = Object.keys(valuesPlotData).slice(-1)?.[0];
    variables["plot1"].id = "valuesPlotData";
    if(!plotContainers[0].childElementCount){
        if(variables["plot1"].id) createChart(variables["context1"],{x:15,y:120,w:30,h:-1,d:35},{values:valuesPlotData,scale,xAxisLabels:true,yAxisLabels:true,legend :["#f00"],callback: el => plotContainers[0].append(el)},{"fillStyle":"#f00"});
        plotContainers[0].append(variables[`plot1`]);
        variables["context1"].font = "20px Georgia";
        variables["context1"].strokeText("Expenses",10,15);
        variables["context1"].font = "10px Georgia";
        let printValue = variables["plot1"].dataset["date"];
        let printArr = printValue.split("-");
        printValue = printArr.length === 3 ? "Dates" : printArr[1].length === 4 ? "Months" : "Weeks" ; 
        variables["context1"].strokeText(`${printValue}`,135,145);
    }
    // lineChart(variables.context1,25,130,35,incomeByDate);
    
    
    variables["plot2"].dataset["date"] = Object.keys(categoryDatePlotData).slice(-1)?.[0];
    variables["plot2"].id = "categoryDatePlotData";
    if(!plotContainers[1].childElementCount){
        if(variables["plot2"].id) createStackedChart(variables["context2"],{x:15,y:120,w:30,h:-1,d:35},{values:categoryDatePlotData,legend: el => {plotContainers[1].append(el)}});
        plotContainers[1].append(variables[`plot2`]);
        variables["context2"].font = "20px Georgia";
        variables["context2"].strokeText("Expense categories",10,15);
        variables["context2"].font = "10px Georgia";
        let printValue = variables["plot2"].dataset["date"];
        let printArr = printValue.split("-");
        printValue = printArr.length === 3 ? "Dates" : printArr[1].length === 4 ? "Months" : "Weeks" ; 
        variables["context2"].strokeText(`${printValue}`,135,145);
    }
    variables["plot3"].dataset["date"] = Object.keys(subcategoryDatePlotData).slice(-1)?.[0];
    variables["plot3"].id = "subcategoryDatePlotData";
    if(!plotContainers[2].childElementCount){
        if(variables["plot3"].id) createStackedChart(variables["context3"],{x:15,y:120,w:30,h:-1,d:35},{values:subcategoryDatePlotData,legend: el => {plotContainers[2].append(el)}});
        plotContainers[2].append(variables[`plot3`]);
        variables["context3"].font = "20px Georgia";
        variables["context3"].strokeText("Expense sub-categories",10,15);
        variables["context3"].font = "10px Georgia";
        let printValue = variables["plot3"].dataset["date"];
        let printArr = printValue.split("-");
        printValue = printArr.length === 3 ? "Dates" : printArr[1].length === 4 ? "Months" : "Weeks" ; 
        variables["context3"].strokeText(`${printValue}`,135,145);
    }
    variables["plot4"].dataset["date"] = Object.keys(valuesPlotData).slice(-1)?.[0];
    variables["plot4"].id = "categoryPlotData";
    if(!plotContainers[3].childElementCount){
        pieChart(variables["context4"],150,80,50,0,0,false,{values:categoryPlotData ,legend: el => {plotContainers[3].append(el)}});
        plotContainers[3].append(variables[`plot4`]);
        variables["context4"].font = "20px Georgia";
        variables["context4"].strokeText("Expense categories",10,15);
        variables["context4"].font = "10px Georgia";
        let printValue = variables["plot4"].dataset["date"];
        let printArr = printValue.split("-");
        // let x = printArr.length === 3 ? 100 : 135;
        // printValue = printArr.length === 3 ? new Date(new Date(printValue).getTime() - 7*24*60*60*1000).toAppFormatDate("dd","mm","yyyy","-")+" to "+new Date(printValue).toAppFormatDate("dd","mm","yyyy","-") : printValue ;
        printValue = printArr.length === 3 ? "Dates Cumulative" : printArr[1].length === 4 ? "Months Cumulative" : "Weeks Cumulative" ; 
        variables["context4"].strokeText(`${printValue}`,110,145);
    }
    variables["plot5"].dataset["date"] = Object.keys(valuesPlotData).slice(-1)?.[0];
    variables["plot5"].id = "subcategoryPlotData";
    if(!plotContainers[4].childElementCount){
        pieChart(variables["context5"],150,80,50,0,0,false,{values:subcategoryPlotData ,legend: el => {plotContainers[4].append(el)}});
        plotContainers[4].append(variables[`plot5`]);
        variables["context5"].font = "20px Georgia";
        variables["context5"].strokeText("Expense sub-categories",10,15);
        variables["context5"].font = "10px Georgia";
        let printValue = variables["plot5"].dataset["date"];
        let printArr = printValue.split("-");
        // let x = printArr.length === 3 ? 110 : 135;
        // printValue = printArr.length === 3 ? new Date(new Date(printValue).getTime() - 7*24*60*60*1000).toAppFormatDate("dd","mm","yyyy","-")+" to "+new Date(printValue).toAppFormatDate("dd","mm","yyyy","-") : printValue; 
        printValue = printArr.length === 3 ? "Dates Cumulative" : printArr[1].length === 4 ? "Months Cumulative" : "Weeks Cumulative" ;
        variables["context5"].strokeText(`${printValue}`,110,145);
    }
    zoomInBtn.addEventListener("touchend",changePlotTimelines);
    zoomOutBtn.addEventListener("touchend",changePlotTimelines);
}

// Part of showPlotFunction. Swipe functioanlity provided to plot canvas to switch between past values chunks and current period values chunk.  
function swipeChart(z){
        z.stopPropagation();
        if (z.target.nodeName !== "CANVAS" || !z) return ;
        let touchStartX = z.touches[0].clientX;
        let touchStartY = z.touches[0].clientY;
        z.target.addEventListener("touchend",(e)=>{
            let touchEndX = e.changedTouches[0].clientX;
            let touchEndY = e.changedTouches[0].clientY;
            let swipeDistanceX = touchEndX-touchStartX;
            let swipeDistanceY = Math.abs(touchEndY-touchStartY);
            let freq = timelines[changePlotTimelines.counter||0];
            let promise = findEntry(db,"expenseDB","timestamp");
            promise.onsuccess = (dbData) => {
                let referenceDate =  dbData.target.result.at(-1).timestamp; 
                if (Math.abs(swipeDistanceX)>150 && swipeDistanceX < 0) {
                    if (freq === "daily" ) referenceDate = new Date(new Date(e.target.dataset.date).getTime()+7*24*60*60*1000);
                    else if (freq === "weekly" ) {
                        let referenceDates = getDateFromWeek(e.target.dataset.date,1);
                        referenceDate = new Date(new Date(referenceDates[0]).getTime()+5*7*24*60*60*1000-24*60*60*1000) ;
                    }
                    else{
                        let [mt,yr] = e.target.dataset.date.split("-");
                        mt = mt*1;
                        yr = (20+yr)*1;
                        let dmy = "31" 
                        let dates = new Date(`${mt}/31/${yr}`).getMonth() === new Date(`${mt}/15/${yr}`).getMonth() ? 31 : 30 ; 
                        dates =  new Date(`${mt}/29/${yr}`).getMonth() === 1 ? 29 : new Date(`${mt}/28/${yr}`).getMonth()===1 ? 28 : dates ;
                        referenceDate = new Date(new Date(`${mt}-${dates}-${yr}`).getTime() + dates*24*60*60*1000);
                    }
                    incomeByDate = {};
                    categoryPlotData = {};
                    subcategoryPlotData = {};
                    categoryDatePlotData = {};
                    subcategoryDatePlotData = {};
                    valuesPlotData = {};
                    showPlotFunction(e,timelines[changePlotTimelines.counter],referenceDate);
                }
                if (Math.abs(swipeDistanceX)>150 && swipeDistanceX > 0) {
                    if (freq === "daily" ) referenceDate = new Date(new Date(e.target.dataset.date).getTime()-7*24*60*60*1000);
                    else if (freq === "weekly" ) {
                        let referenceDates = getDateFromWeek(e.target.dataset.date,0);
                        referenceDate = new Date(new Date(referenceDates[0]).getTime()-5*7*24*60*60*1000-24*60*60*1000) ;
                    }
                    else{
                        let [mt,yr] = e.target.dataset.date.split("-");
                        mt = mt*1;
                        yr = (20+yr)*1;
                        let dates = new Date(`${mt}/31/${yr}`).getMonth() === new Date(`${mt}/15/${yr}`).getMonth() ? 31 : 30 ; 
                        dates =  new Date(`${mt}/29/${yr}`).getMonth() === 1 ? 29 : new Date(`${mt}/28/${yr}`).getMonth()===1 ? 28 : dates ;
                        referenceDate = new Date(new Date(`${mt}-${dates}-${yr}`).getTime() - dates*24*60*60*1000);
                    }
                    incomeByDate = {};
                    categoryPlotData = {};
                    subcategoryPlotData = {};
                    categoryDatePlotData = {};
                    subcategoryDatePlotData = {};
                    valuesPlotData = {};
                    showPlotFunction(e,timelines[changePlotTimelines.counter],referenceDate);
                }
            }
            promise.onerror = console.warn;
        },{once:true})
}

// Toggle to/from history section. Displays years for which data is available in DB. Selection to be made from UI, triggering event handled by this function. 
function showHistoryFunction(e){
    historyArea.classList.toggle("hidden");
    !plotsArea.classList.contains("hidden") ? plotsArea.classList.toggle("hidden") : "";
    
    let container = document.getElementById("historycontainer");
    let filterVal = document.getElementById("chooseyear");
    if (!historyArea.classList.contains("hidden")){    
        let promise = findEntry(db,"expenseDB","timestamp");
        promise.onsuccess = request => {
            let expenses = request.target.result;
            let optionEl = document.createElement("option");
            expenses.map(({timestamp,...o})=>timestamp.slice(0,4)).unique().forEach(y => {
                let option = optionEl.cloneNode(true)
                option.value = y;
                option.textContent = y;
                option.id = y
                filterVal.append(option);
            })
            filterVal.onchange = (e) => getFilter(e,expenses,container);
            let searchEl = document.getElementById("searchinput");
            searchEl.value = "";
            searchEl.disabled = "true";
        }
        promise.onerror = console.error;
    }
    else{
        filterVal.onchange = "";
        container.firstElementChild.replaceChildren();
        [...filterVal.children].forEach((e,i) => i>0 ? e.remove() : "" );
        if (!container.classList.contains("hidden")) container.classList.add("hidden") ;
        container.nextElementSibling.classList.contains("hidden") ? container.nextElementSibling.classList.remove("hidden") : "" ;
    }
}

// Part of showHistoryFunction. Populate entries in the history area section and impart functionality to each fieldset that contains expense entry for each available date.
function getFilter(e,dbArr,el){
    
    let searchEl = document.getElementById("searchinput");
    if (dbArr.length < 1 || e.target.value === ""){ 
        if (!el.classList.contains("hidden")) el.classList.add("hidden") ;
        el.nextElementSibling.classList.contains("hidden") ? el.nextElementSibling.classList.remove("hidden") : "" ;
        searchEl.setAttribute("disabled","");
        searchinput.removeEventListener("search", searchEventFunc(e))
        return;
    }
    searchEl.removeAttribute("disabled"); 
    dbArr = dbArr.filter(({timestamp,...o})=>timestamp.includes(e.target.value));
    let ogArray = [...dbArr];
    searchinput.addEventListener("search", function searchEventFunc(e){dbArr = handleSearch(ogArray,e.detail); displayHistory()});
    displayHistory();
    function displayHistory(){
        dbArr = dbArr.length ? dbArr : ogArray;
        let uniqueDates = dbArr.map(({timestamp,...o})=>timestamp).unique();
        if(el.childElementCount === uniqueDates.length){
            !el.nextElementSibling.classList.contains("hidden") ? el.nextElementSibling.classList.add("hidden") : "" ;
            el.classList.contains("hidden") ? el.classList.remove("hidden") : "";
            return;
        }
        !el.nextElementSibling.classList.contains("hidden") ? el.nextElementSibling.classList.add("hidden") : "" ;
        el.classList.contains("hidden") ? el.classList.remove("hidden") : "";
        el.firstElementChild?.replaceChildren();
        let childNode = createElement("fieldset",["box-border w-[95vw] min-h-20 h-[fit-content] grid text-white border-1 border-black bg-gray-200"])
        let label = createElement("legend", ["text-black font-bold tracking-widest"])
        let contentBox = createElement("div",["gridmembercss flex w-inherit h-inherit p-1"]);
        let content = createElement("span");
        let text = createElement("p");

        childNode.append(label);
        let sum = 0;
        for(let uDate of uniqueDates){  
            let nodeClone = childNode.cloneNode("true");
            let n=0;
            let hasDetails = true;
            dbArr.filter(({timestamp,...o}) => timestamp===uDate).forEach(({timestamp,value,category,detail},i) => {
                n++;
                if (uDate==='2026-03-08') 
                if (!detail) { hasDetails = false ; return;}
                let contentBoxClone = contentBox.cloneNode("true");
                if(n>1){contentBoxClone.classList.add("hidden")}
                let subCatBox = content.cloneNode("true");
                subCatBox.className = "flex justify-end w-full h-[fit-content] max-h-12 gap-[0.05vw] basis-1/3 flex-wrap overflow-y-auto"
                subCatBox.addEventListener("touchend",(e)=>{
                    e.stopPropagation();
                    subCat = [];
                    let target = e.target.parentElement;
                    if (target.localName !== "span") return;
                    let key = ["subCategory","storeName","name"].findIndex(val => val === target.id);
                    key = key === 2 ? 0 : key+1;
                    target.replaceChildren();
                    Object.values(detail).forEach(({subCategory,storeName,name}) => {
                    let variable = [subCategory,storeName,name][key];     
                    if(!subCat.includes(variable)){
                        let cn = text.cloneNode("true");
                        cn.className = "px-1 text-black italic text-[0.5rem] tracking-widest border-1"
                        subCat.push(variable)
                        cn.textContent = variable
                        target.id = ["subCategory","storeName","name"][key];
                        target.append(cn)
                    };
                    })
                })
                let catBox = content.cloneNode("true");
                catBox.className = "flex justify-evenly w-full basis-2/3 flex-auto h-10"
                let subCat = [];
                i > 0 ? contentBoxClone.classList.add("hidden") : "";
                const nextFn = (currentTab,nextTab) => {currentTab.classList.toggle("hidden"); nextTab.classList.toggle("hidden");};
                const prevFn = (currentTab,prevTab) => {currentTab.classList.toggle("hidden");prevTab.classList.toggle("hidden");} ;
                const nextmarkerFn = (currentTab,nextTab) => {currentTab.setAttribute("fill","white"); nextTab.setAttribute("fill","black");};
                const prevmarkerFn = (currentTab,prevTab) => {currentTab.setAttribute("fill","white"); prevTab.setAttribute("fill","black");} ;
                contentBoxClone.addEventListener("touchend",(e)=>{
                    const target = e.target.nodeName === "DIV" ? e.target.parentElement : e.target.nodeName === "SPAN" ? e.target.parentElement.parentElement : e.target.nodeName === "P" ? e.target.parentElement.parentElement.parentElement : "" ;
                    const svgEL = target.lastElementChild.previousElementSibling;
                    target.localName === "fieldset" ?  (createSwipeFunction({elm:target,nextFn,prevFn,remove:true},"legend","svg"),createSwipeFunction({elm:target,targetEL:svgEL,nextFn:nextmarkerFn,prevFn:prevmarkerFn,idFn: elem => elem.getAttribute("fill")==="black",remove:true})) : "" ;
                })
                let c1 = text.cloneNode("true");
                c1.className = "text-black text-[1.5rem] max-w-25 text-nowrap overflow-hidden text-ellipsis"
                let c2 = text.cloneNode("true");
                c2.className = "text-black text-[2rem] max-w-25 text-nowrap"
                Object.values(detail).forEach(({subCategory,storeName,name}) => {
                if(!subCat.includes(subCategory)){
                        let cn = text.cloneNode("true");
                        cn.className = "px-1 text-black italic text-[0.5rem] tracking-widest border-1"
                        subCat.push(subCategory)
                        cn.textContent = subCategory;
                        subCatBox.id = "subCategory"
                        subCatBox.append(cn)
                    };
                })
                c1.textContent = category;
                c2.textContent = "₹"+ zsToWords(value);
                sum += value;
                catBox.append(c1,c2);
                contentBoxClone.append(catBox,subCatBox);
                nodeClone.lastElementChild.before(contentBoxClone)
              
            })
            if (hasDetails){
                nodeClone.lastElementChild.textContent = uDate;
                pageMarker(e=>nodeClone.lastElementChild.before(e),n);
                el.firstElementChild.append(nodeClone);
            }
        }
        el.lastElementChild.textContent = zsToWords(sum);
        el.lastElementChild.addEventListener("touchstart", handleDrag)
    }
}

// Part of showHistoryFunction. Trigged from the custom search UI element written in customelement.js file. Filters array of all historical entries by date, category, name, and sub-category, returning filtered array.
function handleSearch(array,string){
    
    return array.flatMap(({timestamp,value,detail,category})=>{
        if(category.toLowerCase() === string.toLowerCase()){
            return [{timestamp,value,detail,category}]
        }
        else{
            let newDetail = []
            for (let obj of detail){
                if (obj.name.toLowerCase() === string.toLowerCase()){
                    newDetail.push(obj);
                }
                if (obj.subCategory.toLowerCase() === string.toLowerCase()){
                    newDetail.push(obj);
                }
            }
            if(newDetail.length){
                detail = newDetail;
                value = detail.map(({value,...o})=>value).reduce((a,b)=>a+b) ; 
                return [{timestamp,value,detail,category}]
            }
            else{
                return [];
            }
        }
    })
}

// Part of showHistoryFunction. Enables switching between all fieldset entries in case multiple expense entries are available in a day.
function handleDrag(e){
    e.preventDefault();
    let initialX = e.touches[0].clientX;
    let initialY = e.touches[0].clientY;
    let windowWidth = window.innerWidth-e.target.clientWidth/2;
    let windowHeight = window.innerHeight-e.target.clientHeight/2;
    let maxLeftMovementX = initialX - e.target.clientWidth/2;
    maxLeftMovementX = maxLeftMovementX > 0 ? maxLeftMovementX : 0; 
    let maxRightMovementX = windowWidth - initialX;
    maxRightMovementX = maxRightMovementX > 0 ? maxRightMovementX : 0;
    let maxBottomMovementY = initialY - e.target.clientHeight/2;
    maxBottomMovementY = maxBottomMovementY > 0 ? maxBottomMovementY : 0; 
    let maxTopMovementY = windowHeight - initialY;
    maxTopMovementY = maxTopMovementY > 0 ? maxTopMovementY : 0;
    let pastPositionLeft = e.target.style.left.slice(0,e.target.style.left.length-2)*1;
    let pastPositionBottom = e.target.style.bottom.slice(0,e.target.style.bottom.length-2)*1;
    e.target.addEventListener("touchmove",move)
    e.target.addEventListener("touchend",(e) => {e.target.removeEventListener("touchmove",move)},{once:true})
    
    function move(nextEvt) {
        nextEvt.preventDefault()
        let currentX = nextEvt.changedTouches[0].clientX ;
        let currentY = nextEvt.changedTouches[0].clientY ;
        let moveLeftX = initialX - currentX < maxLeftMovementX ?  Math.round(initialX - currentX) : Math.round(maxLeftMovementX);
        let moveTopY = currentY - initialY < maxTopMovementY ?  Math.round(currentY - initialY) : Math.round(maxTopMovementY);
        let moveRightX = currentX - initialX < maxRightMovementX ?  Math.round(currentX - initialX) : Math.round(maxRightMovementX);
        let moveBottomY = initialY - currentY < maxBottomMovementY ?  initialY - currentY : Math.round(maxBottomMovementY);
        if (currentX-initialX > 0) {
            nextEvt.target.style.left = (pastPositionLeft+moveRightX) + "px";
        }
        else{
            nextEvt.target.style.left = (pastPositionLeft-moveLeftX) + "px";
        }
        if (currentY-initialY < 0) {
            nextEvt.target.style.bottom = (pastPositionBottom+moveBottomY) + "px";
        }
        else{
            nextEvt.target.style.bottom = (pastPositionBottom-moveTopY) + "px";
        }
    }   
}

// Part of showHistoryFunction. Visually represents switching between all fieldset entries by using a filled circle svg.
function pageMarker(callback,num){
    let svgEl = document.createElementNS("http://www.w3.org/2000/svg","svg") 
    svgEl.setAttribute("viewBox", "0 0 100 100");
    let w = num*10+10 > 50 ? num*10+10 : 50
    svgEl.setAttribute("width", w);
    svgEl.setAttribute("height", 10);
    svgEl.classList = ["mb-1 bg-black/50 justify-self-center rounded-md"]; 
    let circle = document.createElementNS("http://www.w3.org/2000/svg","circle")
    circle.setAttribute("r",25);
    circle.setAttribute("cy", 50);
    circle.setAttribute("stroke-width", "1");
    for (let i=0; i<num; i++){
        let clone = circle.cloneNode("true");
        let ypos = 50-(50*(num-1))+(100*i);
        clone.setAttribute("cx", ypos);
        clone.id = "marker"+i
        i===0 ? clone.setAttribute("fill", "black") : clone.setAttribute("fill", "white");
        svgEl.append(clone);
    }
    callback(svgEl);
}

// Common function enabling swiping actions to move between entries/elements in a container element. 
function createSwipeFunction({elm,targetEL=elm,nextFn,prevFn,idFn=el => !el.classList.contains("hidden"),once=false},...filters){
    elm.addEventListener("touchstart",(e)=>{
        e.stopPropagation();
        let touchStartX = e.touches[0].clientX;
        let touchStartY = e.touches[0].clientY;
        elm.addEventListener("touchend",(z)=>{
            let touchEndX = z.changedTouches[0].clientX;
            let touchEndY = z.changedTouches[0].clientY;
            let swipeDistanceX = touchEndX-touchStartX;
            let swipeDistanceY = Math.abs(touchEndY-touchStartY);
            let currentTab = [...targetEL.children].filter(node => !filters.includes(node.localName)).find(idFn);
            let nextTab = !filters.includes(currentTab?.nextElementSibling?.localName) ? currentTab?.nextElementSibling : null;
            let prevTab = !filters.includes(currentTab?.previousElementSibling?.localName) ? currentTab?.previousElementSibling : null;
            
            if (Math.abs(swipeDistanceX)>150 && swipeDistanceX < 0 && nextTab) {
                if(!nextTab) return ;
                nextFn(currentTab,nextTab);
            };
            if (Math.abs(swipeDistanceX)>150 && swipeDistanceX > 0 && prevTab) {
                if(!prevTab) return ;
                prevFn(currentTab,prevTab);
            };
        },{once:true})
    },{once:once})
}

// triggered by clicking "filedownload" element in footer section UI. Downloads text based tab-separated extract of all expense data in DB.
function downloadFile(){
    let data = "date\tcategory\ttotal\titem\tquantity\tsub-category\tstore\tamount";
    let promise = findEntry(db,"expenseDB","timestamp");
    promise.onsuccess = (e) => {
        // debugger
        let allData = e.target.result;
        let dbString = data; 
        for (let entry of allData){
            let {timestamp, category, value:total, detail} = entry ;
            if (!detail?.length){
                dbString += `\n${new Date(timestamp)}\t${category}\t${total}\t\t\t\t\t`
            }
            else{
                for (let line of detail){
                    let {name,value,quantity,subCategory,storeName} = line; 
                    dbString += `\n${new Date(timestamp)}\t${category}\t${total}\t${name}\t${quantity}\t${subCategory}\t${storeName}\t${value}`
                }
            }
        }
        let blob = new Blob([dbString], {type: "text/plain"});
        let fileURL = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = fileURL;
        a.download = "export.txt";
        a.click();
    }
}   

// triggered by clicking "fileupload" element in footer section UI. Allows uploading expense data in pre-defined format which will then be used to update/add entries in DB.
function uploadFile(e){
    let input = document.createElement("input")
    input.type = "file";
    input.accept = ".txt"
    input.addEventListener("cancel", ()=>{
        let file = "";
    },{once:true})
    input.addEventListener("change", ()=>{
        let file = input.files[0];
        let reader = new FileReader();
        reader.onload = () =>{
            let contents = reader.result ;            
            let dataArray = contents.split("\n").map(str => str.replace("\r","").split("\t")).filter(obj => obj.length>1);
            let headers = dataArray.shift();
            let dbInputObj = {}; 
            for (let line of dataArray){
                let [timestamp,category,total,name,quantity,subCategory,storeName,value] = line;
                timestamp = new Date(timestamp).toAppFormatDate("yyyy","mm","dd","-")
                let key = timestamp+category;
                let detail = subCategory !== "" && name !== "" ? {name,quantity:quantity*1,value:value*1,subCategory,storeName} : "";
                if (dbInputObj?.[key]){
                    let index = dbInputObj?.[key]["detail"].findIndex(item => item["name"] === name && item["subCategory"] === subCategory);
                    if (index < 0){
                        dbInputObj[key]["detail"].push(detail);
                        dbInputObj[key]["value"] = dbInputObj[key]["value"]*1+value*1; 
                    }
                    else{
                        let item = dbInputObj?.[key]["detail"][index];
                        detail = {name,quantity: quantity*1+item["quantity"]*1,value: value*1+item["value"]*1,subCategory,storeName: storeName+", "+item["storeName"]};
                        dbInputObj[key]["detail"] = [detail];
                        dbInputObj[key]["value"] = dbInputObj[key]["value"]*1+value*1;
                    }
                }
                else{ 
                    dbInputObj[key] = detail ? {timestamp,category,value:total*1,detail: [detail]} : dbInputObj[key] = {timestamp,category,value:total*1} ;
                }
            }
            let dbInputEntries = Object.values(dbInputObj) ;
            let tx; 
            for(let entry of dbInputEntries){
                tx = addEntry(db,entry,"expenseDB");
            }
            tx.oncomplete = () => document.location = "index.html"
        }
        reader.onerror = console.warn;
        reader.readAsText(file)
    },{once:true})
    input.click();
}


// common function used to create elements. Arguments are element name, tailwind based classes and property key-value pair objects as rest parameters.
function createElement(name,classlist,...properties){
    let el = document.createElement(name);
    Array.isArray(classlist) ? el.classList = classlist : "";
    for (let property of properties){
        let [propname, propvalue] = Object.entries(property);
        el.setAttribute(propname,propvalue)
    }
    return el; 
}

// Call/Initialize IndexDB. Set initial state of page on successful invocation.
function createIndexedDB(dbname,version,...stores){
    let objectStore = null ;
    let request = indexedDB.open(dbname,version);
    request.addEventListener("error", console.error);

    request.addEventListener("success", (event) => {
        db = event.target.result;
        console.log("success",db);
        if( dbname !== "incomeDB"){
            createCalendar(date);
            handleDateClick();
            createSwipeFunction({elm:dynamicDisplayArea,nextFn:(currentTab,nextTab) => {currentTab.classList.toggle("hidden"); nextTab.classList.toggle("hidden");},prevFn: (currentTab,prevTab) => {currentTab.classList.toggle("hidden");prevTab.classList.toggle("hidden");}});
            timestampEl.disabled = true;
            // getExpensesByCurrMonth()
        }
        let ymdDate = date.toAppFormatDate("yyyy","mm","dd","-") ;
        timestampEl.value = ymdDate;
        incometimestampEl.value = ymdDate;
    });

    request.addEventListener("upgradeneeded", (event) => {
        db = event.target.result;

        if( !db.objectStoreNames.contains(dbname)){
            for (let store of stores){
                let dbChild = Object.keys(store)[0];
                let indexObject = Object.values(store)[0];
                let indexKeys = Object.keys(indexObject);
                let indexes = Object.values(indexObject);
                objectStore = db.createObjectStore(dbChild,{keyPath:[indexes[0],indexes[1]]});
                for(let i=0; i<indexKeys.length; i++){
                    objectStore.createIndex(indexKeys[i],indexes[i],{unique: false});
                }
            }
        }
        console.log("upgrade",db);
    });    
}

// Creates a new transaction.
function makeTransac(db,storename,mode){
    let tx = db.transaction(storename,mode);
    tx.onerror = console.error;
    return tx;
}

// Add entry to DB.
function addEntry(db,entry,storename){
    let transaction = makeTransac(db,storename,"readwrite");
    let store = transaction.objectStore(storename);
    let key = [entry["timestamp"],entry["category"]];
    let dbEntries = store.getAll(key);
    verifyAdd(dbEntries,entry,store)
    return transaction;
}

// Edit entry in DB.
function editEntry(db,entry,storename){
    let transaction = makeTransac(db,storename,"readwrite");
    transaction.oncomplete = (e) => console.log(e);
    let store = transaction.objectStore(storename);
    let key = [entry["timestamp"],entry["category"]];
    let hasKey = store.getKey(key);
    hasKey.onsuccess = () => {
            let editdbEntries = store.put(entry);
            editdbEntries.onsuccess = console.log("success");
            editdbEntries.onerror = () => {
                let replacedbEntries = store.add(key);
                replacedbEntries.onsuccess = () =>{ 
                    console.log("replaced");
                    let deletedbEntries = store.delete(key);
                    deletedbEntries.onsuccess = console.log("deleted");
                    deletedbEntries.onerror = console.warn;
                }
                replacedbEntries.onerror = console.warn;
            }
            editdbEntries.onerror = console.warn;
        }
    hasKey.onerror = console.warn;
}

// Delete entry from DB.
function deleteEntry(db,key,storename){
    let transaction = makeTransac(db,storename,"readwrite");
    transaction.oncomplete = (e) => {
        if(activeMonthExpensesByDate?.[timestampEl.value]) activeMonthExpensesByDate[timestampEl.value] = activeMonthExpensesByDate[timestampEl.value]-value*1;
        costDisplay.value = "";
        categoryEl.value = "";
    }
    let store = transaction.objectStore(storename);
    let filter = IDBKeyRange.only(key) ;
    let index = !Array.isArray(key) ? store.index("timestamp") : store;
    let value = 0;
    index.openCursor(filter).onsuccess = (e) => {
        let cursor = e.target.result;
        if (cursor){
            value += cursor.value.value;
            let promise = store.delete([cursor.value.timestamp, cursor.value.category]);
            promise.onsuccess = console.log(promise);
            promise.onerror = console.warn;
            cursor.continue();
        }
        else{
            let promise = store.delete(key);
            promise.onsuccess = console.log(promise);
            promise.onerror = console.warn;
        }
    } 
    
}

// Find entry in DB based on passed key. Allows setting index of the object store.
function findEntry(db,storename,iden,key){
    // let db = request.result;
    let transaction = makeTransac(db,storename,"readonly");
    transaction.oncomplete = (event) => {
        console.log("created transaction");
    }
    let objectStore = transaction.objectStore(storename);
    let index = objectStore.index(iden) ; 
    let request = key? index.getAll(key) : index.getAll();
    return request;
}

// Iterates DB entries in a specified key range.
function findRange(db,storename,iden,callback,start,end){
    let transaction = makeTransac(db,storename,"readonly");
    let objectStore = transaction.objectStore(storename);
    let index = objectStore.index(iden) ; 
    let dateRange = start && end ? IDBKeyRange.bound(start,end,false,false) : start && !end ? IDBKeyRange.bound(start,new Date().toAppFormatDate("yyyy","mm","dd","-"),false,false) : !start && end ? IDBKeyRange.only(end) : IDBKeyRange.only(new Date().toAppFormatDate("yyyy","mm","dd","-")) ;   
    
    index.openCursor(dateRange).onsuccess = event => { 
        let cursor = event.target.result ;
        if(cursor){
            callback(cursor.value) ; 
            cursor.continue() ;
        }
        else{
            console.log("Done!")
        }
    }
    return transaction;   
}

// Checks presence of entries in the DB before executing add command of IndexedDB. Calls grouping functions to club entries having common characteristics. 
function verifyAdd(dbEntries,entry,objectStore){
    dbEntries.onsuccess = (event) => {
        pastEntries = event.target.result ;
       if (!pastEntries.length){
            let details = entry.detail;
            details = details ? combineCommon(details) : [];
            entry.detail = details;
            let request = objectStore.add(entry);
            request.onsuccess = e => console.log("success");
            request.onerror = e => console.error;
        }
        else{
            let existingDetails = pastEntries[0].detail;
            let existingVal = pastEntries[0].value;
            let entryDetails = Array.isArray(entry.detail) ? entry.detail : [entry.detail];
            let newDetails = Array.isArray(existingDetails) ? [...entryDetails, ...existingDetails] : [...entryDetails, existingDetails];
            newDetails = combineCommon(newDetails);
            let newEntry = {category:entry.category,value: entry.value*1+existingVal*1,timestamp: entry.timestamp, detail: newDetails}
            let request = objectStore.put(newEntry);
            request.onsuccess = e => console.log("success");
            request.onerror = e => console.error;     
        } 
    }
    dbEntries.onerror = console.error;
}

// Combines entries with common characteristics - category, sub-category, and, name.
function combineCommon(details){
    let names = details.map(({name,...o})=>name).unique();
    let subCategories = details.map(({subCategory,...o})=>subCategory).unique();
    for (let item of names){
        let commonDetails = details.filter(({name,subCategory,...o},i) => name === item && subCategories.includes(subCategory));
        if( commonDetails.length > 1){
            details = details.filter(({name,subCategory,...o})=> name !== item || !subCategories.includes(subCategory));
            let q = commonDetails.map(({quantity:q,...o})=> q).reduce((a,b)=>a+b);
            let v = commonDetails.map(({value:v,...o})=> v).reduce((a,b)=>a+b);
            let s = commonDetails.map(({storeName:s,...o})=> s).reduce((a,b)=>a+", "+b);
            s = s.split(", ").unique().join(", ");
            let newEntry = {name: commonDetails[0].name, value: v, quantity: q, subCategory: commonDetails[0].subCategory, storeName: s};
            details.push(newEntry);
        }
    }
    return details;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.log('SW failed:', err));
}


// let promise = findEntry(db,dbname,"timestamp",timestamp)
//     promise.onsuccess = (request) => {
//         let expenseTodayEntry, incomeTodayEntry;
//         if (bool){
//             expenseTodayEntry = request.target.result;
//             expenseTodayDisplay.textContent = expenseTodayEntry.length ? expenseTodayEntry.map(({value:v, ...o}) => v).reduce((a,b)=>a*1+b*1) : 0;
//         }
//         else{
//             incomeTodayEntry = request.target.result;
//             let days = calendarElem.children[1].children[1].lastElementChild.textContent.slice(3,5)*1;
//             incomeTodayDisplay.textContent = incomeTodayEntry.length ? incomeTodayEntry.map(({value:v, ...o}) => v).reduce((a,b)=>a*1+b*1)/days : 0;
//         }
//         balanceTodayDisplay.textContent = incomeTodayDisplay.textContent - expenseTodayDisplay.textContent ;
//         if(balanceTodayDisplay.textContent > 0 ) {document.getElementById(timestamp).classList.add("bg-green-200"); document.getElementById(timestamp).classList.remove("bg-white") ; document.getElementById(timestamp).classList.remove("bg-red-200");}
//         if(balanceTodayDisplay.textContent < 0 ) {document.getElementById(timestamp).classList.remove("bg-green-200") ; document.getElementById(timestamp).classList.remove("bg-white") ; document.getElementById(timestamp).classList.add("bg-red-200");}
//         if(balanceTodayDisplay.textContent === 0 ) {document.getElementById(timestamp).classList.remove("bg-green-200") ; document.getElementById(timestamp).classList.remove("bg-red-200");document.getElementById(timestamp).classList.add("bg-white");}
//     }

// let plot1 = canvas.cloneNode(true);
            // let plot2 = canvas.cloneNode(true); 
            // let plot3 = canvas.cloneNode(true);
            // let plot4 = canvas.cloneNode(true);
            // let plot5 = canvas.cloneNode(true); 
            // let context1 = plot1.getContext("2d");
            // let context2 = plot2.getContext("2d");
            // let context3 = plot3.getContext("2d");
            // let context4 = plot4.getContext("2d");
            // let context5 = plot5.getContext("2d");


            // plotContainers[1].append(plot2,controlViewContainer.cloneNode("true"));
            // plotContainers[1].lastElementChild.addEventListener("touchend",(e)=>console.log(e.target.id));
            // plotContainers[2].append(plot3,controlViewContainer.cloneNode("true"))
            // plotContainers[2].lastElementChild.addEventListener("touchend",(e)=>console.log(e.target.id));
            // plotContainers[3].append(plot4,controlViewContainer.cloneNode("true"));
            // plotContainers[3].lastElementChild.addEventListener("touchend",(e)=>console.log(e.target.id));
            // plotContainers[4].append(plot5,controlViewContainer.cloneNode("true"));
            // plotContainers[4].lastElementChild.addEventListener("touchend",(e)=>console.log(e.target.id));
