function GetDataFromLocalStorage() {
    var resval = localStorage.getItem("CRM");
    var data = {};
    if (resval != null) {
        data = decodeFromBase64(resval);
        if (data.crmUrl == 'https://demo.simpleviewcrm.com')
            window.ApiUrl = 'http://localhost:4000';
    }
    return data;
}

window.GetDataFromLocalStorage = GetDataFromLocalStorage;
