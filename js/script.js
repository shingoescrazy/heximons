// =========================
// HEXIMONS GLOBAL SCRIPT
// TRADE CALCULATOR SYSTEM
// =========================


// =========================
// GLOBAL TRADE ARRAYS
// =========================

window.offerItems = window.offerItems || [];
window.requestItems = window.requestItems || [];




// =========================
// UPDATE TRADE CALCULATOR
// =========================

window.updateTradeCalculator = function(){


    const offerRobux =
        Number(
            document.getElementById("offerRobux")?.value || 0
        );


    const requestRobux =
        Number(
            document.getElementById("requestRobux")?.value || 0
        );



    const offerValue =
        window.offerItems.reduce(
            (total,item)=>{

                if(!item) return total;

                return total + Number(item.value || 0);

            },
            0
        )
        +
        offerRobux;



    const requestValue =
        window.requestItems.reduce(
            (total,item)=>{

                if(!item) return total;

                return total + Number(item.value || 0);

            },
            0
        )
        +
        requestRobux;




    const offerRap =
        window.offerItems.reduce(
            (total,item)=>{

                if(!item) return total;

                return total + Number(item.rap || 0);

            },
            0
        );



    const requestRap =
        window.requestItems.reduce(
            (total,item)=>{

                if(!item) return total;

                return total + Number(item.rap || 0);

            },
            0
        );





    // =========================
    // UPDATE MAIN VALUES
    // =========================


    updateText(
        "offerValue",
        offerValue
    );


    updateText(
        "requestValue",
        requestValue
    );


    updateText(
        "offerRap",
        offerRap
    );


    updateText(
        "requestRap",
        requestRap
    );






    // =========================
    // DIFFERENCE
    // =========================


    updateDifference(
        "valueDifference",
        requestValue - offerValue
    );


    updateDifference(
        "rapDifference",
        requestRap - offerRap
    );


};






// =========================
// TEXT UPDATER
// =========================

function updateText(
    id,
    value
){

    const element =
        document.getElementById(id);


    if(!element)
        return;


    element.textContent =
        Number(value)
        .toLocaleString();

}






// =========================
// DIFFERENCE COLOR
// =========================

function updateDifference(
    id,
    value
){

    const element =
        document.getElementById(id);


    if(!element)
        return;



    element.classList.remove(
        "trade-win",
        "trade-loss",
        "trade-even"
    );



    if(value > 0){

        element.classList.add(
            "trade-win"
        );

    }
    else if(value < 0){

        element.classList.add(
            "trade-loss"
        );

    }
    else{

        element.classList.add(
            "trade-even"
        );

    }



    element.textContent =
        Math.round(value)
        .toLocaleString();

}






// =========================
// ROBUX LIVE LISTENER
// =========================


document.addEventListener(
"input",
function(event){


    if(
        event.target.id === "offerRobux" ||
        event.target.id === "requestRobux"
    ){

        updateTradeCalculator();

    }


});







// =========================
// RESET CALCULATOR
// =========================

window.clearTradeCalculator = function(){


    window.offerItems = [null, null, null, null];

    window.requestItems = [null, null, null, null];



    document.querySelectorAll(
        ".trade-slot"
    )
    .forEach(slot=>{

        slot.classList.remove("filled");

        slot.textContent = "+";

    });



    updateTradeCalculator();

};






// =========================
// INITIAL LOAD
// =========================

document.addEventListener(
"DOMContentLoaded",
()=>{


    updateTradeCalculator();


});