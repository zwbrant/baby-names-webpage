/*CSE 154 HW9
  Zane Brant
  ID: 1065974
  Section AI
  6-4-2014
  Adds all searching and data display functionality to the "Baby Names"
  page. User can select a gender and a name from a list generated from 
  the server's database, then press search to display its meaning, popularity based
  on year, and matching celebrities (matching first name)--all retrieved
  from the server. Server request errors are displayed at the bottom
  of the page, and if there's no ranking data for a given name, a message
  saying as such will display in popularity area. If there's no matching
  celebrities, nothing will be displayed in the respective area.*/

(function() {
	"use strict";
	//Sets page to retrieve data from. Changing this may require modification 
	//of all retrieval functions.
	var SERVICE = "https://webster.cs.washington.edu/cse154/babynames.php";
	
	//Populates name selection menu and adds clicking functionality 
	//to the search button
	window.onload = function() {
		addNames();
		document.getElementById("search").onclick = search;
	};

	//Retrieves data from the preset server. Depending on given parameters,
	//this data will be related to name meaning, name popularity, or matching celebrities
	function retrieve(params) {
		var request = new XMLHttpRequest();
		request.open("GET", SERVICE + params, false);
		request.send();
		return request;
	} 

	//Checks a given server response for errors, displaying the relevant server
	//status code and what the server returned. Reports the given type of request
	//(meaning, popularity, celebrities).
	function errorCheck(response, type) {
		var errArea = document.getElementById("errors");
		var errMessage = "Error retrieving " + type + " data using Ajax request.";
		errMessage += " Server Status: " + response.status + " - ";
		errMessage += response.statusText + ". Server response text: " + response.responseText + ".";
		//Makes message red
		errArea.classList.add("red");
		errArea.innerHTML = errMessage;
		
	}

	//Retrieves the name data and populates the name selection menu with these names
	function addNames() {
		var nameData = retrieve("?type=list");
		var nameMenu = document.getElementById("allnames");
		var names = nameData.responseText.split("\n");
		//Adds names to name selection menu
		for (var i = 0; i < names.length; i++) {
			var item = document.createElement("option");
			item.innerHTML = names[i];
			nameMenu.appendChild(item);
		}
		//Enables use of name selection menu
		nameMenu.disabled = false;
		document.getElementById("loadingnames").style.display = "none";
	}

	//Processes the search request and displays the meaning, popularity, and
	//matching celebrities of the current name and gender. Removes previous results
	//and shows loading animations when processing search.
	function search() {
		var currName = document.getElementById("allnames").value;
		var gender = "m";
		//Checks for which gender is selected
		if (document.getElementById("genderf").checked) {
			gender = "f";
		}

		document.getElementById("resultsarea").style.display = "";
		clearResults();
		loadingsOn();
		//Displays the meaning, popularity rankings, and celebs with the same name
		//as the one selected
		getMeaning(currName);
		getPopularity(currName, gender);
		getCelebs(currName, gender);
	}

	//Turns all of the "loading" animations on (besides the intial one next to search)
	function loadingsOn() {
		document.getElementById("loadingmeaning").style.display = "";
		document.getElementById("loadinggraph").style.display = "";
		document.getElementById("loadingcelebs").style.display = "";
	}

	//Resets all the results areas, including error and no rank message areas, to empty
	function clearResults() {
		document.getElementById("meaning").innerHTML = "";
		document.getElementById("graph").innerHTML = "";
		document.getElementById("celebs").innerHTML = "";
		document.getElementById("errors").innerHTML = "";
		document.getElementById("norankdata").innerHTML = "";
	}

	//Retrieves the selected name's meaning and displays it in the meaning area.
	//Must provide currently selected name.
	function getMeaning(currName) {
		var meaningData = retrieve("?type=meaning&name=" + currName);
		//Checks for server request errors and displays appropriate message if there is one
		if (meaningData.status != 200) {
			errorCheck(meaningData, "Meaning");
		} else {
			var meaningArea = document.getElementById("meaning");
			meaningArea.innerHTML = meaningData.responseText;
		}
		document.getElementById("loadingmeaning").style.display = "none";
	}
	//Retrieves the selected name's popularity rankings and displays it in the popularity area.
	//Creates bar graph of ranking data by decade.
	//Must provide currently selected name and gender.
	function getPopularity(currName, gender) {
		var popularityData = retrieve("?type=rank&name=" + currName + "&gender=" + gender);
		var noDataArea = document.getElementById("norankdata");
		var graph = document.getElementById("graph");
		//Checks if name is in ranking data, and displays message saying as such if it isn't
		if (popularityData.status == 410) {
			noDataArea.innerHTML = "There is no ranking data for that name/gender combination.";
			noDataArea.style.display = "";
		//Checks for server request errors and displays appropriate message if there is one
		} else if (popularityData.status != 200) {
			errorCheck(popularityData, "Popularity");
		} else {
			var ranks = popularityData.responseXML.getElementsByTagName("rank");
			//Creates year header row and row of ranking bars
			var yearsRow = document.createElement("tr");
			var rankRow = document.createElement("tr");
			graph.appendChild(yearsRow);
			graph.appendChild(rankRow);

			//Fills the aformentioned rows with data (years and rankings)
			for (var i = 0; i < ranks.length; i++) {
				var year = document.createElement("th");
				year.innerHTML = ranks[i].getAttribute("year");
				yearsRow.appendChild(year);

				var rank = ranks[i].textContent;
				var rankBar = document.createElement("div");
				//Determines height of ranking bar by using the year's ranking
				var barHeight = parseInt((1000 - rank) / 4);
				//Makes rank number red if it's top ten for year, and 
				//gets rid of bars not within the top 999 for the year
				if (rank == 0) {
					barHeight = 0;
				} else if (rank <= 10) {
					rankBar.classList.add("red");
				}
				rankBar.style.height = barHeight + "px";
				rankBar.innerHTML = rank;
				var column = document.createElement("td");
				column.appendChild(rankBar);
				rankRow.appendChild(column);
			}
		}
		document.getElementById("loadinggraph").style.display = "none";
	}

	//Retrieves celebrities with the same first name as the selected name.
	//Displays celebrities in bulleted list in the celebrities area.
	//If there's no matching celebrities, nothing is displayed.
	//Must provide currently selected name and gender.
	function getCelebs(currName, gender) {
		var celebData = retrieve("?type=celebs&name=" + currName + "&gender=" + gender);
		//Checks for server request errors and displays appropriate message if there is one
		if (celebData.status != 200) {
			errorCheck(celebData, "Celebrity");
		} else {
			var actors = JSON.parse(celebData.responseText).actors;
			var celebsArea = document.getElementById("celebs");
			//Adds relevant actors to bullet list
			for (var i = 0; i < actors.length; i++) {
				var actor = document.createElement("li");
				var name = actors[i].firstName + " " + actors[i].lastName;
				actor.innerHTML = name + " (" + actors[i].filmCount + " films) "; 
				celebsArea.appendChild(actor);
			}
		}
		document.getElementById("loadingcelebs").style.display = "none";
	}
})();