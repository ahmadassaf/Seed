try{
	
	$.import("harubixMatch.WebContent","DBpediaLib");
	var loConn = $.db.getConnection();
	var resultBody;
	
	var qString = $.request.parameters.get("query");
	
	if(qString != null) {
		if($.request.parameters.get("filter") == "attributes") {
			
			// Filter for attributes
			resultBody = "{"+getAttributes(qString, null)+"}";
			
		} else if($.request.parameters.get("filter") == "outgoingAssociations") {
			
			// Filter for outgoing associations
			resultBody = "{"+getOutgoingAssociations(qString, null)+"}";
			
		} else if($.request.parameters.get("filter") != undefined) {
			
			resultBody = "{"+getWithFilter(qString, $.request.parameters.get("filter"))+"}";
			
		} else {
		
			// Only query parameter is set, so:
			// - you know the exact URI
			// - you get everything we have back
			resultBody = getAllWeKnow(qString);
		}
		
	} else {
		resultBody = '{"abstract":"Nothing found!", "attributes":[], "outgoingAssociations":[]}';
	}
	
	loConn.close();

	$.response.setBody(resultBody);
	$.response.status = $.net.http.OK;
	
}catch(e) {
	resultBody += e.toString();
}

function getWithFilter(queryString, filter) {
	var filterJSON = JSON.parse(filter);
	var result = "";
	if(filterJSON.abstract === true) {
		result += getAbstract(queryString)+",";
	}
	if(filterJSON.thumbnail === true) {
		result += getThumbnail(queryString)+",";
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
}

function getAbstract(queryString) {
	
	var counter = 0;
	var result = "\"abstract\":";
	var ps = loConn.prepareStatement("SELECT \"abstract\" FROM \"DBPEDIA5\".\"ABSTRACTS\" WHERE \"uri\" = '"+queryString+"'");
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		result += "\""+encodeURIComponent(rs.getString(1))+"\"";
		counter++;
	}
	ps.close();
	if(counter == 0) {
		result += "\"\"";
	}
	return result;
	
}

function getThumbnail(queryString) {
	
	var result = "\"thumbnail\":\"";
	
	var ps = loConn.prepareStatement("SELECT \"value\" FROM \"DBPEDIA5\".\"IMAGES\" WHERE \"uri\" = '"+queryString+"' AND \"type\" = 'thumbnail'");
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		result += rs.getString(1);
	}
	ps.close();
	result += "\"";
	return result;
	
}

function getAttributes(queryString, filter) {
	
	var counter = 0;
	var result = "\"attributes\": [";
	var ps;
	if(filter == null) {
		ps = loConn.prepareStatement("SELECT \"type\", \"value\" FROM \"DBPEDIA5\".\"RAWPROPERTIES\" WHERE \"uri\" = '"+queryString+"'");
	} else {
		var stmt = "SELECT \"type\", \"value\" FROM \"DBPEDIA5\".\"RAWPROPERTIES\" WHERE \"uri\" = '"+queryString+"' AND (";
		for(var i=0; i<filter.length; i++) {
			stmt += " \"type\" = 'http://dbpedia.org/property/" + filter[i].type + "' OR";
		}
		stmt = stmt.substring(0, stmt.length-3);
		stmt += ")";
		ps = loConn.prepareStatement(stmt);
	}
	ps.execute();
	var rs = ps.getResultSet();
	while(rs.next()) {
		result += "{\"type\":\""+encodeURIComponent(rs.getString(1))+"\",\"value\":\""+encodeURIComponent(rs.getString(2))+"\"},";
		counter++;
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return result;
	
}

function getOutgoingAssociations(queryString, filter) {
	
	var counter = 0;
	var result = "\"outgoingAssociations\": [";
	var ps;
	if(filter == null) {
		ps = loConn.prepareStatement("SELECT \"type\", \"target\" FROM \"DBPEDIA5\".\"ASSOCIATIONS\" WHERE \"source\" = '"+queryString+"'");
	} else {
		var stmt = "SELECT \"type\", \"target\" FROM \"DBPEDIA5\".\"ASSOCIATIONS\" WHERE \"source\" = '"+queryString+"' AND (";
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
		result += "{\"type\":\""+rs.getString(1)+"\",\"value\":\""+rs.getString(2)+"\"},";
		counter++;
	}
	ps.close();
	if(counter != 0) {
		result = result.substring(0, result.length-1);
	}
	result += "]";
	return result;
	
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

function getAllWeKnow(queryString) {
	
	
	var result = "{";
	result += getAbstract(queryString)+",";
	result += getThumbnail(queryString)+",";
	result += getAttributes(queryString, null)+",";
	result += getOutgoingAssociations(queryString, null);
	result += "}";
	
	return result;
}