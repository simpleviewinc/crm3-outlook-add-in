'use strict';
/* global Office, GetDataFromLocalStorageAndSetApiUrlGlobal, ApiUrl*/
const { createNestablePublicClientApplication } = msal;
window.MatchedData = {};
window.selectedEmailData = {}; // Global Variable to store the selected emails data
window.inboxEmails = {};
window.sentEmails = {};
window.ApiUrlVal = '';
window.ApiUrl = '';
window.userId = '';
window.GraphApiUrl = 'https://graph.microsoft.com/v1.0/me/messages';

console.log('loading index.js version 1.6.4');

let emailQueue = [];
let isProcessingQueue = false;
let retryDelay = 1000; // Initial delay of 1 second
let IsResetTaskPaneUICall = false;

let pca = undefined;
let GraphApiAccessToken = null;



// Retry logic with exponential backoff
function retryCategoryUpdate(emailId, isSentFlag, retryCount = 0) {
	console.log('retryCategoryUpdate');
	const MAX_RETRIES = 3;
	const INITIAL_DELAY = 1000; // Initial retry delay in milliseconds

	return new Promise((resolve, reject) => {
		if (retryCount < MAX_RETRIES) {
			const delay = Math.pow(2, retryCount) * INITIAL_DELAY;
			console.log(`Retrying after ${delay}ms (Retry ${retryCount + 1} of ${MAX_RETRIES})`);
			setTimeout(() => {
				setCategoryToEmail(emailId, isSentFlag).then(resolve).catch((error) => {
					// Retry on failure
					retryCategoryUpdate(emailId, isSentFlag, retryCount + 1).then(resolve).catch(reject);
				});
			}, delay);
		} else {
			console.error(`Max retries (${MAX_RETRIES}) exceeded. Unable to set category for email ${emailId}.`);
			reject(`Max retries exceeded for email ${emailId}`);
		}
	});
}

// Set category to email with retry logic
window.setCategoryToEmail = function (emailId, isSentFlag) {
	console.log("Set category called for email:", emailId);
	return new Promise((resolve, reject) => {
		const requestUrl = `${GraphApiUrl}/${emailId}`;

		// Determine category color based on flag
		let categoryColor = 'Yellow category'; // initialized with some valid value 
		let data = GetDataFromLocalStorageAndSetApiUrlGlobal();
		if (data != null) {
			categoryColor = isSentFlag ? data.sentFlagColor : data.skipFlagColor;
		}

		// Construct the payload to set the category
		const categoryData = {
			"Categories": [categoryColor]
		};

		// Make the PATCH request to update the email with the category
		$.ajax({
			url: requestUrl,
			type: 'PATCH',
			contentType: 'application/json',
			headers: {
				'Authorization': `Bearer ${GraphApiAccessToken}`
			},
			data: JSON.stringify(categoryData)
		}).done(function (response) {
			console.log(`Email ${emailId} category set successfully:`, response);
			resolve();
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error(`Error setting category for email ${emailId}:`, textStatus, errorThrown);
			console.error("Response text:", jqXHR.responseText);

			// Retry logic with exponential backoff
			retryCategoryUpdate(emailId, isSentFlag).then(resolve).catch(reject);
		});
	});
}

