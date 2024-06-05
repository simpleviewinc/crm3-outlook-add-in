function initPopup() {
    var emailData = window.selectedEmailData; // Get the passed email data
    var matchData = window.MatchedData;
    console.log("From Send Email");
    console.log(matchData);
    // Update the HTML elements with the email data
    document.querySelector('.headings h5:nth-child(1)').textContent = 'From: ' + emailData.From.EmailAddress.Address;
    document.querySelector('.headings h5:nth-child(2)').textContent = 'Subject: ' + emailData.Subject;
    document.querySelector('#received').textContent = 'Received: ' + new Date(emailData.ReceivedDateTime).toLocaleString()
    GetGroupsByUserId(1);
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
        if (contactList.length === 0) {
            $('body').append('<p>No data found</p>');
        }
    }
    contactList = window.MatchedData;
    // Populate the table with data
    populateTable(contactList);
}


function GetAttachedToDDInfo() {
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
                    <getRelOpts>
                      <userid>1124</userid>
                      <groupid>3</groupid>
                      <acctid>35746</acctid>
                      <contactid>81103</contactid>
                    </getRelOpts>
                  </soap:Body>
                </soap:Envelope>`
    };

    $.ajax(settings)
        .done(function (response) {

            // Parse the outer SOAP response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response, "application/xml");

            // Extract the inner XML string
            let getMatchesReturn = response.getElementsByTagName("getRelOptsReturn");

            const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
            // Decode the inner XML string
            const decodedInnerXML = decodeHTMLEntities(decodedString);

            // Parse the decoded inner XML string
            const innerXmlDoc = parser.parseFromString(decodedInnerXML, "text/xml");
            const opts = innerXmlDoc.getElementsByTagName("opts");
            console.log("Check...........");
            //console.log(decodedInnerXML);
            parseXmlToJson(decodedInnerXML);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error:', textStatus, errorThrown);
        });

}

function xmlToJson(xml) {
    let obj = {};
    if (xml.nodeType === 1) { // element
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (let j = 0; j < xml.attributes.length; j++) {
                const attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // text
        obj = xml.nodeValue;
    }

    if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
            const item = xml.childNodes.item(i);
            const nodeName = item.nodeName;
            if (typeof obj[nodeName] === "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof obj[nodeName].push === "undefined") {
                    const old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

function parseXmlToJson(xmlStr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
    const json = xmlToJson(xmlDoc);
    //console.log(json);
    //console.log(JSON.stringify(json, null, 2));
    bindLeadDataToSelect(JSON.stringify(json, null, 2));
    return json;
}

function bindLeadDataToSelect(jsonData) {
    jsonData = JSON.parse(jsonData);
    console.log(jsonData);
    const leadData = jsonData.opts.rels.rel.find(rel => rel.title["#text"] === "Lead");
    if (leadData) {
        const select = document.getElementById("lead");

        leadData.data.row.forEach(row => {
            const option = document.createElement("option");
            option.value = row.ID["#text"];
            option.text = row.DISPLAY["#text"];
            select.appendChild(option);
        });
    }

    const profileData = jsonData.opts.rels.rel.find(rel => rel.title["#text"] === "Profile");
    if (profileData) {
        const profileSelect = document.getElementById("profile");

        profileData.data.row.forEach(row => {
            const option = document.createElement("option");
            option.value = row.ID["#text"];
            option.text = row.DISPLAY["#text"];
            profileSelect.appendChild(option);
        });
    }

    const requestData = jsonData.opts.rels.rel.find(rel => rel.title["#text"] === "Service Request");
    if (requestData) {
        const requestSelect = document.getElementById("request");
        console.log(requestData);
        console.log(requestData.data.row);
        if (Array.isArray(requestData.data.row)) {
            requestData.data.row.forEach(row => {
                const option = document.createElement("option");
                option.value = row.ID["#text"];
                option.text = row.DISPLAY["#text"];
                requestSelect.appendChild(option);
            });
        }
        else {
            const row = requestData.data.row;
            const option = document.createElement("option");
            option.value = row.ID["#text"];
            option.text = row.DISPLAY["#text"];
            requestSelect.appendChild(option);
        }
    }

    const plannerActData = jsonData.opts.rels.rel.find(rel => rel.title["#text"] === "Planner Account");
    if (plannerActData) {
        const plannerSelect = document.getElementById("plannerAct");

        plannerActData.data.row.forEach(row => {
            const option = document.createElement("option");
            option.value = row.ID["#text"];
            option.text = row.DISPLAY["#text"];
            plannerSelect.appendChild(option);
        });
    }

    const plannerContact = jsonData.opts.rels.rel.find(rel => rel.title["#text"] === "Planner Contact");
    if (plannerContact) {
        const plannerContactSelect = document.getElementById("plannerContact");

        plannerContact.data.row.forEach(row => {
            const option = document.createElement("option");
            option.value = row.ID["#text"];
            option.text = row.DISPLAY["#text"];
            plannerContactSelect.appendChild(option);
        });
    }
}

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
            console.log("kevin");
            console.log(priorityList);
            const inboundPrt = document.getElementById('priority');

            // populate the dropdown
            priorityList.forEach(item => {
                const option = document.createElement('option');
                option.value = item.priID;
                option.textContent = item.priname;
                inboundPrt.appendChild(option);
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
            const inboundDD = document.getElementById('trace-type');
            // Populate the dropdown
            typeList.forEach(item => {
                const option = document.createElement('option');
                option.value = item.typeID;
                option.textContent = item.typename;
                inboundDD.appendChild(option);
            });
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error:', textStatus, errorThrown);
        });

}

$(document).ready(function () {
    //Intially hide the loader
    $('#loader').hide();
    $("#searchContacts").click(function () {
        GetSearchedResult(); 
        
    });
    GetTaskTypes(); GetPriorityType();
    GetAttachedToDDInfo();
    $('#selectBtn').on('click', function () {
        $('#grids').addClass('grid');
        $('#selectContact').addClass('active');
        $('#sendEmail').addClass('show');
        $('#diffContact').addClass('show');
        $('#selectBtn').addClass('hide');
    });
    $('#diffContact').on('click', function () {
        $('#grids').removeClass('grid');
        $('#selectContact').removeClass('active');
        $('#sendEmail').removeClass('show');
        $('#diffContact').removeClass('show');
        $('#selectBtn').removeClass('hide');
    });
    $('#showGrid1').on('click', function () {
        $('#box1').addClass('active');
        $('#box2').removeClass('active');
        $('#showGrid1').addClass('active');
        $('#showGrid2').removeClass('active');
    });

    $('#showGrid2').on('click', function () {
        $('#box1').removeClass('active');
        $('#box2').addClass('active');
        $('#showGrid1').removeClass('active');
        $('#showGrid2').addClass('active');
    });
});

function GetGroupsByUserId(userId) {
    console.log("Getting Groups");
    userId = 1127;
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
                    <getGroups>
                      <userid>`+ userId + `</userid>
                    </getGroups>
                  </soap:Body>
                </soap:Envelope>
                `
    };

    $.ajax(settings)
        .done(function (response) {
            // Parse the outer SOAP response
            const parser = new DOMParser();

            // Extract the inner XML string
            let getMatchesReturn = response.getElementsByTagName("getGroupsReturn");

            const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
            // Decode the inner XML string

            var decodedInnerXML = decodeHTMLEntities(decodedString);
            const escapedXml = decodedInnerXML.replace(/&/g, '&amp;');

            // Parse the decoded inner XML string
            const innerXmlDoc = parser.parseFromString(escapedXml, "text/xml");

            const group = innerXmlDoc.getElementsByTagName("group");

            // Convert the extracted contact information into an array of objects
            const groupList = [];

            for (let i = 0; i < group.length; i++) {
                const pr = group[i];
                const priObj = {
                    groupID: pr.getElementsByTagName("groupID")[0].textContent,
                    groupname: pr.getElementsByTagName("groupname")[0].textContent
                };
                groupList.push(priObj);
            }
            const gName = document.getElementById('group-name');

            // populate the dropdown
            groupList.forEach(item => {
                const option = document.createElement('option');
                option.value = item.groupID;
                option.textContent = item.groupname;
                gName.appendChild(option);
            });
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Error:', textStatus, errorThrown);
        });

}
//$(document).ready(function () {
//    console.log("document ready");
//    BindClickOnRowForSearch();
//});

