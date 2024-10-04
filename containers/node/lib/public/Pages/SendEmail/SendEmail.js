let messageObject = {
		groupid: '',
		userid: '',
		acctid: '',
		contactid: '',
		duedate: formatDate(new Date()),
		typeid: '',
		priorityid: '',
		subject: '',
		body: '',
		attachment: '',
		attachmentcontent: '',
		tblid: '',
		recid: '',
		relflds: '',
		relfldvals: ''
	},
	ApiUrl,
	currentSelectedData = [],
	isSelectButtonClicked = false;
SetApiUrl();

function formatDate(date, tempDate) {
	if (date == "Invalid Date" && typeof tempDate === 'string') {
		let split = tempDate.split(',');
		if (split != undefined && split != null && split.length > 0)
			return convertToMMDDYYYY(split[0]);
	}
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
	const year = date.getFullYear();
	
	// Check if any of the values are null, empty, or NaN
	if (!day || !month || !year || isNaN(date.getTime())) {
		const today = new Date();
		const todayDay = String(today.getDate()).padStart(2, '0');
		const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
		const todayYear = today.getFullYear();
		return `${todayMonth}/${todayDay}/${todayYear}`;
	}

	return `${month}/${day}/${year}`;
}

function convertToMMDDYYYY(dateString) {
	const dateParts = dateString.split('/');

	if (dateParts.length !== 3) {
		return null; // Invalid date format
	}

	const day = String(dateParts[0]).padStart(2, '0');
	const month = String(dateParts[1]).padStart(2, '0'); // January is 0!
	const year = dateParts[2];

	return `${month}/${day}/${year}`;
}

window.initPopup = function (isSyncEmail, selectedEmails) {
	console.log("init popup: " + isSyncEmail);

	if (isSyncEmail) {
		$("#syncEmailUI").show();
		$("#sendEmailUI").hide();
		$(document).ready(function () {
			setTimeout(() => {
				if (typeof window.inboxEmails !== 'undefined' && Object.keys(window.inboxEmails).length > 0) {
					const tableBody = document.querySelector("#inboxTable tbody");
					console.log(window.inboxEmails);
					Object.values(window.inboxEmails).forEach((email, index) => {
						const row = tableBody.insertRow();
						const indexCell = row.insertCell(0);
						const fromCell = row.insertCell(1);
						const subjectCell = row.insertCell(2);
						const receivedCell = row.insertCell(3);
						const bodyCell = row.insertCell(4);

						bodyCell.textContent = email.BodyPreview;
						bodyCell.style.display = 'none';
						indexCell.innerHTML = '<input type="checkbox" value=' + email.Id + ' class="row-checkbox">';
						fromCell.textContent = email.From.EmailAddress.Address;
						subjectCell.textContent = email.Subject;
						receivedCell.textContent = new Date(email.ReceivedDateTime).toLocaleString(); // Convert the received date to a readable format
					});
				} else {
					const tableBody = document.querySelector("#inboxTable tbody");
					const row = tableBody.insertRow();
					const indexCell = row.insertCell(0);
					indexCell.textContent = "No data found";
					indexCell.colSpan = 4;
					indexCell.style.textAlign = "center";
					indexCell.style.padding = "10px";
					console.log("No data found in inbox.");
				}
			}, 1000); // Delay of 1 second to ensure data is available

			setTimeout(() => {
				if (typeof window.sentEmails !== 'undefined' && Object.keys(window.sentEmails).length > 0) {
					const tableBody = document.querySelector("#sentBoxTable tbody");
					Object.values(window.sentEmails).forEach((email, index) => {
						const row = tableBody.insertRow();
						const indexCell = row.insertCell(0);
						const fromCell = row.insertCell(1);
						const subjectCell = row.insertCell(2);
						const receivedCell = row.insertCell(3);
						const bodyCell = row.insertCell(4);

						bodyCell.textContent = email.BodyPreview;
						bodyCell.style.display = 'none';
						indexCell.innerHTML = '<input type="checkbox" value=' + email.Id + ' class="row-checkbox">';
						fromCell.textContent = email.From.EmailAddress.Address;
						subjectCell.textContent = email.Subject;
						receivedCell.textContent = new Date(email.ReceivedDateTime).toLocaleString(); // Convert the received date to a readable format
					});
				} else {
					const tableBody = document.querySelector("#sentBoxTable tbody");
					const row = tableBody.insertRow();
					const indexCell = row.insertCell(0);
					indexCell.textContent = "No data found";
					indexCell.colSpan = 4;
					indexCell.style.textAlign = "center";
					indexCell.style.padding = "10px";
					console.log("No data found in sent box.");
				}
			}, 1000); // Delay of 1 second to ensure data is available
		});


	} else {
		$("#syncEmailUI").hide();
		$("#sendEmailUI").show();
	}

	const emailData = selectedEmails; // Get the passed email data
	console.log("email data in selected email:  ");
	console.log(selectedEmails);
	// Update the HTML elements with the email data
	$(document).ready(function () {
		setTimeout(function () {
			if (emailData != null && emailData != undefined && !isSyncEmail) {
				console.log("1");
				currentSelectedData = emailData;
				console.log(emailData);
				if (emailData != null && emailData.length > 0) {
					console.log("2");
					isSelectButtonClicked = true;
					ProcessSelectedData(currentSelectedData);
				}
			}
		}, 500);
	});
};
let isInboxTabClicked = true;
let index = 1;