// eslint-disable-next-line no-unused-vars
function processQueue() {
	if (isProcessingQueue || emailQueue.length === 0) {
		return;
	}

	isProcessingQueue = true;
	const { emailId, isSentFlag } = emailQueue.shift();

	let categoryColor = 'Yellow category'; // initialized with some valid value 
	let data = GetDataFromLocalStorageAndSetApiUrlGlobal();
	if (data != null) {
		if (isSentFlag) {
			categoryColor = data.sentFlagColor;
		} else {
			categoryColor = data.skipFlagColor;
		}
	}


	Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
		if (result.status === "succeeded") {
			const accessToken = result.value;
			const requestUrl = Office.context.mailbox.restUrl + '/v2.0/me/messages/' + emailId;

			// Construct the payload to set the category
			let categoryData = {
				"Categories": [categoryColor]
			};

			// Function to perform AJAX request with exponential backoff
			// eslint-disable-next-line no-inner-declarations
			function fetchWithRetry(url, headers, data, retries = 5, delay = 1000) {
				return new Promise((resolve, reject) => {
					$.ajax({
						url: url,
						type: 'PATCH',
						contentType: 'application/json',
						headers: headers,
						data: data
					}).done((response) => {
						resolve(response);
					}).fail((jqXHR, textStatus, errorThrown) => {
						if ((jqXHR.status === 429 || jqXHR.status >= 500) && retries > 0) {
							setTimeout(() => {
								fetchWithRetry(url, headers, data, retries - 1, delay * 2).then(resolve).catch(reject);
							}, delay);
						} else {
							reject(jqXHR, textStatus, errorThrown);
						}
					});
				});
			}

			const headers = {
				'Authorization': 'Bearer ' + accessToken
			};

			fetchWithRetry(requestUrl, headers, JSON.stringify(categoryData))
				.then((response) => {
					console.log("Email category set successfully:", response);
					retryDelay = 1000; // Reset the retry delay on success
					isProcessingQueue = false;
					// Process the next item in the queue
					setTimeout(processQueue, 500); // Adjust the timeout as necessary
				})
				.catch((jqXHR, textStatus, errorThrown) => {
					console.error("Error setting category:", textStatus, errorThrown);
					console.error("Response text:", jqXHR.responseText);
					retryDelay = 1000; // Reset the retry delay even on failure to prevent runaway backoff
					isProcessingQueue = false;
					// Process the next item in the queue
					setTimeout(processQueue, 500); // Adjust the timeout as necessary
				});
		} else {
			console.error("Error getting callback token:", result.error.message);
			retryDelay = 1000; // Reset the retry delay even on failure to prevent runaway backoff
			console.log("retryDelay: Remove? - Variable not actually in use - ", retryDelay);
			isProcessingQueue = false;
			// Process the next item in the queue
			setTimeout(processQueue, 500); // Adjust the timeout as necessary
		}
	});
}


/* eslint-disable no-unused-vars */
let popupQueue = []; // Queue to manage popups
let isPopupOpen = false;
let settingsOk = false;
/* eslint-enable no-unused-vars */

function CheckSettings() {
	const data = GetDataFromLocalStorageAndSetApiUrlGlobal();
	if (data != null) {
		if (data.userId != null && data.userId != undefined && data.userId != '') {
			return true;
		}
	}
	return false;
}

Office.onReady(async (info) => {
	console.log('Office.onReady called');
	if (info.host === Office.HostType.Outlook) {
		// Initialize the public client application
		pca = await createNestablePublicClientApplication({
			auth: {
				clientId: "f366e055-628e-45fe-9b6d-aefcfe1a5159",
				authority: "https://login.microsoftonline.com/common"
			},
		});
		await GetOutlookApiAccessToken();
		ResetTheTaskPaneUI();
	} else {
		//console.log('host check failed');
	}
});

// eslint-disable-next-line no-unused-vars
window.CloseTheTaskPane = function () {
	Office.context.ui.closeContainer();
}

// eslint-disable-next-line no-unused-vars
window.SetLocalStorageItem = function (settings) {
	localStorage.setItem("crm", btoa(settings));
}

// eslint-disable-next-line no-unused-vars
window.ReloadTaskPane = function (isRemoveSettings) {
	console.log("removed settings");
	if (isRemoveSettings)
		localStorage.removeItem('crm');
	window.location.reload(true);
}

// eslint-disable-next-line no-unused-vars


window.showOutlookPopup = function (data, width, height) {
	let dialogUrl = window.location.origin + '/Pages/Dialog/GenericPopup.html' + '?data=' + encodeURIComponent(JSON.stringify(data));
	Office.context.ui.displayDialogAsync(dialogUrl, { width: width, height: height, displayInIframe: true }, function (result) {
		if (result.status === Office.AsyncResultStatus.Succeeded) {
			let dialog = result.value;
			dialog.addEventHandler(Office.EventType.DialogMessageReceived, function (arg) {
				if (arg.message === 'close') {
					dialog.close();
					if (data.IsCloseTaskPanel)
						CloseTheTaskPane();
				}
			});
			if (data.IsCloseTaskPanel) {
				dialog.addEventHandler(Office.EventType.DialogEventReceived, function (event) {
					if (data.IsCloseTaskPanel && event.error === 12006)
						CloseTheTaskPane();
				});
			}
		} else {
			console.error('Dialog failed to open:', result.error.message);
		}
	});
}

// Attach click event handlers for buttons
function attachClickEventHandlers() {
	$('#send-email-btn').on('click', () => {
		if (selectedEmails.length < 1) {
			showOutlookPopup({ Popuptoshow: 'EmailSelectedDialog' }, 35, 35);
		} else {
			openPopup('../SendEmail/SendEmail.html', 'Send Email');
		}
	});

	$('#sync-email-btn').on('click', () => {
		openPopup('../SendEmail/SendEmail.html', 'Synchronize Email with CRM');
	});

	$('#settings-btn').on('click', () => {
		openPopup('../Settings/Settings.html', 'Settings');
	});
}

