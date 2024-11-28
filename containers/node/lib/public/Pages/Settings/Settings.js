let ApiUrl = '',
	UserId = '';

$(document).ready(function () {
	let resval = localStorage.getItem("crm");
	let data = {};
	if (resval != null) {
		$('#saveUpdateSettings').text("Update");
		data = decodeFromBase64(resval);
		console.log(data);
		if (data != null) {
			if (data.userId != null && data.userId != undefined && data.userId != '') {
				$('#emailSettings').show();
				$('#LoginSubmitBtn').hide();
				$('#logout').show();
				$("#settingLoader").hide();
				UserId = data.userId;
				ApiUrl = GetProxyUrl(data.crmUrl);
				GetTaskTypes(); GetPriorityType();
			}
			else {
				$('#emailSettings').hide();
				$('#logout').hide();
				console.log("logout hide");
			}
			$('#crm-login').val(data.crmLogin);
			$('#crm-url').val(data.crmUrl);
			$('#sent-flag-color').val(data.sentFlagColor);
			$('#skip-flag-color').val(data.skipFlagColor);
			$('#days-to-sync').val(data.daysToSync);
		}
	}
	else {
		$('#emailSettings').hide();
		$('#logout').hide();
		$("#settingLoader").hide();
		$('#saveUpdateSettings').text("Save");
	}	

	function GetUserIdByLogin(crmUrl, email, password) {
		if (crmUrl.endsWith('/')) {
			crmUrl = crmUrl.slice(0, -1);
		}
		if (!ValidateCRMUrl(crmUrl)) return;
		//url = SetProxyUrl(url);
		//if (url == '')
		//	return;
		password = password.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
		
		$("#settingLoader").show();
		const settings = {
			url: GetProxyUrl(crmUrl),
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
						  <email>` + email + `</email>
						  <password>` + password + `</password>
						  <version></version>
						</checkLogin>
					  </soap:Body>
					</soap:Envelope>`
		};

		$.ajax(settings)
			.done(function (response) {
				//console.log(response);
				// const parser = new DOMParser();
				//const xmlDoc = parser.parseFromString(response, "application/xml");
				
				let getMatchesReturn = response.getElementsByTagName("checkLoginReturn");
				//console.log(getMatchesReturn);
				const decodedString = htmlToString(getMatchesReturn[0].innerHTML);
				//console.log(decodedString);
				if (decodedString == '-1.0') {
					$("#settingLoader").hide();
					createDialog("Credentials not valid.", function() {});
				}
				else {
					$("#settingLoader").hide();
					createDialog("Login successful.", function() {
						UserId = parseInt(decodedString);
						$('#emailSettings').show();
						$('#LoginSubmitBtn').hide();
						$('#logout').show();
						ApiUrl = GetProxyUrl(crmUrl);
						GetTaskTypes();
						GetPriorityType();
					});
				}
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				$("#settingLoader").hide();
				createDialog("Url or credentials not valid.", function() {console.error('Error:', textStatus, errorThrown);});
			});
	}

	function GetPriorityType() {
		const settings = {
			url: ApiUrl, //API URL saved as the is the CRM URL formatted through the GetProxyUrl function already
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
				console.log("priorityList");
				console.log(priorityList);
				const inboundPrt = document.getElementById('inbound-priority');
				const outboundPrt = document.getElementById('outbound-priority');
				//adding none option to Dropdown
				addNoneOptionToDropDown(inboundPrt)
				addNoneOptionToDropDown(outboundPrt)
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

				$('#inbound-priority').val(data.inboundPriority || 0);
				$('#outbound-priority').val(data.outboundPriority || 0);
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				console.error('Error:', textStatus, errorThrown);
			});

	}

	function GetTaskTypes() {
		const settings = {
			url: ApiUrl, //API URL saved as the is the CRM URL formatted through the GetProxyUrl function already
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
				console.log("Hello");
				console.log(typeList);
				const inboundDD = document.getElementById('inbound-trace-type');
				const outboundDD = document.getElementById('outbound-trace-type');
				//adding none option to Dropdown
				addNoneOptionToDropDown(inboundDD)
				addNoneOptionToDropDown(outboundDD)
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

				$('#inbound-trace-type').val(data.inboundTraceType || 0);
				$('#outbound-trace-type').val(data.outboundTraceType || 0);
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

	$("#LoginSubmitBtn").click(function () {
		if (!$("#crm-url").val()) {
			createDialog("CRM URL is required.", function () {});
		} else if (!$("#crm-login").val()) {
			createDialog("Login is required.", function () {});
		} else if (!$("#crm-password").val()) {
			createDialog("Password is required.", function () {});
		} else {
			GetUserIdByLogin($("#crm-url").val(), $("#crm-login").val(), $("#crm-password").val());
		}
	});

	$("#saveUpdateSettings").click(function () {
		// Capture form data
		let url = $("#crm-url").val();
		if (url.endsWith('/')) {
			url = url.slice(0, -1);
		}
		const formData = {
			crmUrl: url,
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
		console.log('formData');
		console.log(formData);
		const formDataString = JSON.stringify(formData);
		console.log('formDataString');
		console.log(formDataString);

		const formDataEncodeString = encodeToBase64(formDataString);
		console.log('formDataEncodeString');
		console.log(formDataEncodeString);

		console.log('setting localStorage');
		localStorage.setItem("crm", formDataEncodeString);

		
		createDialog("Settings updated.", function() {
			if (window.opener && !window.opener.closed) {
				if (typeof window.opener.ReloadTaskPane === 'function') {
					console.log('window.opener.CloseTheTaskPane');
					window.opener.ReloadTaskPane(false);
					$('#saveUpdateSettings').text("Update");
					//window.close(); // Optionally close the popup after sending data
				} else {
					console.error("Parent window method setCategoryToEmail is not defined.");
				}
				if (typeof window.opener.SetLocalStorageItem === 'function') {
					console.log('window.opener.CloseTheTaskPane');
					window.opener.SetLocalStorageItem(formDataString);
					//window.close(); // Optionally close the popup after sending data
				} else {
					console.error("Parent window method SetLocalStorageItem is not defined.");
				}
	
			} else {
				console.error("Parent window is not available.");
			}
		});
	});

	$("#reset").click(function () {
		localStorage.removeItem('crm');
		createDialog("Settings removed.", function() {
			window.location.reload();
			if (window.opener && !window.opener.closed) {
				if (typeof window.opener.ReloadTaskPane === 'function') {
					console.log('window.opener.CloseTheTaskPane');
					window.opener.ReloadTaskPane(true);
					//window.close(); // Optionally close the popup after sending data
				} else {
					console.error("Parent window method setCategoryToEmail is not defined.");
				}
			} else {
				console.error("Parent window is not available.");
			}
		});
	});
});