// =========================
// HEXIMONS NAVIGATION
// =========================


// =========================
// PAGE SWITCHING
// =========================

window.showPage = function(pageId) {


    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });



    const page =
        document.getElementById(pageId);



    if (!page) {

        console.warn(
            "Page not found:",
            pageId
        );

        return;

    }



    page.classList.add("active");



    window.scrollTo({

        top: 0,

        behavior: "auto"

    });



    closeDropdowns();

};







// =========================
// DROPDOWN SETUP
// =========================

function setupDropdown(
    buttonId,
    dropdownId
) {


    const button =
        document.getElementById(
            buttonId
        );


    const dropdown =
        document.getElementById(
            dropdownId
        );



    if (
        !button ||
        !dropdown
    ) {

        return;

    }




    button.addEventListener(
        "click",
        function(event) {


            event.stopPropagation();



            const isOpen =
                dropdown.style.display ===
                "block";



            closeDropdowns();



            if (!isOpen) {

                dropdown.style.display =
                    "block";

            }


        }
    );





    dropdown.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

        }
    );


}







// =========================
// CLOSE DROPDOWNS
// =========================

window.closeDropdowns =
function() {


    document
        .querySelectorAll(".dropdown")
        .forEach(menu => {


            menu.style.display =
                "none";


        });


};







// =========================
// NAVIGATION STARTUP
// =========================

function setupNavigation() {


    setupDropdown(
        "tradingBtn",
        "tradingDropdown"
    );


    setupDropdown(
        "playersBtn",
        "playersDropdown"
    );


    document.addEventListener(
        "click",
        function(){

            closeDropdowns();

        }
    );


}







// =========================
// INITIALIZE
// =========================

if (
    document.readyState === "loading"
) {


    document.addEventListener(
        "DOMContentLoaded",
        setupNavigation
    );


}
else {


    setupNavigation();


}