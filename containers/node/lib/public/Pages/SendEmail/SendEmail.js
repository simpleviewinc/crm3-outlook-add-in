let messageObject = {
		groupid: '',
		userid: '',
		acctid: '',
		contactid: '',
		duedate: new Date().toLocaleDateString("en-US"),
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
	IsInboxTab = false;

let EmailSyncCompletedDialogObj = {
	isSyncEmail : false,
	NumberOfInboundEmails : 0,
	NumberOfOutboundEmails : 0
};

let parentRelIdtoChildRelVal = {};
let listOfRelfIdvalsDynamicObj = {};
let index = 1;

SetApiUrl();

window.initPopup = function (isSyncEmail, selectedEmails) {
	console.log("init popup: " + isSyncEmail);

	if (isSyncEmail) {
		EmailSyncCompletedDialogObj.isSyncEmail = true;
		$("#syncEmailUI").show();
		$("#sendEmailUI").hide();
		$(document).ready(function () {
			DisableButtonById('#SyncOk');
			DisableButtonById('#ClearAllInbox');
			DisableButtonById('#ClearAllSentBox');

			setTimeout(() => {
				if (typeof window.inboxEmails !== 'undefined' && Object.keys(window.inboxEmails).length > 0) {
					const tableBody = document.querySelector("#inboxTable tbody");
					console.log(window.inboxEmails);
					Object.values(window.inboxEmails).forEach((email, index) => {
						const row = tableBody.insertRow();
						const indexCell = row.insertCell(0);
						const fromCell = row.insertCell(1);
						const subjectCell = row.insertCell(2);
						const receivedDateCellToDisplay = row.insertCell(3);
						const bodyCell = row.insertCell(4);
						const receivedCellUtc = row.insertCell(5);
						receivedCellUtc.classList.add("hidden");

						bodyCell.textContent = email.Body.Content;
						bodyCell.style.display = 'none';
						indexCell.innerHTML = '<input type="checkbox" value=' + email.Id + ' class="row-checkbox">';
						fromCell.textContent = email.From.EmailAddress.Address;
						subjectCell.textContent = email.Subject;
						receivedDateCellToDisplay.textContent = new Date(email.ReceivedDateTime).toLocaleString(); // Convert the received date to a readable format
						receivedCellUtc.textContent = email.ReceivedDateTime;
					});	

					AddOnRowSelectListener('#inboxTable .row-checkbox');
				} else {
					const tableBody = document.querySelector("#inboxTable tbody");
					const row = tableBody.insertRow();
					const indexCell = row.insertCell(0);
					indexCell.textContent = "No data found";
					indexCell.colSpan = 4;
					indexCell.style.textAlign = "center";
					indexCell.style.padding = "10px";
					console.log("No data found in inbox.");
					DisableButtonById('#selectAllInbox');
				}
			}, 1000); // Delay of 1 second to ensure data is available

			setTimeout(() => {
				if (typeof window.sentEmails !== 'undefined' && Object.keys(window.sentEmails).length > 0) {
					const tableBody = document.querySelector("#sentBoxTable tbody");
					Object.values(window.sentEmails).forEach((email, index) => {
						const row = tableBody.insertRow();
						const indexCell = row.insertCell(0);
						const toCell = row.insertCell(1);
						const subjectCell = row.insertCell(2);
						const receivedCellToDisplay = row.insertCell(3);
						const bodyCell = row.insertCell(4);
						const receivedCellUtc = row.insertCell(5);
						receivedCellUtc.classList.add("hidden");

						bodyCell.textContent = email.Body.Content;
						bodyCell.style.display = 'none';
						indexCell.innerHTML = '<input type="checkbox" value=' + email.Id + ' class="row-checkbox">';
						subjectCell.textContent = email.Subject;
						receivedCellToDisplay.textContent = new Date(email.ReceivedDateTime).toLocaleString(); // Convert the received date to a readable format
						receivedCellUtc.textContent = email.ReceivedDateTime;

						let AllToRecipients = "";
						
						email.ToRecipients.forEach((element, index) => {
							AllToRecipients = AllToRecipients + (index > 0 ? ', ' : '') + element.EmailAddress.Address;
						});
						toCell.textContent = AllToRecipients;
					});					

					AddOnRowSelectListener('#sentBoxTable .row-checkbox');
				} else {
					const tableBody = document.querySelector("#sentBoxTable tbody");
					const row = tableBody.insertRow();
					const indexCell = row.insertCell(0);
					indexCell.textContent = "No data found";
					indexCell.colSpan = 4;
					indexCell.style.textAlign = "center";
					indexCell.style.padding = "10px";
					console.log("No data found in sent box.");
					DisableButtonById('#selectAllSentBox');
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
					ProcessSelectedData(currentSelectedData);
				}
			}
		}, 500);
	});
};


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
				GetGroupsByUserId();
			}
		}
	}

	$('.select-all-button').click(function () {
		const targetTable = $(this).data('target');
		$(targetTable).find('input[type="checkbox"]').prop('checked', true).closest('tr').addClass('selected');
		EnableButtonById('#SyncOk');
		toggleSelectAllButton();
		toggleClearAllButton();
	});

	$('.clear-all-button').click(function () {
		const targetTable = $(this).data('target');
		$(targetTable).find('input[type="checkbox"]').prop('checked', false).closest('tr').removeClass('selected');
		toggleSyncButton();
		toggleClearAllButton();
		toggleSelectAllButton();
	});
	
	$('#skipit').on('click', () => {
		$('#searchTable tbody tr').removeClass('selected');
		$('#contactTable tbody tr').removeClass('selected');
		DisableButtonById("#skipit");
		DisableButtonById("#diffContact");
		DisableButtonById("#sendEmail");
		DisableButtonById("#SendCancel");
		const id = $('#EmailId').val();
		if (window.opener && !window.opener.closed) {
			if (typeof window.opener.setCategoryToEmail === 'function') {
				console.log("Email Id: " + id);
				$("#sendEmailLoader").show();

				window.opener.setCategoryToEmail(id, false).then(() => {
					removeFirstItem(currentSelectedData);
					if (currentSelectedData && currentSelectedData.length > 0){
						ProcessSelectedData(currentSelectedData);
						$("#sendEmailLoader").hide();
						EnableButtonById("#skipit");
						EnableButtonById("#diffContact");
						EnableButtonById("#sendEmail");
						EnableButtonById("#SendCancel");
						// checkMessageObjectFields execute only on SendEmail screen
						if ($('#selectContact').hasClass('active'))
							checkMessageObjectFields(messageObject);
					} else {
						CloseAll();
					}
				}).catch(() => {
					$("#sendEmailLoader").hide();
					EnableButtonById("#skipit");
					EnableButtonById("#diffContact");
					EnableButtonById("#sendEmail");
					EnableButtonById("#SendCancel");
				});
			} else {
				console.error("Parent window method setCategoryToEmail is not defined.");
				EnableButtonById("#skipit");
				EnableButtonById("#diffContact");
				EnableButtonById("#sendEmail");
				EnableButtonById("#SendCancel");
			}
		} else {
			console.error("Parent window is not available.");
			EnableButtonById("#skipit");
			EnableButtonById("#diffContact");
			EnableButtonById("#sendEmail");
			EnableButtonById("#SendCancel");
		}
	});


	$('#priority').on('change', function () {
		checkMessageObjectFields();
	});
	$('#trace-type').on('change', function () {
		checkMessageObjectFields();
	});

	$('#sendEmail').on('click', () => {
		DisableButtonById("#skipit");
		DisableButtonById("#diffContact");
		DisableButtonById("#sendEmail");
		DisableButtonById("#SendCancel");
		let loader = $("#sendEmailLoader");
		const emailid = $('#EmailId').val();
		window.opener.fetchMimeContentOfAllEmail(emailid,loader).then((EmailMIMEContent) => {
			// set the parameters related to the attachement name and content by convert string to Base64
			messageObject.attachment = messageObject.subject + ".eml";
			messageObject.attachmentcontent = stringToutf8ToBase64(EmailMIMEContent);
			messageObject.priorityid = $("#priority").val();
			messageObject.typeid = $("#trace-type").val();
			console.log(messageObject);
			if (window.opener && !window.opener.closed) {
				if (typeof window.opener.setCategoryToEmail === 'function') {
					SendTheEmail();
				} else {
					console.error("Parent window method setCategoryToEmail is not defined.");
				}
			} else {
				console.error("Parent window is not available.");
			}
		}).catch((error) => {
			console.error("Error fetching MIME content:", error);
			createDialog("Something went wrong while fetching the MIME content of email from Outlook API. Please try again.", function() {
				EnableButtonById("#skipit");
				EnableButtonById("#diffContact");
				EnableButtonById("#sendEmail");
				EnableButtonById("#SendCancel");
			});
		})
	});

	$('#loader').hide();
	$("#searchContacts").click(function () {
		if ($('#name').val().replace(/\s+/g, '').length < 3 && $('#company').val().replace(/\s+/g, '').length < 3) {
			$('#NameCompanyErrorMsg').removeClass('hidden');
		} else {
			$('#NameCompanyErrorMsg').addClass('hidden');
			GetSearchedResult();
		}
	});


	$('#SyncOk').on('click', function () {
		currentSelectedData = getSelectedRowsData();
		console.log("Selected Rows Data:-  ");
		console.log(currentSelectedData);
		if (Array.isArray(currentSelectedData) && currentSelectedData.length > 0) {
			ProcessSelectedData(currentSelectedData);
		}
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
		$('#messageDiv').text('');
	});
	$('#showGrid1').on('click', function () {
		$('#box1').addClass('active');
		$('#box2').removeClass('active');
		$('#showGrid1').addClass('active');
		$('#showGrid2').removeClass('active');
		messageObject.groupid = "";
		messageObject.acctid = "";
		messageObject.contactid = "";
		DisableButtonById("#selectBtn");
		$('#searchTable tbody tr').removeClass('selected');
	});

	$('#showGrid2').on('click', function () {
		$('#box1').removeClass('active');
		$('#box2').addClass('active');
		$('#showGrid1').removeClass('active');
		$('#showGrid2').addClass('active');
		messageObject.groupid = "";
		messageObject.acctid = "";
		messageObject.contactid = "";
		DisableButtonById("#selectBtn");
		$('#contactTable tbody tr').removeClass('selected');
	});

	$('#showGrid3').on('click', function () {
		$('#SyncBox1').addClass('active');
		$('#SyncBox2').removeClass('active');
		$('#showGrid3').addClass('active');
		$('#showGrid4').removeClass('active');
	});

	$('#showGrid4').on('click', function () {
		$('#SyncBox1').removeClass('active');
		$('#SyncBox2').addClass('active');
		$('#showGrid3').removeClass('active');
		$('#showGrid4').addClass('active');
	});
});

