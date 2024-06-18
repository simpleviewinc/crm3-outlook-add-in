let ApiUrl = '', UserId = '';

$(document).ready(function () {
    function handleDataFromIndexPage(event) {
        const receivedData = event.data;
        console.log('Data received in popup:', receivedData);
        ApiUrl = receivedData;
        if (typeof ApiUrl === 'string' && ApiUrl.startsWith('http')) {
            GetTaskTypes(); GetPriorityType();
        }
    }
    window.addEventListener('message', handleDataFromIndexPage, false);

    var resval = localStorage.getItem("crm");
    var data = {};
    if (resval != null) {
         data = decodeFromBase64(resval);
        console.log(data);
        if (data != null) {
            if (data.userId != null && data.userId != undefined && data.userId != '') {
                $('#emailSettings').show();
                $('#Save').hide();
            }
            else {
                $('#emailSettings').hide();
            }
            $('#crm-login').val(data.crmLogin);
            $('#crm-url').val(data.crmUrl);
            $('#sent-flag-color').val(data.sentFlagColor);
            $('#skip-flag-color').val(data.skipFlagColor);
            $('#days-to-sync').val(data.daysToSync);
        }
    }


    function GetUserIdByLogin(url, email, password) {
        if (url == "https://demo.simpleviewcrm.com")
            url = "http://localhost:4000";
        const settings = {
            url: url + "/api/cftags/outlook.cfc",
            method: "POST",
            timeout: 0,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": ""
            },
            data: `<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                      <soap:Body>
                        <checkLogin>
                          <email>`+ email +`</email>
                          <password>`+ password +`</password>
                          <version></version>
                        </checkLogin>
                      </soap:Body>
                    </soap:Envelope>`
        };

        $.ajax(settings)
            .done(function (response) {
                const parser = new DOMParser();
                let getMatchesReturn = response.getElementsByTagName("checkLoginReturn");
                const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
                console.log(decodedString);
                if (decodedString == '-1.0') {
                    alert("Credentials not valid !");
                }
                else {
                    alert("Login Successful !");
                    UserId = parseInt(decodedString);
                    $('#emailSettings').show();
                    $('#Save').hide();
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Url or credentials not valid !");
                console.error('Error:', textStatus, errorThrown);
            });
    }

    function GetPriorityType() {
        const settings = {
            url: ApiUrl+"/api/cftags/outlook.cfc",
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
                console.log("kevin");
                console.log(priorityList);
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

                $('#inbound-priority').val(data.inboundPriority);
                $('#outbound-priority').val(data.outboundPriority);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Error:', textStatus, errorThrown);
            });

    }

    function GetTaskTypes() {
        const settings = {
            url: ApiUrl+"/api/cftags/outlook.cfc",
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

                $('#inbound-trace-type').val(data.inboundTraceType);
                $('#outbound-trace-type').val(data.outboundTraceType);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.error('Error:', textStatus, errorThrown);
            });

    }

    function decodeFromBase64(base64Str) {
        const jsonString = atob(base64Str);

        // Parse the JSON string into an object
        return JSON.parse(jsonString);
    }

    function encodeToBase64(str) {
        return btoa(str);
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

    $("#Save").click(function () {
        GetUserIdByLogin($("#crm-url").val(), $("#crm-login").val(), $("#crm-password").val());
    });

    $("#okSettings").click(function () {
        // Capture form data
        const formData = {
            crmUrl: $("#crm-url").val(),
            crmLogin: $("#crm-login").val(),
            userId: UserId,
            sentFlagColor: $("#sent-flag-color").val(),
            skipFlagColor: $("#skip-flag-color").val(),
            daysToSync: $("#days-to-sync").val(),
            inboundTraceType: $("#inbound-trace-type").val(),
            outboundTraceType: $("#outbound-trace-type").val(),
            inboundPriority: $("#inbound-priority").val(),
            outboundPriority: $("#outbound-priority").val()
        };

        const formDataString = JSON.stringify(formData);
        localStorage.setItem("crm", encodeToBase64(formDataString));
        window.opener.postMessage(formDataString, window.location.origin);
        alert("Settings Updated !");
    });
});