function BindClickOnRowForSearch() {
    $('#searchTable tbody tr').on('click', function () {
        $('#searchTable tbody tr').removeClass('selected');
        $(this).toggleClass('selected');
        console.log("call came");
        // Collect data from the selected row
        var rowData = {};
        var headers = $('#searchTable th');

        $(this).find('td').each(function (index) {
            var key = $(headers[index]).text().trim();
            var value = $(this).text();
            rowData[key] = value;
        });
        console.log(headers);
        var selectedText = $('#group-name option:selected').text();

        $('#groupLbl').text(selectedText);
        $('#companyLbl').text(rowData["Company"]);
        $('#contactLbl').text(rowData["Contact Name"]);

        // Log the row data to the console
        console.log(rowData);
    });
}
$(document).ready(function () {
    $('#contactTable tbody tr').on('click', function () {
        $('#contactTable tbody tr').removeClass('selected');
        $(this).toggleClass('selected');

        // Collect data from the selected row
        var rowData = {};
        var headers = $('#contactTable th');

        $(this).find('td').each(function (index) {
            var key = $(headers[index]).text().trim();
            var value = $(this).text();
            rowData[key] = value;
        });
        $('#groupLbl').text(rowData.Group);
        $('#companyLbl').text(rowData["Company Event"]);
        $('#contactLbl').text(rowData["Contact Name"]);

        // Log the row data to the console
        console.log(rowData);
    });

});