// Global variables for debounce and retry logic
// eslint-disable-next-line no-unused-vars
let setCategoryTimeout;
let retryCount = 0;
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // Initial delay in milliseconds

// Global variables for selected emails and processing flags
let selectedEmails = [];
let processing = false;
let refreshPending = false;






// Updated GetOutlookApiAccessToken using NAA
async function GetOutlookApiAccessToken(maxRetries = 3) {
	const tokenRequest = {
		scopes: ["Mail.Read", "User.Read", "openid", "profile", "Mail.ReadWrite"],
	};

	let retriesLeft = maxRetries;
	let delay = 0;
	while (retriesLeft > 0 && GraphApiAccessToken === null) {
		try {
			console.log("Trying to acquire token silently...");
			const userAccount = await pca.acquireTokenSilent(tokenRequest);
			console.log("Acquired token silently.");
			GraphApiAccessToken = userAccount.accessToken;
			delay = new Date(userAccount.expiresOn) - Date.now() - 2 * 60 * 60 * 1000;
		} catch (error) {
			console.log(`Unable to acquire token silently: ${error}`);

			// Try interactive acquisition if silent fails
			try {
				console.log("Trying to acquire token interactively...");
				const userAccount = await pca.acquireTokenPopup(tokenRequest);
				console.log("Acquired token interactively.");
				GraphApiAccessToken = userAccount.accessToken;
				delay = new Date(userAccount.expiresOn) - Date.now() - 2 * 60 * 60 * 1000;
			} catch (popupError) {
				console.log(`Unable to acquire token interactively: ${popupError}`);
				retriesLeft--;

				if (retriesLeft === 0) {
					$('.statusMsg').children().hide();
					$('#errMsgFetchTokenLimit').show();
					throw new Error("Failed to get Outlook API access token after multiple retries.");
				}
			}
		}
	}
	setTimeout(async () => {
		await GetOutlookApiAccessToken();
	}, delay)
	return;
}

// Updated fetchSelectedEmails function
async function fetchSelectedEmails(refresh) {
	console.log("Disabling----");

	// Queue the refresh if we're already processing
	if (processing) {
		refreshPending = refreshPending || refresh;
		return;
	}

	processing = true;

	// Clear selectedEmails if refresh is true
	if (refresh) {
		selectedEmails = [];
		window.selectedEmailData = {}; // Reset the data store
	}

	// Function to attempt fetching selected items with retry
	async function tryFetchSelectedItems() {
		$('#send-email-btn').prop('disabled', true);
		$('#send-email-btn').addClass('disabled');
		let storage = GetDataFromLocalStorageAndSetApiUrlGlobal();
		if (storage == null || storage == undefined || Object.keys(storage).length === 0) {
			processing = false;
			return;
		}
		else {
			$('#initialMsg').hide();
		}
		$('#indexLoader').show();
		$('#fetching').show();
		$('#noOfEmails').hide();
		$('#SelectAllMessagesNote').hide();
		$('#errMsg').hide();

		Office.context.mailbox.getSelectedItemsAsync(async (asyncResult) => {
			if (asyncResult.status === Office.AsyncResultStatus.Failed) {
				console.error(`Error getting selected items: ${asyncResult.error.message}`);
				processing = false;

				// Retry logic
				if (retryCount < MAX_RETRIES) {
					retryCount++;
					console.log(`Retrying after error. Attempt ${retryCount} of ${MAX_RETRIES}.`);
					await tryFetchSelectedItems(); // Retry fetching selected items
				} else {
					console.error(`Max retries (${MAX_RETRIES}) exceeded. Unable to fetch selected items.`);
					retryCount = 0; // Reset retry count for next attempt
					// Handle failure
					$('#indexLoader').hide();
					$('#fetching').hide();
					$('#errMsg').show();
				}

				return;
			}

			retryCount = 0; // Reset retry count on success
			try {
				const promises = asyncResult.value.map(item => {
					if (refreshPending) {
						return Promise.resolve();
					}
					return getSpecificEmailDetails(item.itemId, GraphApiAccessToken);
				});

				await Promise.all(promises);
				if (CheckSettings()) {
					console.log("Enabling----");
					updateEmailCount();
					$('#send-email-btn').prop('disabled', false);
					$('#send-email-btn').removeClass('disabled');
					if (!$('#sync-email-btn').hasClass('disabled')) {
						$('#indexLoader').hide();
					}
					$('#fetching').hide();
					$('#noOfEmails').show();
					if (selectedEmails.length === 0) {
						$('#SelectAllMessagesNote').show();
					}
					$('#errMsg').hide();
				}
				processing = false;

				// If there was a pending refresh while processing, call the function again
				if (refreshPending) {
					refreshPending = false;
					await fetchSelectedEmails(true);
				}
			} catch (error) {
				console.error(`Error processing emails: ${error}`);
				processing = false;
				// If there was a pending refresh while processing, call the function again
				if (refreshPending) {
					refreshPending = false;
					await fetchSelectedEmails(true);
				}
			}
		});
	}

	await tryFetchSelectedItems(); // Initial attempt to fetch selected items
}

