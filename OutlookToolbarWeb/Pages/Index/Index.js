'use strict';
window.MatchedData = {};
window.selectedEmailData = {}; // Global Variable to store the selected emails data
window.inboxEmails = {};
window.sentEmails = {};
window.ApiUrlVal = '';
window.ApiUrl = '';
window.userId = '';


function setCategoryToEmail(emailId, isSentFlag) {
    var resval = localStorage.getItem("CRM");
    var data = {};
    var categoryColor = 'Yellow category'; // initialized with some valid value 
    if (resval != null) {
        data = decodeFromBase64(resval);
        if (data != null) {
            if (isSentFlag) {
                categoryColor = data.sentFlagColor;
            }
            else {
                categoryColor = data.skipFlagColor;
            }
        }
    }
    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        if (result.status === "succeeded") {
            var accessToken = result.value;
            var requestUrl = Office.context.mailbox.restUrl + '/v2.0/me/messages/' + emailId;

            // Construct the payload to set the category
            var categoryData = {
                "Categories": [categoryColor]
            };

            // Make the PATCH request to update the email with the category
            $.ajax({
                url: requestUrl,
                type: 'PATCH',
                contentType: 'application/json',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                },
                data: JSON.stringify(categoryData)
            }).done(function (response) {
                console.log("Email category set successfully:", response);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.error("Error setting category:", textStatus, errorThrown);
                console.error("Response text:", jqXHR.responseText);
            });
        } else {
            console.error("Error getting callback token:", result.error.message);
        }
    });
}


let popupQueue = []; // Queue to manage popups
let isPopupOpen = false;

Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        $(document).ready(() => {
            console.log("office is ready");
            console.log('loaded index.js version DEV 1.5');
            $('#send-email-btn').addClass('disabled');
            $('#send-email-btn').prop('disabled', true);
            $('#sync-email-btn').addClass('disabled');
            $('#sync-email-btn').prop('disabled', true);
            var resval = localStorage.getItem("crm");
            var data = {};
            if (resval != null) {
                data = decodeFromBase64(resval);
                console.log(data);
                if (data != null) {
                    if (data.userId != null && data.userId != undefined && data.userId != '') {
                        userId = data.userId;
                    }
                }
            }
            attachClickEventHandlers();
            fetchSelectedEmails(false);
            Office.context.mailbox.addHandlerAsync(Office.EventType.SelectedItemsChanged, () => fetchSelectedEmails(true));

            var data = GetDataFromLocalStorage();
            ApiUrlVal = ApiUrl;
            console.log("Value" + ApiUrlVal);
            if (data != null) {
                // data = decodeFromBase64(resval);
                console.log(data);
                if (data != null) {
                    $('#sent-flag-color').val(data.sentFlagColor);
                    $('#skip-flag-color').val(data.skipFlagColor);
                    $('#days-to-sync').val(data.daysToSync);
                }
                console.log("going to be called....");
                fetchEmailsWithCategoryAndTimeFilter(true, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
                fetchEmailsWithCategoryAndTimeFilter(false, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
            }

        });
    }
});

function CloseTheTaskPane() {
    Office.context.ui.closeContainer();
}

function decodeFromBase64(base64Str) {
    const jsonString = atob(base64Str);

    // Parse the JSON string into an object
    return JSON.parse(jsonString);
}
// Attach click event handlers for buttons
function attachClickEventHandlers() {
    //$('#send-email-btn').on('click', () => {
    //    console.log("send button cliked: ");
    //    console.log(window.selectedemaildata);
    //    object.keys(window.selectedemaildata).foreach((emailid, index) => {
    //        popupqueue.push({
    //            url: '../sendemail/sendemail.html',
    //            title: `send email(s) to crm ${index + 1}`,
    //            emailid: emailid
    //        });
    //    });
    //    openNextPopup(); // Start opening popups
    //});

    $('#send-email-btn').on('click', () => {
        openPopup('../SendEmail/SendEmail.html', 'Send Email');
    });

    $('#sync-email-btn').on('click', () => {
        openPopup('../SendEmail/SendEmail.html', 'Synchronize Email with CRM');
    });

    $('#settings-btn').on('click', () => {
        openPopup('../Settings/Settings.html', 'Settings', 1000, 800);
    });
}

let selectedEmails = [];
// Fetch selected emails
function fetchSelectedEmails(refresh) {
    if (refresh)
        selectedEmails = [];
    Office.context.mailbox.getSelectedItemsAsync((asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
            console.error(`Error getting selected items: ${asyncResult.error.message}`);
            return;
        }

        asyncResult.value.forEach((item) => {
            getSpecificEmailDetails(item.itemId);
        });
        console.log("new emails");
        console.log(selectedEmails);
        $('#send-email-btn').prop('disabled', false);
        $('#send-email-btn').removeClass('disabled');
    });
}

