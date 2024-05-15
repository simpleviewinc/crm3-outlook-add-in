'use strict';

(function () {
    Office.onReady(function (info) {
        // Office is ready
        if (info.host === Office.HostType.Outlook) {
            console.log("Office is ready");
            $(document).ready(function () {
                // The document is ready
                console.log("Document is ready");
                loadItemProps(Office.context.mailbox.item);
                // Attach click event handlers to the buttons
                attachClickEventHandlers();
            });
        }
    });

    function loadItemProps(item) {
        // ... existing code ...
    }

    function attachClickEventHandlers() {
        $('#send-email-btn').on('click', function () {
            openPopup('../SendEmail/SendEmail.html', 'Send Email(s) to CRM');
        });

        $('#sync-email-btn').on('click', function () {
            openPopup('../SyncEmail/SyncEmail.html', 'Synchronize Email with CRM');
        });

        $('#settings-btn').on('click', function () {
            openPopup('../Settings/Settings.html', 'Settings');
        });
    }


    function openPopup(url, title) {
        var popupWidth = 800;
        var popupHeight = 500;
        var left = (window.screen.width / 2) - (popupWidth / 2);
        var top = (window.screen.height / 2) - (popupHeight / 2);
        var popup = window.open(url, title, 'width=' + popupWidth + ', height=' + popupHeight + ', top=' + top + ', left=' + left);
    }

})();