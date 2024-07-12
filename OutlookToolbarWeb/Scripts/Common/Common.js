function GetDataFromLocalStorage() {
    var resval = localStorage.getItem("CRM");
    var data = {};
    if (resval != null) {
        data = decodeFromBase64(resval);
        var url = data.crmUrl;
       
        if (window.location.hostname.toLowerCase().indexOf('localhost') > -1 ||
            window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {

            if (url === "https://demo.simpleviewcrm.com") {
                if (window.location.hostname.toLowerCase().indexOf('localhost') > -1) {
                    window.ApiUrl = "http://localhost:4000";
                } else if (window.location.hostname.toLowerCase().indexOf('.vdev') > -1) {
                    window.ApiUrl = "https://271f-13-84-216-53.ngrok-free.app";
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
