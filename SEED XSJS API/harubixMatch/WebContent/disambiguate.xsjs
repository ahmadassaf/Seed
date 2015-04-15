try{

	$.import("harubixMatch.WebContent","DBpediaLib");

	var resultBody = "";
	var queryString = $.request.parameters.get("query").replace(/ /g, "_");
	
	var limit = 75;
	if($.request.parameters.get("limit") != undefined) {
		limit = parseInt($.request.parameters.get("limit"));
	}
	
	var fuzzy = 1.0;
	if($.request.parameters.get("fuzzy") != undefined) {
		fuzzy = parseFloat($.request.parameters.get("fuzzy"));
	}
	
	var multilang = false;
	if($.request.parameters.get("multilang") != undefined &&
			$.request.parameters.get("multilang") === "true") {
		multilang = true;
	}
	
	var incomingNoWeight = 0.15;
	if($.request.parameters.get("incomingNoWeight") != undefined) {
		incomingNoWeight = parseFloat($.request.parameters.get("incomingNoWeight"));
	}
	
	var orderWeight = 0.1;
	if($.request.parameters.get("orderWeight") != undefined) {
		orderWeight = parseFloat($.request.parameters.get("orderWeight"));
	}
	
	var verbose = false;
	if($.request.parameters.get("verbose") != undefined && 
			$.request.parameters.get("verbose") === "true") {
		verbose = true;
	}
	
	if($.request.parameters.get("context") != null) {
		
		// Context was given
		resultBody = getEntityTypeWithContext(queryString, $.request.parameters.get("context"),
				$.request.parameters.get("limit"));
	} else {
		
		if($.request.parameters.get("entityMode") == undefined || $.request.parameters.get("entityMode") == "true") {
			resultBody = getEntities(queryString, limit, incomingNoWeight, fuzzy, multilang, verbose);
		} else {
			resultBody = getCategories(queryString, limit, incomingNoWeight, orderWeight, fuzzy, multilang, verbose);
		}
	
	}
	
	if($.request.parameters.get("openSearch") == "true") {
		var jsonResult = JSON.parse(resultBody);
		resultBody = '["'+queryString+'", [';
		for(var i=0; i<jsonResult.entities.length; i++) {
			resultBody += '"'+jsonResult.entities[i].name+'",';
		}
		if(jsonResult.entities.length > 0) {
			resultBody = resultBody.substring(0, resultBody.length-1);
		}
		resultBody += ']]';
	}
	
	//resultBody += queryString;

	$.response.setBody(resultBody);
	$.response.status = $.net.http.OK;
	
	
}catch(e) {
	resultBody = '{"exception":"'+ e.toString() + '"}';
}

function getEntityTypeWithContext(query, context, limit) {
	return $.harubixMatch.WebContent.DBpediaLib.getEntityTypeWithContext(query, context, limit);
}

function getEntities(query, limit, incomingNoWeight, fuzzy, multilang, verbose) {
	return $.harubixMatch.WebContent.DBpediaLib.getEntities(query, limit, incomingNoWeight, fuzzy, multilang, verbose);
}

function getCategories(query, limit, incomingNoWeight, orderWeight, fuzzy, multilang, verbose) {
	return $.harubixMatch.WebContent.DBpediaLib.getCategories(query, limit, incomingNoWeight, orderWeight, fuzzy, multilang, verbose);
}