function ProcessSelectedData(data) {
	messageObject.IsInboxTab = data[0].isInbox;
	console.log("Process method called:-- ");
	const count = currentSelectedData.length + index - 1;
	const resval = localStorage.getItem("crm");
	let settings = {};
	if (resval != null) {
		settings = decodeFromBase64(resval);
	}
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
			outboundPrt.value = settings.outboundPriority;
			outboundDD.value = settings.outboundTraceType;
	
		}
	}
	index++;
	console.log("applying the value here:-----------------------");
	console.log(data);
	$('#syncEmailUI').hide();
	$('#sendEmailUI').show();
	if (data[0].isInbox) {
		$('.headings h5:nth-child(1)').text('From: ' + data[0].fromEmail);
	} else {
		$('.headings h5:nth-child(1)').text('To: ' + data[0].fromEmail);
	}
	$('.headings h5:nth-child(2)').text('Subject: ' + data[0].subject);
	
	let sentOrReceivedText = data[0].isInbox ? 'Received: ' : 'Sent: ';
	$('#received').text(sentOrReceivedText + new Date(data[0].receivedDate).toLocaleString());

	$('#EmailId').val(data[0].id);
	messageObject.body = data[0].body;
	messageObject.subject = data[0].subject;
	messageObject.duedate = new Date(data[0].receivedDate).toLocaleDateString('en-US');
	GetMatchingDataForSync(data[0].fromEmail, messageObject.userid);
}

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
			const date = row.cells[5].textContent;
			const body = row.cells[4].textContent;

			// Create an object with the row data
			const rowData = {
				id: checkboxValue,
				fromEmail: email,
				subject: subject,
				receivedDate: new Date(date).toLocaleDateString('en-US'),
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

function populateTable(contactList) {
	if (!Array.isArray(contactList)) {
		console.log('contactList is not an array');
		return; // Exit the function
	}
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
	// Checking if each optional field exists and is not null, otherwise assign an empty string or default value
	messageObject.duedate = messageObject.duedate || '';
	messageObject.subject = messageObject.subject || '';
	messageObject.body = messageObject.body || '';
	messageObject.attachment = messageObject.attachment || '';
	messageObject.attachmentcontent = messageObject.attachmentcontent || '';
	messageObject.tblid = messageObject.tblid || '';
	messageObject.recid = messageObject.recid || '';
	messageObject.relflds = messageObject.relflds || '';
	messageObject.relfldvals = messageObject.relfldvals || '';
	messageObject.acctID = messageObject.acctID || 0;

	return messageObject;
}

function SendTheEmail() {
	const id = $('#EmailId').val();
	messageObject = validateMessageObject(messageObject);
	
	//replace '<' and '>' with '&lt;' and '&gt;' 
	let mailSubject = messageObject.subject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/&nbsp;/g, " "); 
	let mailBody = messageObject.body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/&nbsp;/g, " ");
	messageObject.attachment = messageObject.attachment.replace(/[^\w-_\x2E]+/g, "-");
	let allDropdownList = $('#dropDownFieldAsPerGroup select');

	allDropdownList.each(function() {
		const id = $(this).attr('id');
		const value = String($(this).val());
		
		if (value != 0) {
			// Create an object and push it to the array
			listOfRelfIdvalsDynamicObj[id] = value;
		}

	});
	
	messageObject.relfldvals = JSON.stringify(listOfRelfIdvalsDynamicObj);
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
						  <subject>` + mailSubject + `</subject>
						  <body>` + mailBody + `</body>
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
			console.log(response)
			window.opener.setCategoryToEmail(id, true).then(() => {
				let getMatchesReturn = response.getElementsByTagName("sendEmailReturn");
				const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
				$("#sendEmailLoader").hide();
				createDialog("Email sent with trace id: " + parseInt(decodedString), function() {
					removeFirstItem(currentSelectedData);
					// count the number of sent email to CRM
					if (EmailSyncCompletedDialogObj.isSyncEmail){
						if (messageObject.IsInboxTab)
							EmailSyncCompletedDialogObj.NumberOfInboundEmails = EmailSyncCompletedDialogObj.NumberOfInboundEmails + 1;
						else
							EmailSyncCompletedDialogObj.NumberOfOutboundEmails = EmailSyncCompletedDialogObj.NumberOfOutboundEmails + 1;
					}
					if (currentSelectedData && currentSelectedData.length > 0){
						ProcessSelectedData(currentSelectedData);
						EnableButtonById("#skipit");
						EnableButtonById("#diffContact");
						EnableButtonById("#sendEmail");
						EnableButtonById("#SendCancel");
						checkMessageObjectFields(messageObject);
					}
					else
						CloseAll();
				});
			}).catch(() => {
				EnableButtonById("#skipit");
				EnableButtonById("#diffContact");
				EnableButtonById("#sendEmail");
				EnableButtonById("#SendCancel");
			});			
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			let errorMessage = "";
			if (jqXHR.responseText.includes('faultstring')) {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(jqXHR.responseText, "application/xml");
	
				let getErrorSting = xmlDoc.getElementsByTagName("faultstring")[0].innerHTML;
				console.log(getErrorSting);
	
				const bracketMatch = getErrorSting.match(/\[(.*?)\]/);
				console.log("bracketMatch",bracketMatch)
				if (bracketMatch) {
					const extractedString = bracketMatch[1]; 
					console.log("bracketMatch",extractedString);
					// Further extract the relevant message after the colon
					const messageMatch = extractedString.match(/:\s*(.*)/);
					if (messageMatch) {
						errorMessage = messageMatch[1].trim(); // Get the message after the colon
						console.log("errorMessage",errorMessage);
					}
				} else if (getErrorSting.includes(':')) {
					errorMessage = getErrorSting;
				}
			} else {
				errorMessage = errorThrown;
			}
		
			// Log the response text for debugging
			$("#sendEmailLoader").hide();
			createDialog("Simpleview API error: " + errorMessage, function() {
				removeFirstItem(currentSelectedData);
				if (currentSelectedData && currentSelectedData.length > 0){
					ProcessSelectedData(currentSelectedData);
					EnableButtonById("#skipit");
					EnableButtonById("#diffContact");
					EnableButtonById("#sendEmail");
					EnableButtonById("#SendCancel");
				}
				else
					CloseAll();
			});
		});

}

