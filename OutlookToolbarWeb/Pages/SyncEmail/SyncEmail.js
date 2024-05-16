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