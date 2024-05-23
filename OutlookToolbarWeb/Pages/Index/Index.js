'use strict';
window.MatchedData = {};
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
        email = "awilkins@americanhomeshield.com";
        const settings = {
            url: "http://localhost:4000/api/cftags/outlook.cfc",
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
            popup.window.MatchedData = window.MatchedData[emailId];
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
            popup.window.MatchedData = popup.opener.MatchedData;
            if (onloadCallback) {
                onloadCallback(popup);
            }
        };
    }

    function loadItemProps(item) {
        // Load item properties if needed
    }
})();