function getSpecificEmailDetails(id) {
    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
        if (result.status === "succeeded") {
            console.log("Actual Id:", id);

            const accessToken = result.value;
            let correctedId = id.replace(/\//g, '-').replace(/\+/g, '_'); // This might not be needed
            const encodedId = encodeURIComponent(correctedId); // URL encode the corrected ID
            const requestUrl = `${Office.context.mailbox.restUrl}/v2.0/me/messages/${encodedId}`;

            $.ajax({
                url: requestUrl,
                dataType: 'json',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }).done((emailData) => {
                window.selectedEmailData[id] = emailData;
                console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

                const rowData = {
                    id: emailData.Id,
                    fromEmail: emailData.From.EmailAddress.Address,
                    subject: emailData.Subject,
                    receivedDate: new Date(emailData.ReceivedDateTime).toLocaleString()
                };
                console.log(rowData);
                const exists = selectedEmails.some(email => email.id === rowData.id);
                if (!exists) {
                    selectedEmails.push(rowData);
                }
            }).fail((error) => {
                console.error("Error fetching email data:", error);
                if (error.responseJSON) {
                    console.error("Error details:", error.responseJSON);
                }
            });
        } else {
            console.error(`Error getting callback token: ${result.error.message}`);
        }
    });
}


let popupWindow = null;
// Open a generic popup
function openPopup(url, title, width = 1000, height = 800, onloadCallback) {
    // Close the existing popup if it's open
    if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
    }

    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    popupWindow = window.open(url, title, `width=${width}, height=${height}, top=${top}, left=${left}`);

    popupWindow.onload = () => {
        popupWindow.postMessage(ApiUrl, '*');
        popupWindow.window.inboxEmails = popupWindow.opener.inboxEmails;
        popupWindow.window.sentEmails = popupWindow.opener.sentEmails;
        popupWindow.window.ApiUrl = popupWindow.opener.ApiUrlVal;
        console.log("Opening " + title);
        if (typeof popupWindow.window.initPopup === 'function' && title === 'Synchronize Email with CRM') {
            popupWindow.window.initPopup(true, selectedEmails); // Initialize the popup with data
        }
        else if (typeof popupWindow.window.initPopup === 'function') {
            popupWindow.window.initPopup(false, selectedEmails);
        }
        else if (typeof popupWindow.window.initSettings === 'function') {
            popupWindow.window.initSettings(popupWindow.opener.ApiUrlVal);
        }
        console.log(popupWindow.window.ApiUrl);
        if (onloadCallback) {
            onloadCallback(popupWindow);
        }
    };

    window.addEventListener('message', function (event) {
        if (event.origin !== window.location.origin) {
            // Ignore messages from different origins
            return;
        }
        localStorage.setItem("CRM", btoa(event.data));
    });
}

function fetchEmailsWithCategoryAndTimeFilter(isInbox, daysToSync, sentCategoryColor, skipCategoryColor) {
    console.log("fetchEmailsWithCategoryAndTimeFilter called....");
    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
        if (result.status === "succeeded") {
            var accessToken = result.value;
            var mailFolder = isInbox ? 'inbox' : 'sentitems';
            var requestUrl = Office.context.mailbox.restUrl + `/v2.0/me/mailfolders/${mailFolder}/messages`;

            // Get selected days to sync
            var now = new Date();
            var startDate = new Date(now.getTime() - (daysToSync + 1) * 24 * 60 * 60 * 1000);
            var startDateISOString = startDate.toISOString();

            // Construct the query to filter emails within the selected timeframe,
            // excluding those with the skip or sent categories
            var filterQuery = `?$filter=receivedDateTime ge ${startDateISOString}` +
                ` and not(categories/any(c:c eq '${sentCategoryColor}'))` +
                ` and not(categories/any(c:c eq '${skipCategoryColor}'))`;

            // Function to fetch emails with pagination
            function fetchEmails(url, allEmails = []) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    contentType: 'application/json',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                }).done(function (response) {
                    allEmails = allEmails.concat(response.value);

                    if (response['@odata.nextLink']) {
                        fetchEmails(response['@odata.nextLink'], allEmails);
                    } else {
                        if (isInbox) {
                            window.inboxEmails = allEmails;
                            console.log("Inbox emails from the selected timeframe:");
                            console.log(window.inboxEmails);

                        } else {
                            window.sentEmails = allEmails;
                            console.log("Sent emails from the selected timeframe:");
                            console.log(window.sentEmails);
                        }
                        $('#sync-email-btn').removeClass('disabled');
                        $('#sync-email-btn').prop('disabled', false);
                    }
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    console.error("Error fetching emails:", textStatus, errorThrown);
                    console.error("Response text:", jqXHR.responseText);
                    $('#sync-email-btn').removeClass('disabled');
                    $('#sync-email-btn').prop('disabled', false);
                });
            }

            fetchEmails(requestUrl + filterQuery);
        } else {
            console.error("Error getting callback token:", result.error.message);
        }
    });
}


