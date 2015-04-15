
function sortFinalScore(a, b) {
	return (b.finalScore - a.finalScore);
}

function sortScore(a, b) {
	return (b.score - a.score);
}

function queryEntitiesWithTypes(query, fuzzyStr, limit) {
	var ratingArray = new Array();
	var loConn = $.db.getConnection();
	var queryStr = "SELECT \"uri\", \"type\", score() as score, \"order\", \"incomingno\" from \"DBPEDIA5\".\"TYPES\" WHERE " +
	"CONTAINS(\"uri\", '" +query+ "'"+fuzzyStr+") ORDER BY score DESC, \"incomingno\" DESC LIMIT " + limit;
	var ps = loConn.prepareStatement(queryStr);
	ps.execute();
	var rs = ps.getResultSet();
	var rowCounter = 0;
	var currentURI = "";
	var currentTxtScore;
	var currentIncomingNo;
	var entityCounter = 0;
	var typeCounter = 0;
	while(rs.next()) {
	if(rowCounter == 0) {
		currentURI = rs.getString(1);
		currentTxtScore = rs.getString(3);
		currentIncomingNo = rs.getString(5);
		var str = "";
		str += '{"entity":"'+currentURI+'", "types": [';
		str += '], "txtScore":'+currentTxtScore+', "incomingNo":'+currentIncomingNo+', "finalScore":'+0+'}';
		ratingArray.push(JSON.parse(str));
		rowCounter++;
	}

	if(currentURI != rs.getString(1)) {
		entityCounter++;
		currentTxtScore = rs.getString(3);
		currentIncomingNo = rs.getString(5);
		var str = "";
		str += '{"entity":"'+rs.getString(1)+'", "types": [';
		str += '], "txtScore":'+currentTxtScore+', "incomingNo":'+currentIncomingNo+', "finalScore":'+0+'}';
		ratingArray.push(JSON.parse(str));
	}
	if(!rs.getString(2).startsWith("http://") &&
			rs.getString(2) != "Agent") {
		ratingArray[entityCounter].types.push(JSON.parse('{"name":"'+rs.getString(2)+'","order":'+rs.getString(4)+'}'));
		typeCounter++;
	}
	currentURI = rs.getString(1);
}

ps.close();

loConn.close();

return ratingArray;
	
}

function getEntitiesWithTypes(query, limit, incomingNoWeight, fuzzy, multilang) {
	
	//var result = "";
	var loConn = $.db.getConnection();
	var fuzzyStr = ", FUZZY(1.0,'textSearch=compare')";
	var fuzzyStr2 = "FUZZY(1.0)";
	if(fuzzy != null) {
		fuzzyStr = ", FUZZY("+fuzzy+",'textSearch=compare')";
		fuzzyStr2 = ", FUZZY("+fuzzy+")";
	}
	
	var ratingArray = new Array();
	var queryStr="";
	var q = query;
	var ps;
	var rs;
	if(multilang === true) {
		// Do a quick search in the INTERLANGUAGE table to have a chance at non-englisch words
		queryStr = "SELECT TOP 1 \"uri\", score() from \"DBPEDIA5\".\"INTERLANGUAGE\" WHERE " +
		 "CONTAINS(\"sameas\", '"+q+"'"+fuzzyStr2+") ORDER BY score() DESC";
		ps = loConn.prepareStatement(queryStr);
		ps.execute();
		rs = ps.getResultSet();
		while(rs.next()) {
			if(!rs.getString(1).endsWith("(disambiguation)")) {
				q = rs.getString(1);
			}
			
		}
		ps.close();
	}
		ratingArray = queryEntitiesWithTypes(q, fuzzyStr, limit);
		if(ratingArray.length == 0) {
			// Nothing found.. let's try raw infobox properties!
			ps=loConn.prepareStatement("SELECT TOP 1 \"uri\", score() from \"DBPEDIA5\".\"RAWPROPERTIES\" WHERE "+
					"CONTAINS(\"value\", '"+q+"') ORDER BY score() DESC");
			ps.execute();
			rs=ps.getResultSet();
			while(rs.next()) {
				q = rs.getString(1);
			}
			ps.close();
			ratingArray = queryEntitiesWithTypes(q, fuzzyStr, limit);
		}
		
	if (ratingArray.length > 0) { // found something?
		var biggestIncomingNo = ratingArray[0].incomingNo;
		for(var i=1; i<ratingArray.length; i++) {
			if(ratingArray[i].incomingNo > biggestIncomingNo) {
				biggestIncomingNo = ratingArray[i].incomingNo;
			}
		}
		
		
		for(var i=0; i<ratingArray.length; i++) {
			if(biggestIncomingNo > 0) {
				//ratingArray[i].finalScore = (incomingNoWeight/biggestIncomingNo * ratingArray[i].incomingNo)+(ratingArray[i].txtScore);//-(biggestIncomingNo-ratingArray[i].incomingNo)*incomingNoWeight*(incomingNoWeight/biggestIncomingNo);
				ratingArray[i].finalScore = incomingNoWeight/biggestIncomingNo * (ratingArray[i].incomingNo-(biggestIncomingNo-ratingArray[i].incomingNo)) + ratingArray[i].txtScore;
			} else {
				ratingArray[i].finalScore = ratingArray[i].txtScore;
			}
			if(ratingArray[i].finalScore > 1) {
				ratingArray[i].finalScore = 1.0;
			}
		}
		
		ratingArray.sort(sortFinalScore);
	}

	return ratingArray;
	
}

