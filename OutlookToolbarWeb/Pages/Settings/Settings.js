
$(document).ready(function () {
    GetTaskTypes(); GetPriorityType();
    function GetPriorityType() {
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
                        <getTaskPriority>
                        </getTaskPriority>
                      </soap:Body>
                    </soap:Envelope>`
        };

        $.ajax(settings)
            .done(function (response) {

                // Parse the outer SOAP response
                const parser = new DOMParser();

                // Extract the inner XML string
                let getMatchesReturn = response.getElementsByTagName("getTaskPriorityReturn");

                const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
                // Decode the inner XML string
                const decodedInnerXML = decodeHTMLEntities(decodedString);

                // Parse the decoded inner XML string
                const innerXmlDoc = parser.parseFromString(decodedInnerXML, "text/xml");
                const priority = innerXmlDoc.getElementsByTagName("priority");

                // Convert the extracted contact information into an array of objects
                const priorityList = [];

                for (let i = 0; i < priority.length; i++) {
                    const pr = priority[i];
                    const priObj = {
                        priID: pr.getElementsByTagName("priID")[0].textContent,
                        priname: pr.getElementsByTagName("priname")[0].textContent
                    };
                    priorityList.push(priObj);
                }
                const inboundPrt = document.getElementById('inbound-priority');
                const outboundPrt = document.getElementById('outbound-priority');

                // populate the dropdown
                priorityList.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.priID;
                    option.textContent = item.priname;
                    inboundPrt.appendChild(option);
                });
                priorityList.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.priID;
                    option.textContent = item.priname;
                    outboundPrt.appendChild(option);
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Error:', textStatus, errorThrown);
            });

    }
    function GetTaskTypes() {
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
                        <getTaskTypes>
                          <groupid>0</groupid>
                        </getTaskTypes>
                      </soap:Body>
                    </soap:Envelope>`
        };

        $.ajax(settings)
            .done(function (response) {

                // Parse the outer SOAP response
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(response, "application/xml");

                // Extract the inner XML string
                let getMatchesReturn = response.getElementsByTagName("getTaskTypesReturn");

                const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
                // Decode the inner XML string
                const decodedInnerXML = decodeHTMLEntities(decodedString);

                // Parse the decoded inner XML string
                const innerXmlDoc = parser.parseFromString(decodedInnerXML, "text/xml");
                const types = innerXmlDoc.getElementsByTagName("type");

                // Convert the extracted contact information into an array of objects
                const typeList = [];

                for (let i = 0; i < types.length; i++) {
                    const contact = types[i];
                    const typeObj = {
                        typeID: contact.getElementsByTagName("typeID")[0].textContent,
                        typename: contact.getElementsByTagName("typename")[0].textContent
                    };
                    typeList.push(typeObj);
                }
                console.log("Hello");
                console.log(typeList);
                const inboundDD = document.getElementById('inbound-trace-type');
                const outboundDD = document.getElementById('outbound-trace-type');

                // Populate the dropdown
                typeList.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.typeID;
                    option.textContent = item.typename;
                    inboundDD.appendChild(option);
                });
                typeList.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.typeID;
                    option.textContent = item.typename;
                    outboundDD.appendChild(option);
                });
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
    $("#applyButton").click(function () {
        // Capture form data
        const formData = {
            crmUrl: $("#crm-url").val(),
            crmLogin: $("#crm-login").val(),
            crmPassword: $("#crm-password").val(),
            sentFlagColor: $("#sent-flag-color").val(),
            skipFlagColor: $("#skip-flag-color").val(),
            daysToSynch: $("#days-to-synch").val(),
            inboundTraceType: $("#inbound-trace-type").val(),
            outboundTraceType: $("#outbound-trace-type").val(),
            inboundPriority: $("#inbound-priority").val(),
            outboundPriority: $("#outbound-priority").val()
        };

        // Convert the form data object to a string
        const formDataString = JSON.stringify(formData);

        // Encrypt the data
        //const encryptedData = CryptoJS.AES.encrypt(formDataString, "secret key 123").toString();

        // Store the encrypted data in local storage
        localStorage.setItem("formData", formDataString);
        window.opener.postMessage(formDataString, window.location.origin);
    });
});