'use strict';

let _ = chrome.i18n.getMessage;

class notifAction{
	constructor(type, data){
		this.type = type;
		this.data = data;
	}
}
let chromeAPI_button_availability = true;
function doNotif(title, message){
	let options = {
		type: "basic",
		title: title,
		message: message,
		contextMessage: chrome.runtime.getManifest().name,
		iconUrl: "/icon.png",
		isClickable: true
	};
	
	let close = {title: _("Close"), iconUrl: "/data/ic_close_black_24px.svg"};
	
	if(chromeAPI_button_availability === true){
		options.buttons = [close];
	}
	
	const notification_id = JSON.stringify(new notifAction("none", {timestamp: Date.now()}));
	
	new Promise((resolve, reject) => {
		chrome.notifications.create(notification_id, options, function(notificationId){
			if(typeof chrome.runtime.lastError === "object" && chrome.runtime.lastError !== null && typeof chrome.runtime.lastError.message === "string" && chrome.runtime.lastError.message.length > 0){
				reject(chrome.runtime.lastError);
			}
		});
	}).catch((error)=> {
		if(typeof error === "object" && typeof error.message === "string" && error.message.length > 0){
			console.group();
			console.warn(error.message);
			console.dir(error);
			console.groupEnd();

			if(error.message === "Adding buttons to notifications is not supported." || error.message.indexOf("\"buttons\"") !== -1){
				chromeAPI_button_availability = false;
				console.log("Buttons not supported, retrying notification without them.");
				doNotif(title, message);
			}
		}
	})
}
function onNotificationClick(notificationId){
	console.info(`${notificationId} (onClicked)`);
	chrome.notifications.clear(notificationId);
}
chrome.notifications.onButtonClicked.addListener(onNotificationClick);
chrome.notifications.onClicked.addListener(onNotificationClick);

function isRightURL(URL){
	let test_url = /(?:http|https):\/\/.+/;
	return (typeof URL === "string" && test_url.test(URL));
}

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
	"title":_("Copy_link_text"),
	"contexts": ["link"],
	"targetUrlPatterns": ["http://*/*", "https://*/*"],
	"onclick": function(info, tab){
		chrome.tabs.sendMessage(tab.id, {
			id: "copyLinkText",
			data: ""
		}, function(responseData){
			const copyLinkText_success = responseData.copyLinkText_success,
				string = responseData.string;
			if(!copyLinkText_success || chrome.runtime.getManifest().name.indexOf("Dev")!==-1){
				doNotif(_("copy_result"), (copyLinkText_success)? _("Copied_link_text") : _("Error_when_copying_to_clipboad"));
			}
			console.warn(`Copy to clipboad ${(copyLinkText_success)? "success" : "error"} (${string})`);
		});
	}
});
