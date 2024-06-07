document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        if (typeof window.inboxEmails !== 'undefined' && Object.keys(window.inboxEmails).length > 0) {
            const tableBody = document.querySelector("#inboxTable tbody");
            console.log(window.inboxEmails);
            Object.values(window.inboxEmails).forEach((email, index) => {
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
            console.log("No data found in inbox.");
        }
    }, 100); // Delay of 1 second to ensure data is available

    setTimeout(() => {
        if (typeof window.sentEmails !== 'undefined' && Object.keys(window.sentEmails).length > 0) {
            const tableBody = document.querySelector("#sentBoxTable tbody");
            console.log(window.sentEmails);

            Object.values(window.sentEmails).forEach((email, index) => {
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
            console.log("No data found in sent box.");
        }
    }, 100); // Delay of 1 second to ensure data is available

 
});


// Function to toggle the state of all checkboxes in a box
function toggleCheckboxes(boxId, isChecked) {
    var checkboxes = document.querySelectorAll('#' + boxId + ' .row-checkbox');
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = isChecked;
    });
}

// Function to handle the "Select All" or "Clear All" button click
function handleSelectAllCheckbox(boxId, selectAll) {
    toggleCheckboxes(boxId, selectAll);
}



// Example usage: Add event listener to "Select All" and "Clear All" buttons
document.addEventListener('DOMContentLoaded', function () {
    var selectAllButtons = document.querySelectorAll('.select-all-button');
    selectAllButtons.forEach(function (selectAllButton) {
        selectAllButton.addEventListener('click', function () {
            var boxId = selectAllButton.closest('fieldset').querySelector('.box').id;
            handleSelectAllCheckbox(boxId, true);
        });
    });

    var clearAllButtons = document.querySelectorAll('.clear-all-button');
    clearAllButtons.forEach(function (clearAllButton) {
        clearAllButton.addEventListener('click', function () {
            var boxId = clearAllButton.closest('fieldset').querySelector('.box').id;
            handleSelectAllCheckbox(boxId, false);
        });
    });
});

