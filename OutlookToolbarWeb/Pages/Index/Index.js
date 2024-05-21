'use strict';
window.selectedEmailData = {}; // Global Variable to store the selected emails data

(function () {
    let popupQueue = []; // Queue to manage popups
    let isPopupOpen = false;

    Office.onReady((info) => {
        if (info.host === Office.HostType.Outlook) {
            $(document).ready(() => {
                console.log("Document is Ready");
                loadItemProps(Office.context.mailbox.item);
                attachClickEventHandlers();
                fetchSelectedEmails();
                Office.context.mailbox.addHandlerAsync(Office.EventType.SelectedItemsChanged, fetchSelectedEmails);
            });
        }
    });

    // Attach click event handlers for buttons
    function attachClickEventHandlers() {
        $('#send-email-btn').on('click', () => {
            Object.keys(window.selectedEmailData).forEach((emailId, index) => {
                popupQueue.push({
                    url: '../SendEmail/SendEmail.html',
                    title: `Send Email(s) to CRM ${index + 1}`,
                    emailId: emailId
                });
            });
            openNextPopup(); // Start opening popups
        });

        $('#sync-email-btn').on('click', () => {
            openPopup('../SyncEmail/SyncEmail.html', 'Synchronize Email with CRM');
        });

        $('#settings-btn').on('click', () => {
            openPopup('../Settings/Settings.html', 'Settings', 500, 600);
        });
    }

    // Fetch selected emails
    function fetchSelectedEmails() {
        Office.context.mailbox.getSelectedItemsAsync((asyncResult) => {
            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                console.error(`Error getting selected items: ${asyncResult.error.message}`);
                return;
            }

            asyncResult.value.forEach((item, index) => {
                getSpecificEmailDetails(item.itemId, index);
            });
        });
    }

    // Get email details of selected emails
    function getSpecificEmailDetails(id, index) {
        Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
            if (result.status === "succeeded") {
                const accessToken = result.value;
                const requestUrl = `${Office.context.mailbox.restUrl}/v2.0/me/messages/${id}`;
                $.ajax({
                    url: requestUrl,
                    dataType: 'json',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }).done((emailData) => {
                    window.selectedEmailData[id] = emailData;
                    console.log("Email Data:", emailData);
                }).fail((error) => {
                    console.error("Error fetching email data:", error);
                });
            } else {
                console.error(`Error getting callback token: ${result.error.message}`);
            }
        });
    }

    // Open the next popup in the queue
    function openNextPopup() {
        if (popupQueue.length === 0 || isPopupOpen) {
            return;
        }
        const popupInfo = popupQueue.shift(); // Get the next popup info from the queue
        openPopupForSendEmail(popupInfo.url, popupInfo.title, popupInfo.emailId);
    }

    // Open popup for sending email
    function openPopupForSendEmail(url, title, emailId) {
        openPopup(url, title, 800, 500, (popup) => {
            popup.window.selectedEmailData = window.selectedEmailData[emailId];
            if (typeof popup.window.initPopup === 'function') {
                popup.window.initPopup(); // Initialize the popup with data
            }
            popup.onunload = () => {
                isPopupOpen = false;
                openNextPopup();
            };
        });
        isPopupOpen = true;
    }

    // Open a generic popup
    function openPopup(url, title, width = 800, height = 500, onloadCallback) {
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        const popup = window.open(url, title, `width=${width}, height=${height}, top=${top}, left=${left}`);
        popup.onload = () => {
            popup.window.selectedEmailData = popup.opener.selectedEmailData;
            if (onloadCallback) {
                onloadCallback(popup);
            }
        };
    }

    function loadItemProps(item) {
        // Load item properties if needed
    }
})();
