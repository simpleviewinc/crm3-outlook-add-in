function initPopup() {
    var emailData = window.selectedEmailData; // Get the passed email data
    var matchData = window.MatchedData;
    console.log("From Send Email");
    console.log(matchData);
    // Update the HTML elements with the email data
    document.querySelector('.headings h5:nth-child(1)').textContent = 'From: ' + emailData.From.EmailAddress.Address;
    document.querySelector('.headings h5:nth-child(2)').textContent = 'Subject: ' + emailData.Subject;
    document.querySelector('#received').textContent = 'Received: ' + new Date(emailData.ReceivedDateTime).toLocaleString() + matchData[0].acctID;

    let contactList = [];
    // Function to append rows to the table
    function populateTable(contactList) {
        console.log("executing");
        const $tableBody = $("#contactTable tbody");
        $tableBody.empty(); // Clear any existing rows

        contactList.forEach(contact => {
            const row = `
                <tr>
                    <td>${contact.groupname}</td>
                    <td>${contact.fullname}</td>
                    <td>${contact.company}</td>
                    <td>${contact.contacttype}</td>
                    <td>${contact.address}</td>
                    <td>${contact.email}</td>
                </tr>
            `;
            $tableBody.append(row);
        });
    }
    contactList = window.MatchedData;
    // Populate the table with data
    populateTable(contactList);
}

