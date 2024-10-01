/* global decodeFromBase64 */
function GetDataFromLocalStorage() {
	let resval = localStorage.getItem("CRM");
	let data = {};
	if (resval != null) {
		data = decodeFromBase64(resval);
		const url = data.crmUrl;

		if (window.location.hostname.toLowerCase().indexOf('localhost') > -1 ||
			window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {

			if (url === "https://demo.simpleviewcrm.com") {
				if (window.location.hostname.toLowerCase().indexOf('localhost') > -1) {
					window.ApiUrl = "http://localhost:4000/api";
				} else if (window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {
					window.ApiUrl = "https://c219-13-84-216-53.ngrok-free.app/api";
				}
			} else {
				alert("Url not valid");
				return;
			}

		} else {
			if (url.endsWith(".simpleviewcrm.com")) {
				window.ApiUrl = url;
			} else {
				alert("Url not valid");
				return;
			}
		}

	}
	return data;
}

function GetCrmUrlFromLocalStorage() {
	let resval = localStorage.getItem("CRM");
	let data = {};
	if (resval != null) {
		data = decodeFromBase64(resval);
		let url = data.crmUrl;

		if (url.endsWith('/')) {
			url = url.slice(0, -1);
		}

		if (url.endsWith(".simpleviewcrm.com")) {
			return url;
		}
	}
	alert("Url " + url + " not valid");
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
	return '/submit/?apiUrl='+url;
}


window.GetDataFromLocalStorage = GetDataFromLocalStorage;
