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

window.GetDataFromLocalStorage = GetDataFromLocalStorage;