function ProcessSelectedData(data) {
	console.log("Process method called:-- ");
	const count = currentSelectedData.length + index - 1;
	const resval = localStorage.getItem("crm");
	let settings = {};
	if (resval != null) {
		settings = decodeFromBase64(resval);
	}
	console.log("3");
	const outboundPrt = document.getElementById('priority');
	const outboundDD = document.getElementById('trace-type');
	if (data[0].isInbox) {
		$('#inboundHeading').text("Inbound Email " + index + " of " + count);
		if (settings != null) {
			outboundPrt.value = settings.inboundPriority;
			outboundDD.value = settings.inboundTraceType;
		}
	} else {
		$('#inboundHeading').text("Outbound Email " + index + " of " + count);
		if (settings != null) {
			setTimeout(() => {
				outboundPrt.value = settings.outboundPriority;
				outboundDD.value = settings.outboundTraceType;
			}, 500);
		}
	}
	index++;
	console.log("applying the value here:-----------------------");
	console.log(data);
	$('#syncEmailUI').hide();
	$('#sendEmailUI').show();
	$('.headings h5:nth-child(1)').text('From: ' + data[0].fromEmail);
	$('.headings h5:nth-child(2)').text('Subject: ' + data[0].subject);
	$('#received').text('Received: ' + new Date(data[0].receivedDate).toLocaleString());
	$('#EmailId').val(data[0].id);
	messageObject.body = data[0].body;
	messageObject.subject = data[0].subject;
	messageObject.duedate = formatDate(new Date(data[0].receivedDate), data[0].receivedDate);
	GetMatchingDataForSync(data[0].fromEmail, messageObject.userid);
}

function populateTable(contactList) {
	if (!Array.isArray(contactList)) {
		console.log('contactList is not an array');
		return; // Exit the function
	}
	const $tableBody = $("#contactTable tbody");
	$tableBody.empty(); // Clear any existing rows
	EnableButtonById("#selectBtn");
	contactList.forEach(contact => {
		const row = `
				<tr>
					<td>${contact.groupname}</td>
					<td>${contact.fullname}</td>
					<td>${contact.company}</td>
					<td>${contact.contacttype}</td>
					<td>${contact.address}</td>
					<td>${contact.email}</td>
					<td class='hidden'>${contact.groupID}</td>
					<td class='hidden'>${contact.acctID}</td>
					<td class='hidden'>${contact.contactID}</td>
				</tr>
			`;
		$tableBody.append(row);
	});
	if (contactList.length === 0) {
		DisableButtonById("#selectBtn");
		const colCount = $('table thead tr th').length; // Get the number of columns
		$tableBody.append(`
	  <tr>
		<td colspan="${colCount}" style="text-align: center;">No data found</td>
	  </tr>
	`);
	}
	BindRowSelectFunction();
}

