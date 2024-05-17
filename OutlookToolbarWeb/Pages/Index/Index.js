'use strict';
window.selectedEmailData = [];
(function () {
    Office.onReady(function (info) {
        if (info.host === Office.HostType.Outlook) {
            console.log("Office is ready");
            $(document).ready(function () {
                console.log("Document is ready");
                loadItemProps(Office.context.mailbox.item);
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
        popup.onload = function () {
            popup.window.selectedEmailData = popup.opener.selectedEmailData;
        }
    }

    Office.onReady(info => {
        if (info.host === Office.HostType.Outlook) {
            document.getElementById("sync-email-btn").onclick = run;
            // Register an event handler to identify when messages are selected.
            Office.context.mailbox.addHandlerAsync(Office.EventType.SelectedItemsChanged, () => {
                run();
            });
        }
    });

    function run() {
        // Retrieve the subject line of the selected messages and store it in a variable.
        Office.context.mailbox.getSelectedItemsAsync(asyncResult => {
            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                console.error("Error getting selected items: " + asyncResult.error.message);
                return;
            }
            const selectedItems = asyncResult.value;
            window.selectedEmailData = selectedItems;
        });
    }

})();
