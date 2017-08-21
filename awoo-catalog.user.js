// ==UserScript==
// @name 		awoo catalog
// @namespace 	https://niles.xyz
// @include 	http://boards.lolis.download/*
// @include 	https://niles.lain.city/*
// @version		1.0
// @grant 		GM_getValue
// @grant 		GM_setValue
// @run-at 		document-end
// ==/UserScript==
var started = false;
var page = 1;
var onload = function() {

	// Only start once
	if (started) {
		return;
	}
	started = true;
	page_count_container = document.getElementById("pagecount_container");
	if (document.getElementById("load_next_button") === null) {
		var btn = document.createElement("button");
		btn.id = "load_next_button";
		btn.innerText = "load page " + (page + 1);
		btn.addEventListener("click", function() {
			var href = document.location.href;
			if (href[href.length - 1] == "/") href = href.substr(0, href.length - 1);
			var board = href.substr(href.lastIndexOf("/") + 1);
			var url = document.location.href + "?page=" + page.toString();
			page++;
			btn.innerText = "load page " + (page + 1);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				var done = this.DONE || 4;
				if (this.readyState === done) {
					var parser = new DOMParser();
					var doc = parser.parseFromString(xhr.responseText, "text/html");
					var are_we_there_yet = false;
					Array.prototype.slice.call(doc.getElementById("sitecorner").children, 0).forEach(function(elem) {
						if (!are_we_there_yet) {
							are_we_there_yet = elem.tagName == "HR";
						} else {
							if (elem.id = "pagecount_container") {
								are_we_there_yet = false;
								return;
							}
							document.getElementById("sitecorner").insertBefore(elem, page_count_container);
							if (elem.hasAttribute("data-replies")) {
								doTheThing(elem);
							}
						}
					});
				}
			};
			xhr.open("GET", url);
			xhr.send();
		});
		page_count_container.appendChild(document.createElement("br"));
		page_count_container.appendChild(btn);
	}

	Array.prototype.slice.call(document.getElementsByTagName("a"), 0).forEach(doTheThing);
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
	var oldreplies = GM_getValue(key, -1);
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
	console.log(key);
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