function CloseAll() {
	if (window.opener && !window.opener.closed) {
		if (typeof window.opener.CloseTheTaskPane === 'function') {
			if (EmailSyncCompletedDialogObj.isSyncEmail) {
				let dataObj = {
					Popuptoshow:"EmailSyncCompletedDialog", 
					InboundEmails:EmailSyncCompletedDialogObj.NumberOfInboundEmails, 
					OutboundEmails:EmailSyncCompletedDialogObj.NumberOfOutboundEmails,
					IsCloseTaskPanel:true
				}
				window.opener.showOutlookPopup(dataObj,35,30);
				window.close();
			} else {
				window.close();
				window.opener.CloseTheTaskPane();
			}
		} else {
			console.error("Parent window method setCategoryToEmail is not defined.");
		}
	} else {
		console.error("Parent window is not available.");
	}
}

function checkMessageObjectFields() {
	messageObject.priorityid = $("#priority").val();
	messageObject.typeid = $("#trace-type").val();

	// Initialize arrays for missing required fields
	let requiredFields = ['groupid', 'userid', 'contactid', 'priorityid', 'typeid'];

	let missingRequired = [];

	// Function to check if the value is null or empty
	function isNullOrEmpty(value) {
		return value === null || value === '';
	}

	// Check required fields
	requiredFields.forEach(function (field) {
		if (isNullOrEmpty(messageObject[field]) || messageObject[field] == 0) {
			let requiredFieldName = field.replace(/id$/i, '').toUpperCase();
			if (requiredFieldName === 'TYPE') missingRequired.push('TRACE TYPE');
			else missingRequired.push(requiredFieldName);
		}
	});

	// Display message in a div using jQuery
	if (missingRequired.length > 0) {
		const requiredMessage = missingRequired.length === 1
			? `Required field ${missingRequired[0]} is missing for this contact.`
			: `Required fields ${missingRequired.join(', ')} are missing for this contact.`;

		$('#messageDiv').text(requiredMessage);
		DisableButtonById("#sendEmail");
	} else {
		EnableButtonById("#sendEmail");
		$('#messageDiv').text("");
	}

}

