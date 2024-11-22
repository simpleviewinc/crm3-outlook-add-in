/* global decodeFromBase64 */
function GetDataFromLocalStorage() {
	//this function also set the window.ApiUrl, which was not ideal.
	//I'd like to replace this with 3 fuctions:
	// GetDataFromLocalStorage() which gets the data object from localStorage and does not set the ApiUrl
	// GetCrmUrlFromLocalStorage() which uses GetDataFromLocalStorage() to get the data object, and then fetches and returns the CRM url (not the API URL) if it's valid
	// GetProxyUrl(url) which takes the CRM url as a parameter and returns the API URL, using a proxy when needed.
	// GetProxyUrlLocalStorage() which first calls GetCrmUrlFromLocalStorage() and then GetProxyUrl(url)
	//since this was used in multiple places, I also added GetDataFromLocalStorageAndSetApiUrlGlobal() to replace it's original functionality.
	let resval = localStorage.getItem("crm");
	let data = null;
	if (resval != null) {
		data = decodeFromBase64(resval);
		//const url = data.crmUrl;

		//if (window.location.hostname.toLowerCase().indexOf('localhost') > -1 ||
		//	window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {

		//	if (url === "https://demo.simpleviewcrm.com") {
		//		if (window.location.hostname.toLowerCase().indexOf('localhost') > -1) {
		//			window.ApiUrl = "http://localhost:4000/api";
		//		} else if (window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {
		//			window.ApiUrl = "https://c219-13-84-216-53.ngrok-free.app/api";
		//		}
		//	} else {
		//		alert("Url not valid");
		//		return;
		//	}

		//} else {
		//	if (url.endsWith(".simpleviewcrm.com")) {
		//		window.ApiUrl = url;
		//	} else {
		//		alert("Url not valid");
		//		return;
		//	}
		//}

	}
	return data;
}

function GetDataFromLocalStorageAndSetApiUrlGlobal() {
	const data = GetDataFromLocalStorage();
	if (data != null) {
		const url = data.crmUrl;
		if (ValidateCRMUrl(url)) {
			window.ApiUrl = GetProxyUrl(url);
		}
	}
	return data;
}

function GetCrmUrlFromLocalStorage() {
	//this could be simplified to use GetDataFromLocalStorage() if it wasn't also
	//setting window.ApiUrl, which it shouldn't be.  that should be moved to indepdent function calls
	//let resval = localStorage.getItem("crm");
	let data = GetDataFromLocalStorage();
	if (data != null) {

		let url = data.crmUrl;

		if (url.endsWith('/')) {
			url = url.slice(0, -1);
		}

		if (url.endsWith(".simpleviewcrm.com")) {
			return url;
		}
		createDialog("Url " + url + " not valid",function() {});
	} else {
		createDialog("configuration data not found",function() {});
	}
}


function ValidateCRMUrl(url) {
	if (url.endsWith(".simpleviewcrm.com")) {
		return true;
	} else {
		createDialog("Url " + url + " not valid.", function() {});
	}
}


function GetProxyUrl(url) {
	//if (window.location.hostname.toLowerCase().indexOf('localhost') > -1 ||
	//	window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {

	//	if (url === "https://demo.simpleviewcrm.com") {
	//		if (window.location.hostname.toLowerCase().indexOf('localhost') > -1) {
	//			url = "http://localhost:4000/api";
	//		} else if (window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {
	//			url = "https://c219-13-84-216-53.ngrok-free.app/api";
	//		}
	//	} else {
	//		alert("Url not valid");
	//		url = '';
	//	}

	//} else {
	//	if (url.endsWith(".simpleviewcrm.com")) {
	//		return url; // use the actual url provided by user
	//	} else {
	//		alert("Url not valid");
	//		url = '';
	//	}
	//}
	return '/submit/?apiUrl=' + url;
}

function GetProxyUrlLocalStorage() {
	return GetProxyUrl(GetCrmUrlFromLocalStorage());
}

function addNoneOptionToDropDown(element){
	//added none option
	let option = document.createElement("option");
	option.value = 0;
	option.text = "--None--";
	element.appendChild(option);
	//set the default value of lead dropdown
	element.value = 0;
}

function createDialog(msg, callbackFunction) {
	// Create the backdrop overlay (background dimming)
	const overlay = document.createElement('div');
	overlay.style.position = 'fixed';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.width = '100vw';
	overlay.style.height = '100vh';
	overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
	overlay.style.zIndex = '999'; // Ensure it's behind the dialog but above the body content
	
	// Create the dialog container
	const dialog = document.createElement('div');
	dialog.style.position = 'fixed';
	dialog.style.width = '30vw';
	dialog.style.top = '50%';
	dialog.style.left = '50%';
	dialog.style.transform = 'translate(-50%, -50%)';
	dialog.style.padding = '20px';
	dialog.style.backgroundColor = 'white';
	dialog.style.boxShadow = '0 14px 18px rgba(0,0,0,0.3)';
	dialog.style.zIndex = '1000';
	dialog.style.borderRadius = '8px';
	
	// Create the message paragraph
	const message = document.createElement('p');
	message.style.fontSize = '16px';
	message.style.overflowWrap = 'break-word';
	message.textContent = msg;
	
	// Create the OK button
	const okButton = document.createElement('button');
	okButton.style.padding = '10px 20px';
	okButton.style.marginTop = '15px';
	okButton.style.backgroundColor = '#4CAF50';
	okButton.style.color = 'white';
	okButton.style.border = 'none';
	okButton.style.borderRadius = '5px';
	okButton.style.cursor = 'pointer';
	okButton.textContent = 'OK';
	okButton.style.float = 'right';
	
	// Append the message, and OK button to the dialog
	dialog.appendChild(message);
	dialog.appendChild(okButton);
	
	// Append the overlay and dialog to the body
	document.body.appendChild(overlay);
	document.body.appendChild(dialog);
	
	okButton.focus();
	
	// Add click event to OK button to remove the dialog
	okButton.addEventListener('click', () => {
		document.body.removeChild(dialog);
		document.body.removeChild(overlay);  // Remove the overlay as well
		callbackFunction();
	});
}
  
  

window.GetDataFromLocalStorage = GetDataFromLocalStorage;
window.addNoneOptionToDropDown = addNoneOptionToDropDown;
window.createDialog = createDialog;