function decodeFromBase64(base64Str) {
	const jsonString = atob(base64Str);
	return JSON.parse(jsonString);
}
function validateMessageObject(messageObject) {
	// Checking if each optional field exists and is not null, otherwise assign an empty string
	messageObject.duedate = messageObject.duedate || '';
	messageObject.subject = messageObject.subject || '';
	messageObject.body = messageObject.body || '';
	messageObject.attachment = messageObject.attachment || '';
	messageObject.attachmentcontent = messageObject.attachmentcontent || '';
	messageObject.tblid = messageObject.tblid || '';
	messageObject.recid = messageObject.recid || '';
	messageObject.relflds = messageObject.relflds || '';
	messageObject.relfldvals = messageObject.relfldvals || '';

	return messageObject;
}
function SendTheEmail() {
	messageObject = validateMessageObject(messageObject);
	$("#sendEmailLoader").show();
	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "text/xml; charset=utf-8",
			"SOAPAction": ""
		},
		data: `<?xml version="1.0" encoding="utf-8"?>
					<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
					  <soap:Body>
						<sendEmail>
						  <groupid>` + messageObject.groupid + `</groupid>
						  <userid>` + messageObject.userid + `</userid>
						  <acctid>` + messageObject.acctid + `</acctid>
						  <contactid>` + messageObject.contactid + `</contactid>
						  <duedate>` + messageObject.duedate + `</duedate>
						  <typeid>` + messageObject.typeid + `</typeid>
						  <priorityid>` + messageObject.priorityid + `</priorityid>
						  <subject>` + messageObject.subject + `</subject>
						  <body>` + messageObject.body + `</body>
						  <attachment>` + messageObject.attachment + `</attachment>
						  <attachmentcontent>` + messageObject.attachmentcontent + `</attachmentcontent>
						  <tblid>` + messageObject.tblid + `</tblid>
						  <recid>` + messageObject.recid + `</recid>
						  <relflds>` + messageObject.relflds + `</relflds>
						  <relfldvals>` + messageObject.relfldvals + `</relfldvals>
						</sendEmail>
					  </soap:Body>
					</soap:Envelope>`
	};

	$.ajax(settings)
		.done(function (response) {
			let getMatchesReturn = response.getElementsByTagName("sendEmailReturn");
			const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
			$("#sendEmailLoader").hide();
			alert("Email sent with trace id: " + parseInt(decodedString));
			removeFirstItem(currentSelectedData);
			if (currentSelectedData && currentSelectedData.length > 0)
				ProcessSelectedData(currentSelectedData);
			else
				CloseAll();
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.error('Error:', textStatus, errorThrown);
			$("#sendEmailLoader").hide();
			alert("Some error has occurred " + errorThrown);
			CloseAll();
		});

}

function CloseAll() {
	if (window.opener && !window.opener.closed) {
		if (typeof window.opener.CloseTheTaskPane === 'function') {
			window.opener.CloseTheTaskPane();
			window.close(); // Optionally close the popup after sending data
		} else {
			console.error("Parent window method setCategoryToEmail is not defined.");
		}
	} else {
		console.error("Parent window is not available.");
	}
}