function GetAttachedToDDInfo() {
	$("#sendEmailLoader").show();
	DisableButtonById("#sendEmail");

	//loading trace-type and priority dropdown data
	const resval = localStorage.getItem("crm");
	let crmsettings = {};
	if (resval != null) {
		crmsettings = decodeFromBase64(resval);
		if (messageObject.IsInboxTab) {
			GetTaskTypes(crmsettings.inboundTraceType); 
			GetPriorityType(crmsettings.inboundPriority);
		} else {
			GetTaskTypes(crmsettings.outboundTraceType); 
			GetPriorityType(crmsettings.outboundPriority);
		}		
	}

	//loading rels dropdown data
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
			// Extract the inner XML string
			let getMatchesReturn = response.getElementsByTagName("getRelOptsReturn");
			const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
			const parser = new DOMParser();
			const xml = parser.parseFromString(decodedString, "text/xml");
			const jsonRelOpt = parseXmlToJson(xml);
			bindDropDownsDataToSelect(jsonRelOpt);
			$("#sendEmailLoader").hide();
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			$("#sendEmailLoader").hide();
			console.error('Error:', textStatus, errorThrown);
		});

}

function parseXmlToJson(xml) {
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
				obj[nodeName] = parseXmlToJson(item);
			} else {
				if (typeof obj[nodeName].push === "undefined") {
					const old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(parseXmlToJson(item));
			}
		}
	}
	return obj;
}

