function initPopup() {
    var emailData = window.selectedEmailData; // Get the passed email data

    // Update the HTML elements with the email data
    document.querySelector('.headings h5:nth-child(1)').textContent = 'From: ' + emailData.From.EmailAddress.Address;
    document.querySelector('.headings h5:nth-child(2)').textContent = 'Subject: ' + emailData.Subject;
    document.querySelector('#received').textContent = 'Received: ' + new Date(emailData.ReceivedDateTime).toLocaleString();

    
}