function checkMessageObjectFields(messageObject) {
	messageObject.priorityid = $("#priority").val();
	messageObject.typeid = $("#trace-type").val();
	messageObject.tblid = $("#lead").val();
	messageObject.recid = $("#profile").val();

	// Initialize arrays for missing required and optional fields
	let requiredFields = ['groupid', 'userid', 'acctid', 'contactid', 'priorityid', 'typeid'];
	let remainingFields = [ 'tblid', 'recid', 'relflds', 'relfldvals'];

	let missingRequired = [];
	let missingOptional = [];

	// Function to check if the value is null or empty
	function isNullOrEmpty(value) {
		return value === null || value === '';
	}

	// Check required fields
	requiredFields.forEach(function (field) {
		if (isNullOrEmpty(messageObject[field])) {
			missingRequired.push(field);
		}
	});

	// Check remaining optional fields
	remainingFields.forEach(function (field) {
		if (isNullOrEmpty(messageObject[field])) {
			missingOptional.push(field);
		}
	});

	// Display message in a div using jQuery
	if (missingRequired.length > 0) {
		const requiredMessage = missingRequired.length === 1
			? `Required field ${missingRequired[0]} is missing for this contact.`
			: `Required fields ${missingRequired.join(', ')} are missing for this contact.`;

		$('#messageDiv').text(requiredMessage);
		DisableButtonById("#sendEmail");
	} else if (missingOptional.length > 0) {
		EnableButtonById("#sendEmail");

		const optionalMessage = missingOptional.length === 1
			? `Optional field ${missingOptional[0]} is missing for this contact.`
			: `Optional fields ${missingOptional.join(', ')} are missing for this contact.`;

		$('#messageDiv').text(optionalMessage);
	} else {
		EnableButtonById("#sendEmail");
		$('#messageDiv').text("");
	}

}