function updateEmailCount() {
	const emailCount = selectedEmails.length;
	if (emailCount === 1) {
		$('#noOfEmails').text(emailCount + " email selected.");
	} else {
		$('#noOfEmails').text(emailCount + " emails selected.");
	}
}
// Get specific email details

function getSpecificEmailDetails(id, accessToken) {
	return new Promise((resolve, reject) => {
		if (id) {
			let correctedId = id.replace(/\//g, '-').replace(/\+/g, '_'); // This might not be needed
			const requestUrl = `${GraphApiUrl}/${correctedId}`;

			// Function to perform AJAX request with exponential backoff
			const  fetchWithRetry = (url, headers, retries = MAX_RETRIES, delay = 1000) => {
				return new Promise((resolve, reject) => {
					$.ajax({
						url: url,
						dataType: 'json',
						headers: headers
					}).done((data) => {
						resolve(data);
					}).fail((error) => {
						if (error.status === 429 && retries > 0) {
							setTimeout(() => {
								fetchWithRetry(url, headers, retries - 1, delay * 2).then(resolve).catch(reject);
							}, delay);
						} else if (error.status === 401 && error.responseJSON && error.responseJSON.error && error.responseJSON.error.code === "InvalidAuthenticationToken") {
							headers['Authorization'] = `Bearer ${GraphApiAccessToken}`;
							fetchWithRetry(url, headers, retries - 1, delay * 2).then(resolve).catch(reject);
						} else {
							reject(error);
						}
					});
				});
			}

			const headers = {
				'Authorization': `Bearer ${accessToken}`,
				'Accept': 'application/json',
				'Prefer': 'outlook.body-content-type="text"'
			};

			fetchWithRetry(requestUrl, headers)
				.then((emailData) => {
					window.selectedEmailData[id] = emailData;

					const parentFolderId = emailData.parentFolderId;
					const folderUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${parentFolderId}`;

					return fetchWithRetry(folderUrl, headers).then(folderData => {
						return { emailData, folderData };
					});
				})
				.then(({ emailData, folderData }) => {
					const folderName = folderData.displayName;

					const rowData = {
						id: emailData.id,
						subject: emailData.subject,
						receivedDate: emailData.receivedDateTime,
						body: emailData.body.content,
						isInbox: !(folderName.startsWith('Sent Items') || folderName.startsWith('Sent Items/') || folderName.startsWith('Sent Items\\')),
						fromEmail: (!(folderName.startsWith('Sent Items') || folderName.startsWith('Sent Items/') || folderName.startsWith('Sent Items\\'))) ? emailData.from.emailAddress.address : emailData.toRecipients[0].emailAddress.address
					};

					const exists = selectedEmails.some(email => email.id === rowData.id);
					if (!exists) {
						selectedEmails.push(rowData);
					}

					console.log(`Email is in folder: ${folderName}`);
					resolve();
				})
				.catch((error) => {
					console.error("Error fetching data:", error);
					if (error.responseJSON) {
						console.error("Error details:", error.responseJSON);
					}
					reject(error);
				});
		} else {
			resolve();
		}
	});
}

let popupWindow = null;
/** @type {Office.Dialog | null} */
let openOfficeDialog = null;
/** If set, run ReloadTaskPane with this value when the Office dialog closes (avoids reloading while dialog is open). */
let pendingReloadTaskPane = undefined;
/** If set, run showOutlookPopup after the Office dialog fully closes (avoids 12007: cannot open a second dialog while the first is active). */
let pendingShowOutlookPopup = null;

/**
 * Returns true when running inside Office (Outlook desktop or web) with the Dialog API available.
 * Using displayDialogAsync keeps the dialog in the host process and preserves session context;
 * window.open in desktop Outlook can open in a separate browser tab and lose context.
 */
function isOfficeDialogApiAvailable() {
	return typeof Office !== 'undefined' &&
		Office.context &&
		Office.context.ui &&
		typeof Office.context.ui.displayDialogAsync === 'function';
}

/**
 * Opens a popup using Office.context.ui.displayDialogAsync when in Office (retains session context),
 * otherwise falls back to window.open for web-only usage.
 */
function openPopup(url, title, width = 1000, height = 800, onloadCallback) {
	if (isOfficeDialogApiAvailable()) {
		openPopupViaOfficeDialog(url, title, width, height, onloadCallback);
	} else {
		openPopupViaWindowOpen(url, title, width, height, onloadCallback);
	}
}

/**
 * Opens a dialog using the Office Dialog API so it stays within the Outlook host and retains session context.
 */
function openPopupViaOfficeDialog(url, title, width, height, onloadCallback) {
	if (openOfficeDialog) {
		console.warn('An Office dialog is already open; only one is allowed.');
		return;
	}

	pendingShowOutlookPopup = null;

	const dialogUrl = new URL(url, window.location.href).href;
	const urlWithMode = dialogUrl + (dialogUrl.indexOf('?') >= 0 ? '&' : '?') + 'mode=dialog';

	const isSendEmail = url.indexOf('SendEmail') >= 0;
	const isSettings = url.indexOf('Settings') >= 0;

	if (isSendEmail) {
		try {
			localStorage.setItem('outlook-dialog-init', JSON.stringify({
				type: 'sendEmail',
				isSync: title === 'Synchronize Email with CRM',
				selectedEmails: selectedEmails,
				ApiUrlVal: window.ApiUrlVal,
				inboxEmails: window.inboxEmails,
				sentEmails: window.sentEmails
			}));
		} catch (e) {
			console.error('Failed to store dialog init data:', e);
		}
	} else if (isSettings) {
		try {
			localStorage.setItem('outlook-dialog-init', JSON.stringify({
				type: 'settings',
				ApiUrlVal: window.ApiUrlVal
			}));
		} catch (e) {
			console.error('Failed to store dialog init data:', e);
		}
	}

	const dialogHeight = Math.min(80, (height / window.screen.height) * 100);
	const dialogWidth = Math.min(80, (width / window.screen.width) * 100);

	Office.context.ui.displayDialogAsync(urlWithMode, {
		width: dialogWidth,
		height: dialogHeight,
		displayInIframe: true
	}, function (result) {
		if (result.status !== Office.AsyncResultStatus.Succeeded) {
			console.error('Office dialog failed to open:', result.error && result.error.message);
			return;
		}
		openOfficeDialog = result.value;

		openOfficeDialog.addEventHandler(Office.EventType.DialogMessageReceived, function (arg) {
			try {
				const msg = typeof arg.message === 'string' ? JSON.parse(arg.message) : arg.message;
				handleDialogMessageFromChild(msg);
			} catch (e) {
				// Treat as simple message (e.g. 'close')
				if (arg.message === 'close') {
					if (openOfficeDialog) {
						try {
							openOfficeDialog.close();
						} catch (closeErr) {
							console.error('Office dialog close failed:', closeErr);
						}
						// Some hosts omit DialogEventReceived (12006); clear the ref after close() (same as
						// CloseDialogAndTaskPane) so the next displayDialogAsync is not blocked by our guard.
						openOfficeDialog = null;
					}
					// When 12006 is missing, DeferShowOutlookPopup would never run; flush after close like 12006 would.
					if (pendingShowOutlookPopup) {
						const pending = pendingShowOutlookPopup;
						pendingShowOutlookPopup = null;
						queueMicrotask(function () {
							if (typeof window.showOutlookPopup === 'function') {
								window.showOutlookPopup(pending.data, pending.width, pending.height);
							}
						});
					}
					if (pendingReloadTaskPane !== undefined) {
						const doReload = pendingReloadTaskPane;
						pendingReloadTaskPane = undefined;
						if (typeof window.ReloadTaskPane === 'function') {
							window.ReloadTaskPane(doReload);
						}
					}
				}
			}
		});

		openOfficeDialog.addEventHandler(Office.EventType.DialogEventReceived, function (event) {
			if (event.error === 12006) {
				openOfficeDialog = null;
				// Plain 'close' may already have nulled the ref and flushed pendingShowOutlookPopup via queueMicrotask.
				if (pendingShowOutlookPopup) {
					const pending = pendingShowOutlookPopup;
					pendingShowOutlookPopup = null;
					if (typeof window.showOutlookPopup === 'function') {
						window.showOutlookPopup(pending.data, pending.width, pending.height);
					}
				}
			}
		});

		if (onloadCallback && typeof onloadCallback === 'function') {
			onloadCallback(null);
		}
	});
}

/**
 * Handles messages from the Office dialog (SendEmail/Settings) and invokes task pane methods or sends responses.
 */
function handleDialogMessageFromChild(msg) {
	if (!msg || typeof msg.method !== 'string') return;

	const method = msg.method;
	const args = Array.isArray(msg.args) ? msg.args : [];
	const requestId = msg.requestId;
	const dialog = openOfficeDialog;

	function sendResponse(success, result, error) {
		if (!requestId || !dialog) return;
		try {
			dialog.messageChild(JSON.stringify({ requestId: requestId, success: success, result: result, error: error }), { targetOrigin: window.location.origin });
		} catch (e) {
			console.error('messageChild failed:', e);
		}
	}

	switch (method) {
	case 'ReloadTaskPane':
		// Defer reload until dialog closes so Close button still works (parent keeps dialog reference).
		pendingReloadTaskPane = args[0];
		break;
	case 'SetLocalStorageItem':
		if (typeof window.SetLocalStorageItem === 'function') {
			window.SetLocalStorageItem(args[0]);
		}
		break;
	case 'CloseTheTaskPane':
		if (typeof window.CloseTheTaskPane === 'function') {
			window.CloseTheTaskPane();
		}
		break;
	case 'CloseDialogAndTaskPane':
		// SendEmail CloseAll (non-sync): do not call CloseTheTaskPane synchronously before close() (12007 zombie).
		// Some hosts never deliver DialogEventReceived (12006) before the task pane must act again, so run CloseTheTaskPane in a microtask after close()+null.
		if (openOfficeDialog) {
			try {
				openOfficeDialog.close();
			} catch (e) {
				console.error('Office dialog close failed:', e);
			}
			openOfficeDialog = null;
		}
		queueMicrotask(function () {
			if (typeof window.CloseTheTaskPane === 'function') {
				window.CloseTheTaskPane();
			}
		});
		break;
	case 'showOutlookPopup':
		if (typeof window.showOutlookPopup === 'function') {
			window.showOutlookPopup(args[0], args[1] || 35, args[2] || 30);
		}
		break;
	case 'DeferShowOutlookPopup':
		pendingShowOutlookPopup = {
			data: args[0],
			width: args[1] != null ? args[1] : 35,
			height: args[2] != null ? args[2] : 30
		};
		break;
	case 'setCategoryToEmail':
		if (typeof window.setCategoryToEmail === 'function') {
			window.setCategoryToEmail(args[0], args[1])
				.then(function (r) { sendResponse(true, r); })
				.catch(function (err) { sendResponse(false, null, err && err.message); });
		}
		break;
	case 'fetchMimeContentOfAllEmail':
		if (typeof window.fetchMimeContentOfAllEmail === 'function') {
			window.fetchMimeContentOfAllEmail(args[0], args[1] || null)
				.then(function (mimeContent) { sendResponse(true, mimeContent); })
				.catch(function (err) { sendResponse(false, null, err && err.message); });
		}
		break;
	default:
		console.warn('Unknown dialog message method:', method);
	}
}

/**
 * Original window.open-based popup (used when not in Office or Dialog API unavailable, e.g. web-only).
 */
function openPopupViaWindowOpen(url, title, width, height, onloadCallback) {
	if (popupWindow && !popupWindow.closed) {
		popupWindow.close();
	}

	const left = (window.screen.width / 2) - (width / 2);
	const top = (window.screen.height / 2) - (height / 2);
	popupWindow = window.open(
		url,
		title,
		`
			popup=true,
			width=${width},
			height=${height},
			top=${top},
			left=${left},
			resizable=true,
			scrollbars=true,
			toolbar=false,
			menubar=false,
			location=false,
			status=false
		`
	);

	if (!popupWindow) {
		console.error('Popup was blocked. Please allow popups for this site.');
		return;
	}

	popupWindow.onload = function () {
		popupWindow.window.inboxEmails = popupWindow.opener.inboxEmails;
		popupWindow.window.sentEmails = popupWindow.opener.sentEmails;
		popupWindow.window.ApiUrl = popupWindow.opener.ApiUrlVal;

		if (typeof popupWindow.window.initPopup === 'function' && title === 'Synchronize Email with CRM') {
			popupWindow.window.initPopup(true, selectedEmails); // Initialize the popup with data
		} else if (typeof popupWindow.window.initPopup === 'function') {
			popupWindow.window.initPopup(false, selectedEmails);
		} else if (typeof popupWindow.window.initSettings === 'function') {
			popupWindow.window.initSettings(popupWindow.opener.ApiUrlVal);
		}

		if (onloadCallback) {
			onloadCallback(popupWindow);
		}
	};

	window.addEventListener('message', function (event) {
		if (event.origin !== window.location.origin) {
			// Ignore messages from different origins
			return;
		}
	});
}


function fetchEmailsWithCategoryAndTimeFilter(isInbox, daysToSync, sentCategoryColor, skipCategoryColor) {
	const storage = GetDataFromLocalStorageAndSetApiUrlGlobal();
	if (!storage || Object.keys(storage).length === 0) {
		return;
	}

	const mailFolder = isInbox ? 'inbox' : 'sentitems';
	const requestUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${mailFolder}/messages`;

	// Get selected days to sync
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - daysToSync);
	startDate.setHours(0, 0, 0, 0);
	const startDateISOString = startDate.toISOString();

	// Construct the query to filter emails within the selected timeframe,
	// excluding those with the skip or sent categories
	let filterQuery = `?$filter=receivedDateTime ge ${startDateISOString}` +
		` and not(categories/any(c:c eq '${sentCategoryColor}'))` +
		` and not(categories/any(c:c eq '${skipCategoryColor}'))`;

	// Function to fetch emails with pagination
	function fetchEmails(url, allEmails = []) {
		$.ajax({
			url: url,
			type: 'GET',
			contentType: 'application/json',
			headers: {
				'Authorization': `Bearer ${GraphApiAccessToken}`,
				'Prefer': `outlook.body-content-type="text"`
			}
		}).done(function (response) {
			allEmails = allEmails.concat(response.value);

			if (response['@odata.nextLink']) {
				fetchEmails(response['@odata.nextLink'], allEmails);
			} else {
				let validEmails = allEmails.filter(email => {
					// Filter valid date email
					if (email.receivedDateTime) {
						if (isInbox) {
							// Exclude calendar event and other event mail
							if (email['@odata.type'] && email['@odata.type'].toLowerCase().includes("#microsoft.graph.eventMessage")) {
								return false; // exclude calendar event messages
							}

							// Exclude group mail (check if current user is in 'to','cc','bcc' recipients)
							let CurrentLoggedInUser = Office.context.mailbox.userProfile.emailAddress.toLowerCase();
							if (email.toRecipients &&
								(email.toRecipients.some(currRec => currRec.emailAddress.address.toLowerCase() === CurrentLoggedInUser) ||
									email.ccRecipients.some(currCcRec => currCcRec.emailAddress.address.toLowerCase() === CurrentLoggedInUser))) {
								return true;
							}
							return false;
						}
						return true;
					}
					return false;
				});

				// Sort validEmails based on receivedDateTime
				validEmails.sort((a, b) => {
					const dateA = new Date(a.receivedDateTime);
					const dateB = new Date(b.receivedDateTime);
					return dateB - dateA;
				});
				allEmails = validEmails;
				if (isInbox) {
					window.inboxEmails = allEmails;
					console.log("Inbox emails from the selected timeframe:");
					console.log(window.inboxEmails);
				} else {
					window.sentEmails = allEmails;
					console.log("Sent emails from the selected timeframe:");
					console.log(window.sentEmails);
				}
				if (CheckSettings() && Array.isArray(window.inboxEmails) && Array.isArray(window.sentEmails)) {
					$('#sync-email-btn').removeClass('disabled');
					$('#sync-email-btn').prop('disabled', false);

					if (!$('#send-email-btn').hasClass('disabled')) {
						$('#indexLoader').hide();
					}
				}
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error("Error fetching emails:", textStatus, errorThrown);
			if (jqXHR.responseJSON) {
				console.error("Error details:", jqXHR.responseJSON);
			}
			$('#sync-email-btn').removeClass('disabled');
			$('#sync-email-btn').prop('disabled', false);
		});
	}

	fetchEmails(requestUrl + filterQuery);
}

window.fetchMimeContentOfAllEmail = function (EmailIdTogetMIME, loader) {
	if (loader) loader.show();
	return new Promise((resolve, reject) => {
		// Get access token from Office context
		const retries = MAX_RETRIES;
		const delay = INITIAL_DELAY;
		const headers = {
			'Authorization': `Bearer ${GraphApiAccessToken}`,
			'Accept': 'application/json'
		};

		// Helper function to fetch MIME content for a single email with retry logic
		const fetchEmailMimeContent = (emailId, retriesLeft, delay) => {
			return new Promise((resolveEmail, rejectEmail) => {
				$.ajax({
					url: `${GraphApiUrl}/${emailId}/$value`,
					dataType: 'text',
					headers: headers
				}).done((data) => {
					console.log(emailId, " : mime fetched")
					resolveEmail(data); // Resolve with the MIME content
				}).fail((error) => {
					if (error.status === 429 && retriesLeft > 0) {
						setTimeout(() => {
							fetchEmailMimeContent(emailId, retriesLeft - 1, delay * 2).then(resolveEmail).catch(rejectEmail);
						}, delay);
					} else {
						rejectEmail(error);
					}
				});
			});
		};

		fetchEmailMimeContent(EmailIdTogetMIME, retries, delay).then((mimedata) => {
			if (loader) loader.hide();
			resolve(mimedata);
		}).catch((error) => {
			if (loader) loader.hide();
			reject(error);
		});
	});
}

async function UpdateMailCount() {
	let selectedEmailCurr = 0;
	let conversationCountCurr = new Set();
	let firstEmailSelectedIdCurr = '';
	const intervalId = setInterval(() => {
		Office.context.mailbox.getSelectedItemsAsync(function (result) {
			let IsSelectedMailChange = false;
			let conversationCount = new Set();
			let firstEmailSelectedId = '';

			if (Array.isArray(result.value) && result.value.length <= 50) {
				if (result.value.length === 0 && selectedEmailCurr >= 0) {
					selectedEmailCurr = -1;
					fetchSelectedEmails(true);
				} else if (result.value.length > 0) {
					result.value.forEach(emailItem => {
						if (!conversationCountCurr.has(emailItem.conversationId)) {
							IsSelectedMailChange = true;
						}
						conversationCount.add(emailItem.conversationId);
					});
					// Total email selected
					let selectedEmailChanged = result.value.length;
					if (selectedEmailChanged === 1) {
						firstEmailSelectedId = result.value[0].itemId;
					}

					if (conversationCount.size != conversationCountCurr.size || selectedEmailChanged != selectedEmailCurr || IsSelectedMailChange
						|| (firstEmailSelectedIdCurr && firstEmailSelectedId && firstEmailSelectedId !== firstEmailSelectedIdCurr)) {
						conversationCountCurr = conversationCount;
						selectedEmailCurr = selectedEmailChanged;
						firstEmailSelectedIdCurr = firstEmailSelectedId;
						fetchSelectedEmails(true);
					}
				}
			} else if (Array.isArray(result.value) && result.value.length > 50) {
				clearInterval(intervalId);
				showOutlookPopup({ Popuptoshow: 'SelectedEmailLimitExceed', IsCloseTaskPanel: true }, 30, 25);
			}
		});
	}, 500);
}

function ResetTheTaskPaneUI() {
	//console.log('ResetTheTaskPaneUI 1');
	if (!IsResetTaskPaneUICall) {
		//console.log('ResetTheTaskPaneUI 2');
		IsResetTaskPaneUICall = true;
		$(document).ready(() => {
			console.log("office is ready");

			$('#indexLoader').hide();
			$('#fetching').hide();
			$('#noOfEmails').hide();
			$('#SelectAllMessagesNote').hide();
			$('#errMsg').hide();
			$('#send-email-btn').addClass('disabled');
			$('#send-email-btn').prop('disabled', true);
			$('#sync-email-btn').addClass('disabled');
			$('#sync-email-btn').prop('disabled', true);

			attachClickEventHandlers();
			UpdateMailCount();

			const data = GetDataFromLocalStorageAndSetApiUrlGlobal();
			window.ApiUrlVal = ApiUrl;
			if (data != null) {
				$('#sent-flag-color').val(data.sentFlagColor);
				$('#skip-flag-color').val(data.skipFlagColor);
				$('#days-to-sync').val(data.daysToSync);

				fetchEmailsWithCategoryAndTimeFilter(true, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
				fetchEmailsWithCategoryAndTimeFilter(false, parseInt(data.daysToSync, 10), data.sentFlagColor, data.skipFlagColor);
			}

		}

		);
		//console.log('ResetTheTaskPaneUI 3');
		IsResetTaskPaneUICall = false;
	}
}

console.log('loaded index.js version 1.6.4');