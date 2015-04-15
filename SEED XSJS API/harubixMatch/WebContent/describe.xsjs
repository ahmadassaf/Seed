try{
	
	$.import("harubixMatch.WebContent","DBpediaLib");
	var loConn = $.db.getConnection();
	var resultBody = "";
	
	var qString = $.request.parameters.get("query");
	
	if(qString != null) {
		if($.request.parameters.get("filter") == "attributes") {
			
			// Filter for attributes
			//resultBody = "{"+getAttributes(qString, null)+"}";
			
		} else if($.request.parameters.get("filter") == "outgoingAssociations") {
			
			// Filter for outgoing associations
			//resultBody = "{"+getOutgoingAssociations(qString, null)+"}";
			
		} else if($.request.parameters.get("filter") == "incomingAssociations") {
			
			// Filter for incoming associations
			//resultBody = "{"+getIncomingAssociations(qString)+"}";
			
		} else if($.request.parameters.get("filter") != null) {
			
			//resultBody = "{"+getWithFilter(qString, $.request.parameters.get("filter"))+"}";
			
		} else {
		
			// Only query parameter is set, so:
			// - you know the exact URI
			// - you get everything we have back
			resultBody = getMeta(qString);
		}
		
	} else {
		resultBody = '{"abstract":"Nothing found!", "attributes":[], "outgoingAssociations":[]}';
	}
}catch(e) {
	resultBody = '{"exception":"'+ e.toString() + '"}';
}

/*function getWithFilter(queryString, filter) {
	var filterJSON = JSON.parse(filter);
	var result = "";
	if(filterJSON.abstract) {
		result += getAbstract(queryString)+",";
	}
	if(filterJSON.attributes != undefined && filterJSON.attributes.length > 0) {
		result += getAttributes(queryString, filterJSON.attributes)+",";
	} else {
		result += "\"attributes\": [],";
	}
	if(filterJSON.outgoingAssociations != undefined && filterJSON.outgoingAssociations.length > 0) {
		result += getOutgoingAssociations(queryString, filterJSON.outgoingAssociations);
	} else {
		result += "\"outgoingAssociations\": []";
	}
	
	return result;
}*/

function getMeta(queryString) {

	var retStr = "{";
	if(getAbstract(queryString) === true) {
		retStr += "\"abstract\":true";
	} else {
		retStr += "\"abstract\":false";
	}
	
	if(getThumbnail(queryString) === true) {
		retStr += ",\"thumbnail\":true";
	}
	
	retStr += ",\"attributes\": [";
	
	if(getAttributes(queryString).attributes.length > 0) {
		//var attrs = JSON.parse("{"+result+"}");
		for(var i=0; i<getAttributes(queryString).attributes.length; i++) {
   		  retStr += "{\"type\":\""+getAttributes(queryString).attributes[i].type+"\"},";
   	 	};
		retStr = retStr.substring(0, retStr.length-1) + "]";
	} else {
		retStr += "]";
	}
	retStr += ",\"outgoingAssociations\": [";
	
	if(getOutgoingAssociations(queryString).outgoingAssociations.length > 0) {
		//var attrs = JSON.parse("{"+result+"}");
		for(var i=0; i<getOutgoingAssociations(queryString).outgoingAssociations.length; i++) {
   		  retStr += "{\"type\":\""+getOutgoingAssociations(queryString).outgoingAssociations[i].type+"\"},";
   	 	};
		retStr = retStr.substring(0, retStr.length-1) + "]";
	} else {
		retStr += "]";
	}
	
	retStr += "}";
	return retStr;
}

function getAbstract(queryString) {
	
	var count = 0;
	var ps = loConn.prepareStatement("SELECT COUNT(*) FROM \"DBPEDIA5\".\"ABSTRACTS\" " +
			"WHERE \"uri\" = '"+queryString+"'");
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		//result += "\""+encodeURIComponent(rs.getString(1))+"\"";
		count = parseInt(rs.getString(1));
	}
	ps.close();
	if(count === 1) {
		return true;
	} else {
		return false;
	}
}

