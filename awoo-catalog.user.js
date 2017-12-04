// ==UserScript==
// @name 		awoo catalog
// @namespace 	https://niles.xyz
// @include 	http://boards.lolis.download/*
// @include 	https://niles.lain.city/*
// @include 	http://dangeru.us/*
// @include 	https://dangeru.us/*
// @include 	http://boards.dangeru.us/*
// @include 	https://boards.dangeru.us/*
// @version		1.1
// @grant 		GM_getValue
// @grant 		GM_setValue
// @run-at 		document-end
// ==/UserScript==
var started = false;
var request_in_progress = false;
var out_of_posts = false;
var page = 1;
var btnListener = function btnListener() {
	if (request_in_progress) return;
	if (out_of_posts) return;
	request_in_progress = true;
	var btn = document.getElementById("load_next_button");
	var href = document.location.href;
	if (href[href.length - 1] == "/") href = href.substr(0, href.length - 1);
	var board = href.substr(href.lastIndexOf("/") + 1);
	var url = document.location.href + "?page=" + page;
	page++;
	//btn.innerText = "load page " + (page + 1);
	btn.innerText = "Loading...";
	btn.disabled = true;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		var done = this.DONE || 4;
		if (this.readyState === done) {
			console.log("Request done");
			var parser = new DOMParser();
			var doc = parser.parseFromString(xhr.responseText, "text/html");
			var added = 0;
			Array.prototype.slice.call(doc.getElementById("sitecorner").children, 0).forEach(function(elem) {
				if (!(elem.tagName == "A" && elem.hasAttribute("data-replies"))) return;
				var newa = document.createElement("a");
				Array.prototype.slice.call(elem.attributes, 0).forEach(function (attr) {
					newa.setAttribute(attr.nodeName, attr.value);
				});
				newa.innerHTML = elem.innerHTML;
				var sc = document.getElementById("sitecorner");
				sc.insertBefore(newa, page_count_container);
				sc.insertBefore(document.createElement("br"), page_count_container);
				added++;
				doTheThing(newa);
			});
			if (added == 0) {
				out_of_posts = true;
				btn.innerText = "no more posts";
			} else {
				btn.disabled = false;
				btn.innerText = "load page " + (page + 1);
			}
			request_in_progress = false;
		}
	};
	xhr.open("GET", url);
	xhr.send();
};

var onload = function() {

	// Only start once
	if (started) {
		return;
	}
	started = true;
	page_count_container = document.getElementById("pagecount_container");

	if (document.getElementById("load_next_button") === null) {
		var btn = document.createElement("button");
		btn.classList.add("button_styled");
		btn.id = "load_next_button";
		//btn.innerText = "load page " + (page + 1);
		btn.innerText = "load page " + (page + 1);
		btn.addEventListener("click", btnListener);
		page_count_container.appendChild(document.createElement("br"));
		page_count_container.appendChild(btn);
	}

	Array.prototype.slice.call(document.getElementsByTagName("a"), 0).forEach(doTheThing);
	var doch = function() {
		return $(document).height() - document.getElementById("draggable").clientHeight;
	}
	var win = $(window);
	var winh = function() { return win.height(); };
	if (doch() <= winh()) btnListener();
	win.scroll(function() {
		if (doch() - winh() == win.scrollTop()) {
			btnListener();
		}
	});
};
var doTheThing = function doTheThing(a) {
	if (!a.hasAttribute("data-replies")) {
		return;
	}

	var board = a.href.split("/")[3];
	var id = a.href.split("/")[5];

	var elem = document.createElement("span");
	a.appendChild(elem);
	elem.innerHTML = "Loading...";

	var key = board + ":" + id;
	var oldreplies = GM_getValue(key, 0);
	var replies = Number(a.getAttribute("data-replies"));
	comparison_and_update_elem(key, replies, a, elem, closed, oldreplies);
};

var grey = function grey(text) {
	return color("grey", text);
};
var red = function red(text) {
	return color("red", text);
};
var color = function color(c, text) {
	return " <span style='color: " + c + ";'>" + text + "</span>";
};

var comparison_and_update_elem = function(key, replies, a, elem, closed, oldreplies) {
	if (oldreplies < replies) {
		elem.innerHTML = red("+" + (replies - oldreplies));
		// we have to wrap this in a closure because otherwise it clicking any post would only update the last post processed in this loop
		set_onclick_listener(key, replies, a, elem, closed);
	} else {
		elem.innerHTML = grey(replies);
	}
};

var set_onclick_listener = function set_onclick_listener(key, replies, a, elem, closed) {
	//console.log(key);
	a.addEventListener("click", function() {
		GM_setValue(key, replies);
		elem.innerHTML = grey(replies);
	});
};


// In chrome, the userscript runs in a sandbox, and will never see these events
// Hence the run-at document-end
//document.addEventListener('DOMContentLoaded', onload);
//document.onload = onload;

// One of these should work, and the started variable should prevent it from starting twice (I hope)
function GM_main() {
	onload();
}
onload();
