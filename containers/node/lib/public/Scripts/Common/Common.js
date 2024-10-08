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
		alert("Url " + url + " not valid");
	}
	alert("configuration data not found");
	return;
}


function ValidateCRMUrl(url) {
	if (url.endsWith(".simpleviewcrm.com")) {
		return true;
	} else {
		alert("Url " + url + " not valid");
		return false;
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


window.GetDataFromLocalStorage = GetDataFromLocalStorage;
