'use strict';
window.MatchedData = {};
window.selectedEmailData = {}; // Global Variable to store the selected emails data
window.inboxEmails = {};
window.sentEmails = {};
window.ApiUrlVal = '';

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
                console.log("office is ready1");
                
                
                $('#send-email-btn').prop('disabled', true);
                attachClickEventHandlers();
                fetchSelectedEmails();
                Office.context.mailbox.addHandlerAsync(Office.EventType.SelectedItemsChanged, fetchSelectedEmails);
                
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
                    fetchEmailsWithCategoryAndTimeFilter(true, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
                    fetchEmailsWithCategoryAndTimeFilter(false, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
                }
               
            });
        }
    });

    function decodeFromBase64(base64Str) {
        const jsonString = atob(base64Str);

        // Parse the JSON string into an object
        return JSON.parse(jsonString);
    }
    // Attach click event handlers for buttons
    function attachClickEventHandlers() {
        $('#send-email-btn').on('click', () => {
            console.log("send button cliked: ");
            console.log(window.selectedEmailData);
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
            openPopup('../SendEmail/SendEmail.html', 'Synchronize Email with CRM');
        });

        $('#settings-btn').on('click', () => {
            openPopup('../Settings/Settings.html', 'Settings', 1000, 800);
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
                console.log("item---------");
                console.log(item);
                getSpecificEmailDetails(item.itemId, index);
            });
        });
    }

function getSpecificEmailDetails(id, index) {
    Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
        if (result.status === "succeeded") {
            const accessToken = result.value;
            var newId = id.replace(/\//g, '+');
            const encodedId = encodeURIComponent(newId);
            const requestUrl = `${Office.context.mailbox.restUrl}/v2.0/me/messages/${encodedId}`;
            
            $.ajax({
                url: requestUrl,
                dataType: 'json',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }).done((emailData) => {
                window.selectedEmailData[id] = emailData;
                GetMatchingContactsData(emailData.From.EmailAddress.Address, 1124, id);
                console.log("Email Data:", emailData);
            }).fail((error) => {
                console.error("Error fetching email data:", error);
            });
        } else {
            console.error(`Error getting callback token: ${result.error.message}`);
        }
    });
}


function GetMatchingContactsData(email, userId, msgId) {
    console.log("Api Url");
    console.log(ApiUrl);
        email = "awilkins@americanhomeshield.com";
        const settings = {
            url: ApiUrl +"/api/cftags/outlook.cfc",
            method: "POST",
            timeout: 0,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": ""
            },
            data: `<?xml version="1.0" encoding="utf-8"?>
              <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                  <getMatches>
                    <userid>`+ userId +`</userid>
                    <email>`+ email +`</email>
                  </getMatches>
                </soap:Body>
              </soap:Envelope>`
        };

        $.ajax(settings)
            .done(function (response) {
                
                // Parse the outer SOAP response
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(response, "application/xml");
              
                // Extract the inner XML string
                let getMatchesReturn = response.getElementsByTagName("getMatchesReturn");
               
                const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
                // Decode the inner XML string
                const decodedInnerXML = decodeHTMLEntities(decodedString);
                
                // Parse the decoded inner XML string
                const innerXmlDoc = parser.parseFromString(decodedInnerXML, "text/xml");
                const contacts = innerXmlDoc.getElementsByTagName("contact");
                
                // Convert the extracted contact information into an array of objects
                const contactList = [];

                for (let i = 0; i < contacts.length; i++) {
                    const contact = contacts[i];
                    const contactObj = {
                        groupID: contact.getElementsByTagName("groupID")[0].textContent,
                        acctID: contact.getElementsByTagName("acctID")[0].textContent,
                        contactID: contact.getElementsByTagName("contactID")[0].textContent,
                        groupname: contact.getElementsByTagName("groupname")[0].textContent,
                        fullname: contact.getElementsByTagName("fullname")[0].textContent,
                        company: contact.getElementsByTagName("company")[0].textContent,
                        contacttype: contact.getElementsByTagName("contacttype")[0].textContent,
                        address: contact.getElementsByTagName("address")[0].textContent,
                        email: contact.getElementsByTagName("email")[0].textContent
                    };
                    contactList.push(contactObj);
                }

                window.MatchedData[msgId] = contactList;
                $('#send-email-btn').prop('disabled', false);
                console.log(window.MatchedData);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Error:', textStatus, errorThrown);
            });

}

    function htmlToString(html) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    }
    function decodeHTMLEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#x27;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '=',
            '&#xE9;': 'é'
        };
        return text.replace(/&[a-zA-Z0-9#x]+;/g, function (match) {
            return entities[match] || match;
        });
    }

    // Open the next popup in the queue
function openNextPopup() {

    console.log("popupQueue.length" + popupQueue.length);
    console.log("isPopupOpen" + isPopupOpen);
        if (popupQueue.length === 0 ) {
            return;
        }
        const popupInfo = popupQueue.shift(); // Get the next popup info from the queue
        openPopupForSendEmail(popupInfo.url, popupInfo.title, popupInfo.emailId);
    }

    // Open popup for sending email
    function openPopupForSendEmail(url, title, emailId) {
        openPopup(url, title, 1000, 800, (popup) => {
            popup.window.selectedEmailData = window.selectedEmailData[emailId];
            popup.window.MatchedData = window.MatchedData[emailId];
            popup.window.inboxEmails = window.inboxEmails;
            popup.window.sentEmails = window.sentEmails;
            popup.window.ApiUrl = window.ApiUrlVal;
            if (typeof popup.window.initPopup === 'function') {
                popup.window.initPopup(false); // Initialize the popup with data
            }
            popup.onunload = () => {
                isPopupOpen = false;
                openNextPopup();
            };
        });
        isPopupOpen = true;
    }

   

    // Open a generic popup
    function openPopup(url, title, width = 1000, height = 800, onloadCallback) {
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        const popup = window.open(url, title, `width=${width}, height=${height}, top=${top}, left=${left}`);
        popup.onload = () => {
            popup.postMessage(ApiUrl, '*');
            popup.window.selectedEmailData = popup.opener.selectedEmailData;
            popup.window.MatchedData = popup.opener.MatchedData;
            popup.window.inboxEmails = popup.opener.inboxEmails
            popup.window.sentEmails = popup.opener.sentEmails;
            popup.window.ApiUrl = popup.opener.ApiUrlVal;
            console.log("Openning " + title);
            if (typeof popup.window.initPopup === 'function' && title == 'Synchronize Email with CRM') {
                popup.window.initPopup(true); // Initialize the popup with data
            }
            //else if (typeof popup.window.initPopup === 'function') {
            //    console.log(popup.window.selectedEmailData+ "data check");
            //    popup.window.initPopup(false); 
            //}
           
            console.log(popup.window.ApiUrl);
            if (onloadCallback) {
                onloadCallback(popup);
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
                        }
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        console.error("Error fetching emails:", textStatus, errorThrown);
                        console.error("Response text:", jqXHR.responseText);
                    });
                }

                fetchEmails(requestUrl + filterQuery);
            } else {
                console.error("Error getting callback token:", result.error.message);
            }
        });
    }
   