function GetAttachedToDDInfo() {
	console.log("GetAttachedToDDInfo");
	console.debug(messageObject);
	$("#sendEmailLoader").show();
	DisableButtonById("#sendEmail");
	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
					  <userid>` + messageObject.userid + `</userid>
					  <groupid>` + messageObject.groupid + `</groupid>
					  <acctid>` + messageObject.acctid + `</acctid>
					  <contactid>` + messageObject.contactid + `</contactid>
					</getRelOpts>
				  </soap:Body>
				</soap:Envelope>`
	};

	$.ajax(settings)
		.done(function (response) {
			console.log(response);
			$("#sendEmailLoader").hide();
			// Extract the inner XML string
			let getMatchesReturn = response.getElementsByTagName("getRelOptsReturn");
			const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
			// Decode the inner XML string
			const decodedInnerXML = decodeHTMLEntities(decodedString);
			//console.log(decodedInnerXML);
			parseXmlToJson(decodedInnerXML);
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			$("#sendEmailLoader").hide();
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
	bindLeadDataToSelect(JSON.stringify(json, null, 2));
	return json;
}

function findRelByTitle(rels, title) {
	if (Array.isArray(rels)) {
		return rels.find(rel => rel.title["#text"] === title);
	} else if (rels && typeof rels === 'object') {
		const relArray = [rels];
		return relArray.find(rel => rel.title["#text"] === title);
	} else {
		console.error(`Invalid data structure: rels is not an array or object for title: ${title}`);
		return null;
	}
}

function bindLeadDataToSelect(jsonData) {
	jsonData = JSON.parse(jsonData);

	// Lead Data
	const leadData = findRelByTitle(jsonData.opts.rels.rel, "Lead");
	const select = document.getElementById("lead");
	select.innerHTML = '';
	if (leadData) {
		if (Array.isArray(leadData.data.row)) {
			leadData.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.text = row.DISPLAY["#text"];
					select.appendChild(option);
				}
			});
		}
	}

	// Profile Data
	const profileData = findRelByTitle(jsonData.opts.rels.rel, "Profile");
	const profileSelect = document.getElementById("profile");
	profileSelect.innerHTML = '';
	if (profileData) {
		if (Array.isArray(profileData.data.row)) {
			profileData.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.text = row.DISPLAY["#text"];
					profileSelect.appendChild(option);
				}
			});
		}
	}

	// Service Request Data
	const requestData = findRelByTitle(jsonData.opts.rels.rel, "Service Request");
	const requestSelect = document.getElementById("request");
	requestSelect.innerHTML = '';
	if (requestData) {
		if (Array.isArray(requestData.data.row)) {
			requestData.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.text = row.DISPLAY["#text"];
					requestSelect.appendChild(option);
				}
			});
		} else if (requestData.data.row) {
			const row = requestData.data.row;
			if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
				const option = document.createElement("option");
				option.value = row.ID["#text"];
				option.text = row.DISPLAY["#text"];
				requestSelect.appendChild(option);
			}
		}
	}

	// Planner Account Data
	const plannerActData = findRelByTitle(jsonData.opts.rels.rel, "Planner Account");
	const plannerSelect = document.getElementById("plannerAct");
	plannerSelect.innerHTML = '';
	if (plannerActData) {
		if (Array.isArray(plannerActData.data.row)) {
			plannerActData.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.text = row.DISPLAY["#text"];
					plannerSelect.appendChild(option);
				}
			});
		}
	}

	// Planner Contact Data
	const plannerContact = findRelByTitle(jsonData.opts.rels.rel, "Planner Contact");
	const plannerContactSelect = document.getElementById("plannerContact");
	plannerContactSelect.innerHTML = '';
	if (plannerContact) {
		if (Array.isArray(plannerContact.data.row)) {
			plannerContact.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.text = row.DISPLAY["#text"];
					plannerContactSelect.appendChild(option);
				}
			});
		}
	}

	// Bind messageObject properties
	if (jsonData.opts.tblid && jsonData.opts.tblid["#text"]) {
		messageObject.tblid = jsonData.opts.tblid["#text"];
	}
	if (jsonData.opts.recid && jsonData.opts.recid["#text"]) {
		messageObject.recid = jsonData.opts.recid["#text"];
	}
	if (jsonData.opts.hiddenrel && jsonData.opts.hiddenrel["#text"]) {
		messageObject.relflds = jsonData.opts.hiddenrel["#text"];
	}
	if (jsonData.opts.hiddenrelval && jsonData.opts.hiddenrelval["#text"]) {
		messageObject.relfldvals = jsonData.opts.hiddenrelval["#text"];
	}

	checkMessageObjectFields(messageObject);
}


function GetPriorityType(selectedType) {

	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
			const inboundPrt = document.getElementById('priority');

			// populate the dropdown
			priorityList.forEach(item => {
				const option = document.createElement('option');
				option.value = item.priID;
				option.textContent = item.priname;
				if (item.priID === selectedType) {
					option.selected = true;
				}
				inboundPrt.appendChild(option);
			});
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.error('Error:', textStatus, errorThrown);
		});

}

function GetTaskTypes(selectedTask) {
	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
			// const xmlDoc = parser.parseFromString(response, "application/xml");

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
			const inboundDD = document.getElementById('trace-type');

			// Populate the dropdown
			typeList.forEach(item => {
				const option = document.createElement('option');
				option.value = item.typeID;
				option.textContent = item.typename;
				if (item.typeID === selectedTask) {
					option.selected = true;
				}
				inboundDD.appendChild(option);
			});

		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.error('Error:', textStatus, errorThrown);
		});

}

function removeFirstItem(obj) {
	if (obj && Array.isArray(obj)) {
		obj.shift();
	}
}

function SetApiUrl() {
	ApiUrl = GetProxyUrl(GetCrmUrlFromLocalStorage());
	//const resval = localStorage.getItem("crm");
	//let data = {};
	//if (resval != null) {
	//	data = decodeFromBase64(resval);
	//	if (data != null) {
	//		if (data.userId != null && data.userId != undefined && data.userId != '') {
	//			const url = data.crmUrl;

	//			if (window.location.hostname.toLowerCase().indexOf('localhost') > -1 ||
	//				window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {

	//				if (url === "https://demo.simpleviewcrm.com") {
	//					if (window.location.hostname.toLowerCase().indexOf('localhost') > -1) {
	//						ApiUrl = "http://localhost:4000/api";
	//					} else if (window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {
	//						ApiUrl = "https://c219-13-84-216-53.ngrok-free.app/api";
	//					}
	//				} else {
	//					alert("Url not valid");
	//					return;
	//				}

	//			} else {
	//				if (url.endsWith(".simpleviewcrm.com")) {
	//					ApiUrl = url;
	//				} else {
	//					alert("Url not valid");
	//					return;
	//				}
	//			}
	//		}
	//	}
	//}
}

$(document).ready(function () {
	$("#sendEmailLoader").hide();
	$("#matchContactLoader").hide();
	DisableButtonById("#selectBtn");
	const resval = localStorage.getItem("crm");
	let data = {};
	if (resval != null) {
		data = decodeFromBase64(resval);
		if (data != null) {
			if (data.userId != null && data.userId != undefined && data.userId != '') {
				messageObject.userid = data.userId;
				GetTaskTypes(data.inboundTraceType); GetPriorityType(data.inboundPriority);
				GetGroupsByUserId();
			}
		}
	}
	
	$('#skipit').on('click', () => {
		const id = $('#EmailId').val();
		if (window.opener && !window.opener.closed) {
			if (typeof window.opener.setCategoryToEmail === 'function') {
				console.log("Email Id: " + id);
				window.opener.setCategoryToEmail(id, false);
				removeFirstItem(currentSelectedData);
				if (currentSelectedData && currentSelectedData.length > 0)
					ProcessSelectedData(currentSelectedData);
				else {
					setTimeout(function () {
						CloseAll();
					}, 1000); 
				}
					
			} else {
				console.error("Parent window method setCategoryToEmail is not defined.");
			}
		} else {
			console.error("Parent window is not available.");
		}
	});


	$('#priority').on('change', function () {
		const selectedValue = $(this).val();
		messageObject.priorityid = selectedValue;
	});
	$('#trace-type').on('change', function () {
		const selectedValue = $(this).val();
		messageObject.typeid = selectedValue;
	});

	$('#sendEmail').on('click', () => {
		const id = $('#EmailId').val();
		messageObject.priorityid = $("#priority").val();
		messageObject.typeid = $("#trace-type").val();
		messageObject.tblid = $("#lead").val();
		messageObject.recid = $("#profile").val();
		console.log(messageObject);
		if (window.opener && !window.opener.closed) {
			if (typeof window.opener.setCategoryToEmail === 'function') {
				window.opener.setCategoryToEmail(id, true);
				SendTheEmail();

			} else {
				console.error("Parent window method setCategoryToEmail is not defined.");
			}
		} else {
			console.error("Parent window is not available.");
		}
	});
	function getSelectedRowsData() {
		// Create an array to hold the selected row data
		const selectedRowsData = [];

		const inboxCheckboxes = document.querySelectorAll('#inboxTable .row-checkbox:checked');
		const sentBoxCheckboxes = document.querySelectorAll('#sentBoxTable .row-checkbox:checked');

		// Convert NodeLists to arrays and merge them
		const checkboxes = [
			...Array.from(inboxCheckboxes),
			...Array.from(sentBoxCheckboxes)
		];

		// Loop through each checkbox
		checkboxes.forEach(checkbox => {
			// Check if the checkbox is selected
			if (checkbox.checked) {
				// Find the parent row (tr) of the checkbox
				const row = checkbox.closest('tr');

				// Check which table the row belongs to
				const isInbox = row.closest('table').id === 'inboxTable';

				// Get the value from the checkbox
				const checkboxValue = checkbox.value;

				// Get the text content from the sibling td elements
				const email = row.cells[1].textContent;
				const subject = row.cells[2].textContent;
				const date = row.cells[3].textContent;
				const body = row.cells[4].textContent;

				// Create an object with the row data
				const rowData = {
					id: checkboxValue,
					fromEmail: email,
					subject: subject,
					receivedDate: date,
					body: body,
					isInbox: isInbox
				};

				// Add the row data object to the array
				selectedRowsData.push(rowData);
			}
		});

		// Return the array of selected row data
		return selectedRowsData;
	}

	$('#loader').hide();
	$("#searchContacts").click(function () {
		GetSearchedResult();
	});


	$('#SyncOk').on('click', function () {
		isSelectButtonClicked = true;
		console.log("ok  clicked !!");
		console.log("isSelectButtonClicked: REMOVE? - Variable isn't actually in use - ", isSelectButtonClicked);
		currentSelectedData = getSelectedRowsData(isInboxTabClicked);
		console.log("Selected Rows Data:-  ");
		console.log(currentSelectedData);
		ProcessSelectedData(currentSelectedData);
	});

	$('#selectBtn').on('click', function () {
		GetAttachedToDDInfo();
		$('#grids').addClass('grid');
		$('#selectContact').addClass('active');
		$('#sendEmail').addClass('show');
		$('#diffContact').addClass('show');
		$('#selectBtn').addClass('hide');
	});
	$('#SendCancel').on('click', function () {
		window.close();
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

	$('#showGrid3').on('click', function () {
		$('#SyncBox1').addClass('active');
		$('#SyncBox2').removeClass('active');
		$('#showGrid3').addClass('active');
		$('#showGrid4').removeClass('active');
		isInboxTabClicked = true;
	});

	$('#showGrid4').on('click', function () {
		$('#SyncBox1').removeClass('active');
		$('#SyncBox2').addClass('active');
		$('#showGrid3').removeClass('active');
		$('#showGrid4').addClass('active');
		isInboxTabClicked = false;
	});
});

function GetGroupsByUserId() {
	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
					  <userid>` + messageObject.userid + `</userid>
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

			let decodedInnerXML = decodeHTMLEntities(decodedString);
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

function BindClickOnRowForSearch() {
	
	$('#searchTable tbody tr').on('click', function () {
		if ($(this).find('td').first().text().trim().toLowerCase() === "no data found") {
			return;
		}
		$('#searchTable tbody tr').removeClass('selected');
		$(this).toggleClass('selected');
		// Collect data from the selected row
		let rowData = {};
		const headers = $('#searchTable th');

		$(this).find('td').each(function (index) {
			const key = $(headers[index]).text().trim();
			const value = $(this).text();
			rowData[key] = value;
		});
		const selectedText = $('#group-name option:selected').text();

		$('#groupLbl').text(selectedText);
		$('#companyLbl').text(rowData["Company"]);
		$('#contactLbl').text(rowData["Contact Name"]);

		// Log the row data to the console
		console.log(rowData);
		messageObject.groupid = rowData["GroupId"];
		messageObject.acctid = rowData["ActId"];
		messageObject.contactid = rowData["ContId"];
	});
}


$(document).ready(function () {
	BindRowSelectFunction();
});

function BindRowSelectFunction() {
	$('#contactTable tbody tr').on('click', function () {
		if ($(this).find('td').first().text().trim().toLowerCase() === "no data found") {
			return;
		}
		$('#contactTable tbody tr').removeClass('selected');
		$(this).toggleClass('selected');
		console.log("contact table row clicked");
		// Collect data from the selected row
		let rowData = {};
		const headers = $('#contactTable th');

		$(this).find('td').each(function (index) {
			const key = $(headers[index]).text().trim();
			const value = $(this).text();
			rowData[key] = value;
		});
		$('#groupLbl').text(rowData.Group);
		$('#companyLbl').text(rowData["Company Event"]);
		$('#contactLbl').text(rowData["Contact Name"]);

		// Log the row data to the console
		console.log(rowData);
		messageObject.groupid = rowData["GroupId"];
		messageObject.acctid = rowData["ActId"];
		messageObject.contactid = rowData["ContId"];
	});
}

function populateSearchTable(contactList) {
	console.log("populateSearchTable executing");
	console.log(contactList);
	const $tableBody = $("#searchTable tbody");
	$tableBody.empty(); // Clear any existing rows
	EnableButtonById("#selectBtn");
	contactList.forEach(contact => {
		const row = `
				<tr>
					<td>${contact.fullname}</td>
					<td>${contact.company}</td>
					<td>${contact.contacttype}</td>
					<td>${contact.address}</td>
					<td>${contact.email}</td>
					<td class='hidden'>${contact.groupID}</td>
					<td class='hidden'>${contact.acctID}</td>
					<td class='hidden'>${contact.contactID}</td>
				</tr>
			`;
		$tableBody.append(row);
	});
	if (contactList.length === 0) {
		DisableButtonById("#selectBtn");
		const colCount = $('table thead tr th').length; // Get the number of columns
		$tableBody.append(`
	  <tr>
		<td colspan="${colCount}" style="text-align: center;">No data found</td>
	  </tr>
	`);
	}
	else
		EnableButtonById("#selectBtn");
	$('#loader').hide();
	EnableButtonById("#searchContacts");
	
	EnableButtonById("#skipit");
	BindClickOnRowForSearch();
}

function DisableButtonById(id) {
	$(id).addClass('disabled');
	$(id).prop('disabled', true);
}
function EnableButtonById(id) {
	$(id).removeClass('disabled');
	$(id).prop('disabled', false);
}

function GetSearchedResult() {
	$('#loader').show();
	DisableButtonById("#searchContacts");
	DisableButtonById("#selectBtn");
	DisableButtonById("#skipit");
	const groupId = $('#group-name').val();
	const contactName = $('#name').val();
	const companyName = $('#company').val();

	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
			  <userid>` + messageObject.userid + `</userid>
			  <groupid>` + groupId + `</groupid>
			  <fullname>` + contactName + `</fullname>
			  <company>` + companyName + `</company>
			</getSearch>
		  </soap:Body>
		</soap:Envelope>
		`
	};

	$.ajax(settings)
		.done(function (response) {
			const parser = new DOMParser();
			let getMatchesReturn = response.getElementsByTagName("getSearchReturn");
			const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
			const decodedInnerXML = decodeHTMLEntities(decodedString);
			const innerXmlDoc = parser.parseFromString(decodedInnerXML, "text/xml");
			const contacts = innerXmlDoc.getElementsByTagName("contact");
			const contactList = [];
			for (let i = 0; i < contacts.length; i++) {
				const contact = contacts[i];
				const getTextContent = (tagName) => {
					const elements = contact.getElementsByTagName(tagName);
					return (elements.length > 0 && elements[0]) ? elements[0].textContent : "";
				};
				const contactObj = {
					groupID: getTextContent("groupID"),
					acctID: getTextContent("acctID"),
					contactID: getTextContent("contactID"),
					fullname: getTextContent("fullname"),
					company: getTextContent("company"),
					contacttype: getTextContent("contacttype"),
					address: getTextContent("address"),
					email: getTextContent("email")
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


function GetMatchingDataForSync(email, userId) {
	console.log("Api Url");
	console.log(ApiUrl);
	console.log("email" + email);
	if (!email || !userId)
		return;
	$("#matchContactLoader").show();

	const settings = {
		url: ApiUrl,// + "/cftags/outlook.cfc",
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
					<userid>` + userId + `</userid>
					<email>` + email + `</email>
				  </getMatches>
				</soap:Body>
			  </soap:Envelope>`
	};

	$.ajax(settings)
		.done(function (response) {
			// Parse the outer SOAP response
			const parser = new DOMParser();
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
			populateTable(contactList);
			$("#matchContactLoader").hide();
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			console.error('Error:', textStatus, errorThrown);
			$("#matchContactLoader").hide();
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



// Function to toggle the state of all checkboxes in a box
$(document).ready(function () {
	$('.select-all-button').click(function () {
		const targetTable = $(this).data('target');
		$(targetTable).find('input[type="checkbox"]').prop('checked', true).closest('tr').addClass('selected');
	});

	$('.clear-all-button').click(function () {
		const targetTable = $(this).data('target');
		$(targetTable).find('input[type="checkbox"]').prop('checked', false).closest('tr').removeClass('selected');
	});
});