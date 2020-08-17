'use strict';

let env = null;
/**
 *
 * @return {Promise<string>}
 */
async function getEnv() {
	if (env === null) {
		const { default:_env } = await import('./env.js');
		env = _env;
	}

	return env;
}

let _ = chrome.i18n.getMessage;

/**
 *
 * @param {string} title
 * @param {string} message
 * @return {Promise<void>}
 */
function doNotif(title, message) {
	let options = {
		type: "basic",
		title: title,
		message: message,
		contextMessage: chrome.runtime.getManifest().name,
		iconUrl: "/icon.png",
		isClickable: true
	};

	return new Promise((resolve, reject) => {
		chrome.notifications.create(options, function() {
			if(typeof chrome.runtime.lastError === "object" && chrome.runtime.lastError !== null && typeof chrome.runtime.lastError.message === "string" && chrome.runtime.lastError.message.length > 0){
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	})
		.catch(error => {
			if (typeof error === "object" && typeof error.message === "string" && error.message.length > 0) {
				console.error(error);
			}
		})
	;
}
chrome.notifications.onClicked.addListener(function (notificationId) {
	console.info(`${notificationId} (onClicked)`);
	chrome.notifications.clear(notificationId);
});





function copyToClipboard(string) {
	if (document.querySelector('#copy_form') !== null) {
		let node = document.querySelector('#copy_form');
		node.parentNode.removeChild(node);
	}

	let copy_form = document.createElement('textarea');
	copy_form.id = 'copy_form';
	copy_form.textContent = string;
	//copy_form.class = "hide";
	copy_form.setAttribute('style', 'height: 0 !important; width: 0 !important; border: none !important; z-index: -9999999;');
	document.querySelector('body').appendChild(copy_form);

	//copy_form.focus();
	copy_form.select();

	let clipboard_success = document.execCommand('Copy');
	copy_form.parentNode.removeChild(copy_form);

	return clipboard_success;
}





chrome.contextMenus.removeAll();
chrome.contextMenus.create({
	id: 'link_CopyTextLink',
	title:_("Copy_link_text"),
	contexts: ["link"],
	targetUrlPatterns: ["http://*/*", "https://*/*"]
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
	chrome.tabs.sendMessage(tab.id, {
		id: "copyLinkText",
		data: ""
	}, async function (responseData) {
		let clipboardResult = (typeof responseData === 'object' && responseData !== null) && copyToClipboard(responseData.string);

		if (!clipboardResult || (await getEnv()) !== 'prod') {
			doNotif(_("copy_result"), (clipboardResult) ? _("Copied_link_text") : _("Error_when_copying_to_clipboad"));
		}

		console[(clipboardResult) ? "debug" : "warn"](`Copy to clipboad ${(clipboardResult) ? "success" : "error"} (${responseData?.string})`);
	});
})
