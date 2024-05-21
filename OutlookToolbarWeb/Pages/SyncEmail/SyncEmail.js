document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        if (typeof window.selectedEmailData !== 'undefined' && Object.keys(window.selectedEmailData).length > 0) {
            const tableBody = document.querySelector("#subjectLinesTable tbody");
            Object.values(window.selectedEmailData).forEach((email, index) => {
                const row = tableBody.insertRow();
                const indexCell = row.insertCell(0);
                const fromCell = row.insertCell(1);
                const subjectCell = row.insertCell(2);
                const receivedCell = row.insertCell(3);

                indexCell.innerHTML = '<input type="checkbox" class="row-checkbox">';
                fromCell.textContent = email.From.EmailAddress.Address; 
                subjectCell.textContent = email.Subject;
                receivedCell.textContent = new Date(email.ReceivedDateTime).toLocaleString(); // Convert the received date to a readable format
            });
        } else {
            console.log("No data found in selectedEmailData.");
        }
    }, 1000); // Delay of 1 second to ensure data is available
});


// Function to toggle the state of all checkboxes in a box
function toggleCheckboxes(boxId, isChecked) {
    var checkboxes = document.querySelectorAll('#' + boxId + ' .row-checkbox');
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = isChecked;
    });
}

// Function to handle the "Select All" checkbox change
function handleSelectAllCheckbox(boxId) {
    var selectAllCheckbox = document.querySelector('#' + boxId + ' .select-all-checkbox');
    toggleCheckboxes(boxId, selectAllCheckbox.checked);
}

// Function to handle the "Select All" button click
function handleSelectAllButton(boxId) {
    toggleCheckboxes(boxId, true);
    var selectAllCheckbox = document.querySelector('#' + boxId + ' .select-all-checkbox');
    selectAllCheckbox.checked = true;
}
