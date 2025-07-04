﻿'use strict';
/* global Office, GetDataFromLocalStorageAndSetApiUrlGlobal, ApiUrl*/
window.MatchedData = {};
window.selectedEmailData = {}; // Global Variable to store the selected emails data
window.inboxEmails = {};
window.sentEmails = {};
window.ApiUrlVal = '';
window.ApiUrl = '';
window.userId = '';

console.log('loading index.js version 1.6.4');

let emailQueue = [];
let isProcessingQueue = false;
let retryDelay = 1000; // Initial delay of 1 second
let IsResetTaskPaneUICall = false;


//$(document).ready(() => {});

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
function setCategoryToEmail(emailId, isSentFlag) {
	console.log("Set category called for email:", emailId);
	return new Promise((resolve,reject) => {
		Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
			if (result.status === "succeeded") {
				const accessToken = result.value;
				const requestUrl = `${Office.context.mailbox.restUrl}/v2.0/me/messages/${emailId}`;
	
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
						'Authorization': `Bearer ${accessToken}`
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
			} else {
				console.error("Error getting callback token:", result.error.message);
				reject();
			}
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

//console.log('check isOfficeJsLoaded');
if (isOfficeJsLoaded()) {
	console.log('isOfficeJsLoaded -- yes');
	ResetTheTaskPaneUI();
} else {
	console.log('isOfficeJsLoaded -- no');
}

Office.onReady((info) => {
	console.log('Office.onReady called');
	if (info.host === Office.HostType.Outlook) {
		//console.log('host check passed');
		ResetTheTaskPaneUI();
	} else {
		//console.log('host check failed');
	}
});

// eslint-disable-next-line no-unused-vars
function CloseTheTaskPane() {
	Office.context.ui.closeContainer();
}

// eslint-disable-next-line no-unused-vars
function SetLocalStorageItem(settings) {
	localStorage.setItem("crm", btoa(settings));
}

// eslint-disable-next-line no-unused-vars
function ReloadTaskPane(isRemoveSettings) {
	console.log("removed settings");
	if (isRemoveSettings)
		localStorage.removeItem('crm');
	window.location.reload(true);
}

// eslint-disable-next-line no-unused-vars
function decodeFromBase64(base64Str) {
	const jsonString = atob(base64Str);

	// Parse the JSON string into an object
	return JSON.parse(jsonString);
}

function showOutlookPopup(data,width,height) {
	let dialogUrl = window.location.origin + '/Pages/Dialog/GenericPopup.html' + '?data=' + encodeURIComponent(JSON.stringify(data));
	Office.context.ui.displayDialogAsync(dialogUrl, { width: width, height: height,  displayInIframe: true }, function(result) {
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
			showOutlookPopup({Popuptoshow : 'EmailSelectedDialog'},35,35);
		} else {
			openPopup('../SendEmail/SendEmail.html', 'Send Email');
		}
	});

	$('#sync-email-btn').on('click', () => {
		openPopup('../SendEmail/SendEmail.html', 'Synchronize Email with CRM');
	});

	$('#settings-btn').on('click', () => {
		openPopup('../Settings/Settings.html', 'Settings', 1000, 800);
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


// Fetch selected emails with retry logic
function fetchSelectedEmails(refresh) {
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
	function tryFetchSelectedItems() {
		$('#send-email-btn').prop('disabled', true);
		$('#send-email-btn').addClass('disabled');
		let storage = GetDataFromLocalStorageAndSetApiUrlGlobal();
		if (storage == null || storage == undefined || Object.keys(storage).length === 0) {
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
		
		Office.context.mailbox.getSelectedItemsAsync((asyncResult) => {
			if (asyncResult.status === Office.AsyncResultStatus.Failed) {
				console.error(`Error getting selected items: ${asyncResult.error.message}`);
				processing = false;

				// Retry logic
				if (retryCount < MAX_RETRIES) {
					retryCount++;
					console.log(`Retrying after error. Attempt ${retryCount} of ${MAX_RETRIES}.`);
					tryFetchSelectedItems(); // Retry fetching selected items
				} else {
					console.error(`Max retries (${MAX_RETRIES}) exceeded. Unable to fetch selected items.`);
					retryCount = 0; // Reset retry count for next attempt
					// Handle failure (e.g., show error message)
					$('#indexLoader').hide();
					$('#fetching').hide();
					$('#errMsg').show();
				}

				return;
			}

			retryCount = 0; // Reset retry count on success
			GetOutlookApiAccessToken().then((accessToken) => {
				const promises = asyncResult.value.map(item => {
					if (refreshPending) {
						return new Promise((resolve,reject) => {
							resolve();
						})
					} else 
						return getSpecificEmailDetails(item.itemId,accessToken)
				});
				Promise.all(promises).then(() => {
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
						fetchSelectedEmails(true);
					}
				}).catch(() => {
					processing = false;
					// If there was a pending refresh while processing, call the function again
					if (refreshPending) {
						refreshPending = false;
						fetchSelectedEmails(true);
					}
				});
			});
		});
	}
	tryFetchSelectedItems(); // Initial attempt to fetch selected items
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
function getSpecificEmailDetails(id,accessToken) {
	return new Promise((resolve, reject) => {
		if (id) {
			let correctedId = id.replace(/\//g, '-').replace(/\+/g, '_'); // This might not be needed
			const encodedId = encodeURIComponent(correctedId); // URL encode the corrected ID
			const requestUrl = `${Office.context.mailbox.restUrl}/v2.0/me/messages/${encodedId}`;

			// Function to perform AJAX request with exponential backoff
			// eslint-disable-next-line no-inner-declarations
			function fetchWithRetry(url, headers, retries = MAX_RETRIES, delay = INITIAL_DELAY) {
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
						} else if (error.status === 401 && error.responseJSON && error.responseJSON.error.code === "TokenExpired") {
							GetOutlookApiAccessToken().then((Token) => {
								headers['Authorization'] = `Bearer ${Token}`;
								fetchWithRetry(url, headers, retries - 1, delay * 2).then(resolve).catch(reject);
							}).catch((error) => reject(error))
						} else {
							reject(error);
						}
					});
				});
			}

			const headers = {
				'Authorization': `Bearer ${accessToken}`,
				'Accept': 'application/json',
				'Prefer': `outlook.body-content-type="text"`
			};

			fetchWithRetry(requestUrl, headers)
				.then((emailData) => {
					window.selectedEmailData[id] = emailData;

					const parentFolderId = emailData.ParentFolderId;
					const folderUrl = `${Office.context.mailbox.restUrl}/v2.0/me/mailFolders/${parentFolderId}`;

					return fetchWithRetry(folderUrl, headers).then(folderData => {
						return { emailData, folderData };
					});
				})
				.then(({ emailData, folderData }) => {
					const folderName = folderData.DisplayName;

					const rowData = {
						id: emailData.Id,
						subject: emailData.Subject,
						receivedDate: emailData.ReceivedDateTime,
						body: emailData.Body.Content,
						isInbox: !(folderName.startsWith('Sent Items') || folderName.startsWith('Sent Items/') || folderName.startsWith('Sent Items\\')),
						fromEmail: (!(folderName.startsWith('Sent Items') || folderName.startsWith('Sent Items/') || folderName.startsWith('Sent Items\\'))) ? emailData.From.EmailAddress.Address : emailData.ToRecipients[0].EmailAddress.Address
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
// Open a generic popup
function openPopup(url, title, width = 1000, height = 800, onloadCallback) {
	// Close the existing popup if it's open
	if (popupWindow && !popupWindow.closed) {
		popupWindow.close();
	}

	const left = (window.screen.width / 2) - (width / 2);
	const top = (window.screen.height / 2) - (height / 2);
	popupWindow = window.open(url, title, `width=${width}, height=${height}, top=${top}, left=${left}`);

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
	if (storage == null || storage == undefined || Object.keys(storage).length === 0) {
		return;
	}
	Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
		if (result.status === "succeeded") {
			const accessToken = result.value;
			const mailFolder = isInbox ? 'inbox' : 'sentitems';
			const requestUrl = Office.context.mailbox.restUrl + `/v2.0/me/mailfolders/${mailFolder}/messages`;

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
			// eslint-disable-next-line no-inner-declarations
			function fetchEmails(url, allEmails = []) {
				$.ajax({
					url: url,
					type: 'GET',
					contentType: 'application/json',
					headers: {
						'Authorization': 'Bearer ' + accessToken,
						'Prefer': `outlook.body-content-type="text"`
					}
				}).done(function (response) {
					allEmails = allEmails.concat(response.value);

					if (response['@odata.nextLink']) {
						fetchEmails(response['@odata.nextLink'], allEmails);
					} else {
						let validEmails = allEmails.filter(email => {
							// filter valid date email
							if (email.ReceivedDateTime) {
								if (isInbox) {
									// Exclude calendar event and other event mail
									if (email['@odata.type'] && email['@odata.type'].toLowerCase().includes("#microsoft.outlookservices.event")) {
										return false; // exclude calendar event messages
									}
								
									// Exclude group mail (check if current user is in 'To','Cc','Bcc' recipients)
									let CurrentLoggedInUser = Office.context.mailbox.userProfile.emailAddress.toLowerCase();
									if (email.ToRecipients && 
										(email.ToRecipients.some(currRec => currRec.EmailAddress.Address.toLowerCase() === CurrentLoggedInUser) ||
										email.CcRecipients.some(currCcRec => currCcRec.EmailAddress.Address.toLowerCase() === CurrentLoggedInUser))) {
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
							const dateA = new Date(a.ReceivedDateTime);
							const dateB = new Date(b.ReceivedDateTime);
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

							if (!$('#send-email-btn').hasClass('disabled')){
								$('#indexLoader').hide();
							}
						}
					}
				}).fail(function (jqXHR, textStatus, errorThrown) {
					console.error("Error fetching emails:", textStatus, errorThrown);
					console.error("Response text:", jqXHR.responseText);
					$('#sync-email-btn').removeClass('disabled');
					$('#sync-email-btn').prop('disabled', false);
				});
			}
			
			fetchEmails(requestUrl + filterQuery);
		} else {
			console.error("Error getting callback token:", result.error.message);
		}
	});
}

function fetchMimeContentOfAllEmail(EmailIdTogetMIME,loader) {
	loader.show();
	return new Promise((resolve, reject) => {
		// Get access token from Office context
		Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, function (result) {
			if (result.status === "succeeded") {
				const accessToken = result.value;
				const url = `${Office.context.mailbox.restUrl}/v2.0/me/messages/`;
				const retries = MAX_RETRIES;
				const delay = INITIAL_DELAY;
				const headers = {
					'Authorization': `Bearer ${accessToken}`,
					'Accept': 'application/json'
				};

				// Helper function to fetch MIME content for a single email with retry logic
				const fetchEmailMimeContent = (emailId, retriesLeft, delay) => {
					return new Promise((resolveEmail, rejectEmail) => {
						$.ajax({
							url: `${url}${emailId}/$value`,
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

				fetchEmailMimeContent(EmailIdTogetMIME,retries,delay).then((mimedata) => {
					loader.hide();
					resolve(mimedata);
				}).catch((error) => {
					loader.hide();
					reject(error);
				});
			}
		});
	});
}

function UpdateMailCount() {
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
				showOutlookPopup({Popuptoshow : 'SelectedEmailLimitExceed',IsCloseTaskPanel : true},30,25);
			} 
		});
	}, 500);
}

function GetOutlookApiAccessToken(maxRetries = 3) {
	return new Promise((resolve, reject) => {
		function tryGetToken(retriesLeft) {
			Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
				if (result.status === "succeeded") {
					resolve(result.value);
				} else {
					if (retriesLeft > 0) {
						tryGetToken(retriesLeft - 1);
					} else {
						reject(result.error || "Failed to get Outlook API access token after multiple retries.");
					}
				}
			});
		}
		tryGetToken(maxRetries);
	});
}

function ResetTheTaskPaneUI(){
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

function isOfficeJsLoaded() {
	//console.log(Office);
	//console.log(Office.context);
	return typeof Office !== "undefined" && typeof Office.context !== "undefined";
}

console.log('loaded index.js version 1.6.4');