function bindDropDownsDataToSelect(jsonData) {
	let parentfieldSetElement = document.getElementById('dropDownFieldAsPerGroup');
	parentfieldSetElement.innerHTML = '';
	
	if (Array.isArray(jsonData.opts.rels.rel)){
		for (let currRel of jsonData.opts.rels.rel){
			let containerDiv = AddDropDownToFieldSetAsPerRelsList(currRel,jsonData.opts.rels.rel);
			parentfieldSetElement.appendChild(containerDiv);
		}
	} else {
		if (jsonData.opts.rels.rel) {
			let containerDiv = AddDropDownToFieldSetAsPerRelsList(jsonData.opts.rels.rel,jsonData.opts.rels.rel);
			parentfieldSetElement.appendChild(containerDiv);
		}
	}

	// Bind messageObject properties
	if (jsonData.opts.tblid && jsonData.opts.tblid["#text"]) {
		messageObject.tblid = jsonData.opts.tblid["#text"];
	}
	if (jsonData.opts.recid && jsonData.opts.recid["#text"]) {
		messageObject.recid = jsonData.opts.recid["#text"];
	}
	if (jsonData.opts.relflds && jsonData.opts.relflds["#text"]) {
		messageObject.relflds = jsonData.opts.relflds["#text"];
	}
	if (jsonData.opts.hiddenrel && jsonData.opts.hiddenrel["#text"] && jsonData.opts.hiddenrelval && jsonData.opts.hiddenrelval["#text"]) {
		listOfRelfIdvalsDynamicObj[jsonData.opts.hiddenrel["#text"]] = String(jsonData.opts.hiddenrelval["#text"]);
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

			// Parse the decoded inner XML string
			const innerXmlDoc = parser.parseFromString(decodedString, "text/xml");
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
			inboundPrt.innerHTML = '';
			addNoneOptionToDropDown(inboundPrt);

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
			// when the value of dropdown change from JS then on-change event will not trigger 
			checkMessageObjectFields(messageObject);
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
						  <groupid>` + messageObject.groupid + `</groupid>
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
			// Parse the decoded inner XML string
			const innerXmlDoc = parser.parseFromString(decodedString, "text/xml");
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
			inboundDD.innerHTML = '';			
			addNoneOptionToDropDown(inboundDD);
			
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

			// when the value of dropdown change from JS then on-change event will not trigger 
			checkMessageObjectFields(messageObject);
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
			// Parse the decoded inner XML string
			const innerXmlDoc = parser.parseFromString(decodedString, "text/xml");

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

		if ($(this).hasClass('selected')) {
			$(this).removeClass('selected');
			messageObject.groupid = "";
			messageObject.acctid = "";
			messageObject.contactid = "";
			DisableButtonById("#selectBtn");
			return;
		}
		
		$('#searchTable tbody tr').removeClass('selected');
		$(this).addClass('selected');
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
		$('#companyLbl').text(rowData["Account/Event"] || 'N/A');
		$('#contactLbl').text(rowData["Contact Name"]);

		// Log the row data to the console
		console.log(rowData);
		if (rowData) {
			EnableButtonById("#selectBtn");
		}
		messageObject.groupid = rowData["GroupId"];
		messageObject.acctid = rowData["ActId"];
		messageObject.contactid = rowData["ContId"];
	});
}