function getEntities(query, limit, incomingNoWeight, fuzzy, multilang, verbose) {
	
	var ratingArray = getEntitiesWithTypes(query, limit, incomingNoWeight, fuzzy, multilang);
	var result = '{"entities": [';
	for(var i=0; i<ratingArray.length; i++) {
		result += '{"name":"'+ratingArray[i].entity+'","score":'+ratingArray[i].finalScore;
		
		if(verbose === true) {
			result += ',"txtScore":'+ratingArray[i].txtScore+',"incomingNo":'+ratingArray[i].incomingNo;
		}
		
		result += '},';
	}
	if(ratingArray.length > 0) {
		result = result.substring(0, result.length-1);
	}
	result += ']}';
	return result;
	
}

function getCategories(query, limit, incomingNoWeight, orderWeight, fuzzy, multilang, verbose) {
	
	var ratingArray = getEntitiesWithTypes(query, limit, incomingNoWeight, fuzzy, multilang);
	var typeArray = new Array();
	var tmpArray = new Array();
	var result = '{"types": [';
	for(var i=0; i<ratingArray.length; i++) {
		// Consider specific types > less specific types! Use order for that.
		for(var j=0; j<ratingArray[i].types.length; j++) {
			if(tmpArray.indexOf(ratingArray[i].types[j].name) == -1) {
				var tmpStr = '{"name":"'+ratingArray[i].types[j].name+'","score":'+(ratingArray[i].finalScore-((ratingArray[i].types[j].order-1)*orderWeight));
				if(verbose === true) {
					tmpStr += ',"entity":"'+ratingArray[i].entity+'","txtScore":'+ratingArray[i].txtScore+',"incomingNo":'+ratingArray[i].incomingNo+',"order":'+ratingArray[i].types[j].order;
				}
				tmpStr += '}';
				typeArray.push(JSON.parse(tmpStr));
				tmpArray.push(ratingArray[i].types[j].name);
			}
		}
	}
	typeArray.sort(sortScore);
	for(var i=0; i<typeArray.length; i++) {
		result += JSON.stringify(typeArray[i])+',';
	}
	if(typeArray.length > 0) {
		result = result.substring(0, result.length-1);
	}
	result += ']}';
	return result;

}

function compareQueryWithContext(queryResult, typeVector) {
	
	var limit;
	var score;
	if(typeVector.length <= 10) {
		limit = typeVector.length;
	} else {
		limit = 10;
	}
	for(var m=0; m<limit; m++) {
		score = 1.0 - 0.1*m;
		for(var i=0; i<queryResult.length; i++) {
			for(var j=0; j<queryResult[i].types.length; j++) {
				if(queryResult[i].types[j].name == typeVector[m].name) {
					return '{"entity":"'+queryResult[i].entity+'","type":"'+typeVector[m].name+'","score":'+score+'}';
				}
			}
		}
	}
	
	return null;
	
}

function getEntityTypeWithContext(query, context, limit) {
	
	var contextArr = JSON.parse(context).context;
	var resultArray = new Array();
	var typeVector = new Array();
	// Collect all types of the context items
	for(var i=0; i<contextArr.length; i++) {
		var entity = contextArr[i].entity;
		resultArray.push(JSON.parse(getCategories(entity, 10, 0.15, 0.1, 1.0, false, false)));
	}
	
	// Combine and weight them
	for(var i=0; i<resultArray.length; i++) {
		for(var j=0; j<resultArray[i].types.length; j++) {
			var found = false;
			for(var k=0; k<typeVector.length; k++) {
				if(typeVector[k].name == resultArray[i].types[j].name) {
					typeVector[k].score += resultArray[i].types[j].score;
					found = true;
					break;
				}
			}
			if(!found) {
				typeVector.push(JSON.parse('{"name":"'+resultArray[i].types[j].name+'","score":'+resultArray[i].types[j].score+'}'));
			}
		}
	}
	
	typeVector.sort(sortScore);
	
	var queryResult = getEntitiesWithTypes(query, 20, 0.15, 1.0, false, false);
	
	var match = compareQueryWithContext(queryResult, typeVector);
	var result = "";
	if(match != null) {
		result += match;
	} else {
		result = "{}";
	}
	
	return result;
	
}

