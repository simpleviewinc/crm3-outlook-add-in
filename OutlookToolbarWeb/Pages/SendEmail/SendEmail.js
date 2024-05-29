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

$(document).ready(function () {
    $("#searchContacts").click(function () {
        GetSearchedResult();
    });
    
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
                      <userid>`+userId+`</userid>
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
}

function GetSearchedResult() {
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
              <userid>`+userId+`</userid>
              <groupid>`+ groupId +`</groupid>
              <fullname>`+contactName+`</fullname>
              <company>`+ companyName +`</company>
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
                    email: contact.getElementsByTagName("email")[0].textContent
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