function getAttributes(queryString, filter) {
	
	var counter = 0;
	var result = "\"attributes\": [";
	var ps;
	if(filter == null) {
		ps = loConn.prepareStatement("SELECT \"type\" FROM \"DBPEDIA5\".\"RAWPROPERTIES\" " +
				"WHERE \"uri\" = '"+queryString+"'");
	} else {
		var stmt = "SELECT \"type\" FROM \"DBPEDIA5\".\"RAWPROPERTIES\" " +
				"WHERE \"uri\" = '"+queryString+"' AND (";
		for(var i=0; i<filter.length; i++) {
			stmt += " \"type\" = '" + filter[i].type + "' OR";
		}
		stmt = stmt.substring(0, stmt.length-3);
		stmt += ")";
		ps = loConn.prepareStatement(stmt);
	}
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		result += "{\"type\":\""+encodeURIComponent(rs.getString(1))+"\"},";
		counter++;
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return JSON.parse('{'+result+'}');
	
}

function getOutgoingAssociations(queryString, filter) {
	
	var counter = 0;
	var result = "\"outgoingAssociations\": [";
	var ps;
	if(filter == null) {
		ps = loConn.prepareStatement("SELECT \"type\" FROM \"DBPEDIA5\".\"ASSOCIATIONS\" " +
				"WHERE \"source\" = '"+queryString+"'");
	} else {
		var stmt = "SELECT \"type\" FROM \"DBPEDIA5\".\"ASSOCIATIONS\" WHERE " +
				"\"source\" = '"+queryString+"' AND (";
		for(var i=0; i<filter.length; i++) {
			stmt += " \"type\" = '" + filter[i].type + "' OR";
		}
		stmt = stmt.substring(0, stmt.length-3);
		stmt += ")";
		ps = loConn.prepareStatement(stmt);
	}
	ps.execute();
	var rs = ps.getResultSet();
	counter = 0;
	while(rs.next()) {
		result += "{\"type\":\""+rs.getString(1)+"\"},";
		counter++;
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return JSON.parse('{'+result+'}');
	
}

function getThumbnail(queryString) {
	
	var count = 0;
	var ps = loConn.prepareStatement("SELECT COUNT(*) FROM \"DBPEDIA5\".\"IMAGES\" " +
			"WHERE \"uri\" = '"+queryString+"' AND \"type\" = 'thumbnail'");
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		count = parseInt(rs.getString(1));
	}
	ps.close();
	if(count === 1) {
		return true;
	} else {
		return false;
	}
}

/*function getDisambiguations(queryString) {
	
	var counter = 0;
	var result = "\"disambiguations\": [";
	
	var ps = loConn.prepareStatement("SELECT \"disambiguation\" FROM \"DBPEDIA5\".\"DISAMBIGUATIONS\" WHERE \"uri\" = '"+queryString+"'");
	ps.execute();
	var rs = ps.getResultSet();
	counter = 0;
	while(rs.next()) {
		result += "{\"type\":\""+rs.getString(1)+"\",\"value\":\"type\"},";
		counter++;
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return result;
	
}*/

/*function getInterlanguage(queryString) {
	
	var counter = 0;
	var result = "\"interlanguage\": [";
	
	var ps = loConn.prepareStatement("SELECT DISTINCT \"uri\" FROM \"DBPEDIA5\".\"INTERLANGUAGE\" WHERE \"sameas\" = '"+queryString+"'");
	ps.execute();
	var rs = ps.getResultSet();
	counter = 0;
	while(rs.next()) {
		if(!rs.getString(1).endsWith("(disambiguation)")) {
			result += "{\"type\":\""+rs.getString(1)+"\",\"value\":\"type\"},";
			counter++;
		}
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return result;
	
}*/

loConn.close();

$.response.setBody(resultBody);
$.response.status = $.net.http.OK;