function populateSearchTable(contactList) {
    console.log("executing");
    const $tableBody = $("#searchTable tbody");
    $tableBody.empty(); // Clear any existing rows

    contactList.forEach(contact => {
        const row = `
                <tr>
                    <td>${contact.fullname}</td>
                    <td>${contact.company}</td>
                    <td>${contact.contacttype}</td>
                    <td>${contact.address}</td>
                    <td>${contact.email}</td>
                </tr>
            `;
        $tableBody.append(row);
    });
    if (contactList.length === 0) {
        $tableBody.append('<p>No data found</p>');
    }
    $('#loader').hide();

    BindClickOnRowForSearch();
}

function GetSearchedResult() {
    $('#loader').show();
    var groupId = $('#group-name').val();
    var contactName = $('#name').val();
    var companyName = $('#company').val();
    var userId = 1127;
    console.log('Group Name:', groupId);
    console.log('Contact Name:', contactName);
    console.log('Company Name:', companyName);

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
            <getSearch>
              <userid>`+ userId + `</userid>
              <groupid>`+ groupId + `</groupid>
              <fullname>`+ contactName + `</fullname>
              <company>`+ companyName + `</company>
            </getSearch>
          </soap:Body>
        </soap:Envelope>
        `
    };

    $.ajax(settings)
        .done(function (response) {

            // Parse the outer SOAP response
            const parser = new DOMParser();

            // Extract the inner XML string
            let getMatchesReturn = response.getElementsByTagName("getSearchReturn");

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
                    fullname: contact.getElementsByTagName("fullname")[0].textContent,
                    company: contact.getElementsByTagName("company")[0].textContent,
                    contacttype: contact.getElementsByTagName("contacttype")[0].textContent,
                    address: contact.getElementsByTagName("address")[0].textContent,
                    email: (contact.getElementsByTagName("email")[0] != undefined) ? contact.getElementsByTagName("email")[0].textContent : ""
                };
                contactList.push(contactObj);
            }
            console.log(contactList);
            populateSearchTable(contactList);
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