function BindRowSelectFunction() {
	$('#contactTable tbody tr').on('click', function () {
		if ($(this).find('td').first().text().trim().toLowerCase() === "no data found") {
			return;
		}
		if ($(this).hasClass('selected')) {
			$(this).removeClass('selected');
			messageObject.groupid = "";
			messageObject.acctid = "";
			messageObject.contactid = "";
			DisableButtonById("#selectBtn");
			return;
		}
		
		$('#contactTable tbody tr').removeClass('selected');
		$(this).addClass('selected');
		// Collect data from the selected row
		let rowData = {};
		const headers = $('#contactTable th');

		$(this).find('td').each(function (index) {
			const key = $(headers[index]).text().trim();
			const value = $(this).text();
			rowData[key] = value;
		});
		$('#groupLbl').text(rowData.Group);
		$('#companyLbl').text(rowData["Account/Event"] || 'N/A');
		$('#contactLbl').text(rowData["Contact Name"]);

		// Log the row data to the console
		console.log(rowData);
		if (rowData) {
			EnableButtonById("#selectBtn");
		}
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
			const innerXmlDoc = parser.parseFromString(decodedString, "text/xml");
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
			// Parse the decoded inner XML string
			const innerXmlDoc = parser.parseFromString(decodedString, "text/xml");
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

function AddChooseAboveItemFirstDDOption(dropdown){
	dropdown.disabled = true;
	dropdown.innerHTML = '';
	let option = document.createElement("option");
	option.value = 0;
	option.text = "--Choose Above Item First--";
	dropdown.appendChild(option);
	//set the default value of lead dropdown
	dropdown.value = 0;
}

function AddDropDownToFieldSetAsPerRelsList(currRel,allRels){
	let containerDiv = document.createElement('div');
	containerDiv.classList.add('input-container');
	let currDropDownLabel = document.createElement('label');
	currDropDownLabel.textContent = currRel.title["#text"] + ' :';
	let currDropDown = document.createElement('select');

	currDropDown.id = currRel.fldname["#text"];
	// if 'currRel.child["#text"]' contain any value that mean current rel is parent of other rel. 
	if (currRel.child["#text"]) {
		parentRelIdtoChildRelVal[currRel.fldname["#text"]] = findRelByfldname(allRels,currRel.child["#text"]);
	}

	if (currRel.parent["#text"] && currRel.parent["#text"] == 1) {
		$(currDropDown).change(function() {
			FilterChildRelOptOnChangeParentDD(currDropDown.id);
		});
	}

	// if 'currRel.hidden["#text"]' contain any value that mean current rel is a child rel. 
	if (currRel.hidden["#text"] == 1) {
		AddChooseAboveItemFirstDDOption(currDropDown);
	} else {
		addNoneOptionToDropDown(currDropDown);

		if (Array.isArray(currRel.data.row)){
			currRel.data.row.forEach(row => {
				if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
					const option = document.createElement("option");
					option.value = row.ID["#text"];
					option.textContent = row.DISPLAY["#text"];
					currDropDown.appendChild(option);
				}
			});
		} else {
			const row = currRel.data.row;
			if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"]) {
				const option = document.createElement("option");
				option.value = row.ID["#text"];
				option.textContent = row.DISPLAY["#text"];
				currDropDown.appendChild(option);
			}
		}
	}
	containerDiv.appendChild(currDropDownLabel);
	containerDiv.appendChild(currDropDown);

	return containerDiv;
}

function findRelByfldname(rels, fldname) {
	if (Array.isArray(rels)) {
		return rels.find(rel => rel.fldname["#text"] === fldname);
	} else if (rels && typeof rels === 'object') {
		const relArray = [rels];
		return relArray.find(rel => rel.fldname["#text"] === fldname);
	} else {
		console.error(`Invalid data structure: rels is not an array or object for fldname: ${fldname}`);
		return null;
	}
}

function stringToutf8ToBase64(content) {
	//This method first encode string content to UTF* then encode it to Base64.
	// Because UTF-8 encoding ensures that all characters, including non-ASCII and special symbols, are properly represented. 
	// Use TextEncoder to convert the string to UTF-8
	const encoder = new TextEncoder();
	const uint8Array = encoder.encode(content);
	
	// Convert the byte array to Base64
	let arr = '';
	for (let i = 0; i < uint8Array.length; i++) {
		arr += String.fromCharCode(uint8Array[i]);
	}
	console.log("typeof arr : ",typeof arr)
	return btoa(arr); 
}

function FilterChildRelOptOnChangeParentDD(dropdownID){
	let parentDropDownvalue = document.getElementById(dropdownID).value;
	let childRel = parentRelIdtoChildRelVal[dropdownID];
	const hiddenSelect = document.getElementById(childRel.fldname["#text"]);
	if (parentDropDownvalue == 0) {
		AddChooseAboveItemFirstDDOption(hiddenSelect);
	} else {
		if (hiddenSelect) {
			hiddenSelect.disabled = false;
			hiddenSelect.innerHTML = '';
			addNoneOptionToDropDown(hiddenSelect);
			
			if (childRel) {
				if (Array.isArray(childRel.data.row)) {
					childRel.data.row.forEach(row => {
						if (row && row.ID && row.ID["#text"] && row.DISPLAY && row.DISPLAY["#text"] && parentDropDownvalue == row.PARENTID["#text"]) {
							const option = document.createElement("option");
							option.value = row.ID["#text"];
							option.text = row.DISPLAY["#text"];
							hiddenSelect.appendChild(option);
						}
					});
				} else {
					let ddValue = childRel.data.row;
					if (ddValue && ddValue.ID && ddValue.ID["#text"] && ddValue.DISPLAY && ddValue.DISPLAY["#text"] && parentDropDownvalue == ddValue.PARENTID["#text"]) {
						const option = document.createElement("option");
						option.value = ddValue.ID["#text"];
						option.text = ddValue.DISPLAY["#text"];
						hiddenSelect.appendChild(option);
					}
				}
			}
		}
	}

	if (childRel.child["#text"]) {
		FilterChildRelOptOnChangeParentDD(childRel.fldname["#text"]);
	}
}

function toggleSelectAllButton() {
	let buttonId = $('#showGrid3').hasClass('active') ? '#selectAllInbox' : '#selectAllSentBox';

	const targetTable = $(buttonId).data('target');
	const rowCount = $(targetTable).find('tbody tr').length;
	const selectedCount = $(targetTable).find('input[type="checkbox"]:checked').length;
	if (rowCount === selectedCount) {
		DisableButtonById(buttonId);
	} else {
		EnableButtonById(buttonId);
	}
}

function toggleClearAllButton() {
	let buttonId = $('#showGrid3').hasClass('active') ? '#ClearAllInbox' : '#ClearAllSentBox';	
	const targetTable = $(buttonId).data('target');
	const selectedCount = $(targetTable).find('tbody tr input[type="checkbox"]:checked').length;
	if (selectedCount <= 0) {
		DisableButtonById(buttonId);
	} else {
		EnableButtonById(buttonId);
	}
}

function toggleSyncButton(event) {
    const inboxCheckboxes = document.querySelectorAll('#inboxTable .row-checkbox:checked');
    const sentBoxCheckboxes = document.querySelectorAll('#sentBoxTable .row-checkbox:checked');
    
    // Enable button if there are any selected checkboxes
    if (inboxCheckboxes.length > 0 || sentBoxCheckboxes.length > 0) {
        EnableButtonById('#SyncOk');
    } else {
        DisableButtonById('#SyncOk');
    }
	// Handle row selection and deselection
	if (event) {
		toggleSelectAllButton();
		toggleClearAllButton();
		const row = event.target.closest('tr'); 
		if (event.target.checked) {
			row.classList.add('selected');
		} else {
			row.classList.remove('selected');
		}
	}
}

function AddOnRowSelectListener(selector) {
    document.querySelectorAll(selector).forEach(checkbox => {
        checkbox.addEventListener('change',toggleSyncButton)
    });
}