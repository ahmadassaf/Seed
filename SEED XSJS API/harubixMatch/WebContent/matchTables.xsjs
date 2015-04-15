var body = $.request.body.asString();
body = decodeURIComponent(body);
var inputData = JSON.parse(body);

// for every column we call the stored procedure which will return a list of possible concepts for every cell
// how do we give the data to the stored procedure?
// do it on a value by value basis! we get 10 possible categories per value, with a rating

function PossibleType(type, rating) {
	
	this.type = type;
	this.rating = rating;
	this.addedRating = 0.0;
	
}
PossibleType.prototype.getType = function() {
	return this.type;
};
PossibleType.prototype.getRating = function() {
	return this.rating;
};
PossibleType.prototype.addRating = function(n) {
	this.addedRating += n;
};
PossibleType.prototype.getRatingSum = function() {
	return this.rating+this.addedRating;
};

function Cell(parentColumn, value) {
	
	this.possibleTypes = new Array();
	this.parentColumn = parentColumn;
	this.value = value.replace(/ /g, "_");
	
}
Cell.prototype.getValue = function() {
	return this.value;
};
Cell.prototype.addPossibleType = function(type) {
	this.possibleTypes.push(type);
	this.parentColumn.addToTypeVector(type);
};
Cell.prototype.getPossibleTypeCount = function() {
	return this.possibleTypes.length;
};
Cell.prototype.getPossibleType = function(i) {
	return this.possibleTypes[i];
};

function Column(array) {
	
	this.cells = new Array();
	this.typeVector = new Array();
	for(var i=0; i<array.length; i++) {
		this.cells.push(new Cell(this, array[i]));
		//test += array[i];
	}
	
}
Column.prototype.getCell = function(i) {
	return this.cells[i];
};
Column.prototype.getCellCount = function() {
	return this.cells.length;
};
Column.prototype.getTypeVector = function() {
	return this.typeVector;
};
Column.prototype.addToTypeVector = function(type) {
	var found = false;
	if(type.getType() != "Agent") {
		for(var i=0; i<this.typeVector.length; i++) {
			if(this.typeVector[i].getType() == type.getType()) {
				this.typeVector[i].addRating(type.getRating());
				found = true;
				break;
			}
		}
		if(!found) {
			this.typeVector.push(type);
		}
	}
};
Column.prototype.getTypeVectorLength = function() {
	var sum = 0.0;
	for(var i=0; i<this.typeVector.length; i++) {
		sum += Math.pow(this.typeVector[i].getRatingSum(), 2);
	}
	return Math.sqrt(sum);
};

function Table(array) {
	
	this.columns = new Array();
	var tmpColumns = new Array();
	// Parse the input data - we want data for columns, not rows -
	// also the number of columns is dynamic!
	for(var i=0; i<array.modelData.length; i++) {
		var columnCounter = 0;
		for(var key in array.modelData[i]) {
			if(tmpColumns[columnCounter] == null) {
				tmpColumns[columnCounter] = new Array();
			}
			tmpColumns[columnCounter][i] = array.modelData[i][key];
			//test = array.modelData[i][key];
			columnCounter++;
		}
	}
	
	for(var i=0; i<tmpColumns.length; i++) {
		this.columns.push(new Column(tmpColumns[i]));
	}
	//test = tmpColumns.length;
}
Table.prototype.getColumn = function(i) {
	return this.columns[i];
};
Table.prototype.getColumnCount = function() {
	return this.columns.length;
};
Table.prototype.getCellCount = function() {
	return this.getColumnCount() * this.columns[0].getCellCount();
};

// Create data structure: dynamic amount of tables, columns, rows
var tables = new Array();
for(var i=0; i<inputData.length; i++) {
	tables.push(new Table(inputData[i]));
}

// Ask the stored procedure for possible types and save them with 
// the rating in the data structure

// Cosine Similarity
function calculateCosineSimilarity(column1, column2) {
	var dotProduct = 0.0;
	var c1vector = column1.getTypeVector();
	var c2vector = column2.getTypeVector();
	for(var i=0; i<c1vector.length; i++) {
		for(var j=0; j<c2vector.length; j++) {
			if(c1vector[i].getType() == c2vector[j].getType()) {
				dotProduct += c1vector[i].getRatingSum() * c2vector[j].getRatingSum();
			}
		}
	}
	return dotProduct / (column1.getTypeVectorLength() * column2.getTypeVectorLength());
}

// Pearson Product-Moment Correlation Coefficient
function calculatePPMCC(column1, column2) {
	// typeVector with greatest length becomes the source
	var source;
	var target;
	var srcArray;
	var tarArray;
	var c1vector = column1.getTypeVector();
	var c2vector = column2.getTypeVector();
	if(c1vector.length >= c2vector.length) {
		source = c1vector;
		target = c2vector;
	} else {
		source = c2vector;
		target = c1vector;
	}
	srcArray = new Array(source.length);
	tarArray = new Array(source.length);
	for(var i=0; i<srcArray.length; i++) {
		srcArray[i] = source[i].getRatingSum();
		var found = false;
		for(var j=0; j<target.length; j++) {
			if(c2vector[j].getType() == source[i].getType()) {
				found = true;
				tarArray[i] = target[j].getRatingSum();
			}
		}
		if(!found) {
			tarArray[i] = 0.0;
		}
	}
	
	var srcSampleMean = 0.0;
	for(var i=0; i<srcArray.length; i++) {
		srcSampleMean += srcArray[i];
	}
	srcSampleMean = srcSampleMean / srcArray.length;
	
	var tarSampleMean = 0.0;
	for(var i=0; i<tarArray.length; i++) {
		tarSampleMean += tarArray[i];
	}
	tarSampleMean = tarSampleMean / tarArray.length;
	
	var srcTarSum = 0.0;
	var srcSumSq = 0.0;
	var tarSumSq = 0.0;
	for(var i=0; i<srcArray.length; i++) {
		srcTarSum += (srcArray[i] - srcSampleMean) * (tarArray[i] - tarSampleMean);
		srcSumSq += Math.pow(srcArray[i] - srcSampleMean, 2);
		tarSumSq += Math.pow(tarArray[i] - tarSampleMean, 2);
	}
	
	var result = srcTarSum / (Math.sqrt(srcSumSq) * Math.sqrt(tarSumSq));
	
	if(isNaN(result)) {
		return 0;
	} else {
		return result;
	}
	
}

function typeVectorSort(a, b) {
	return b.getRatingSum()-a.getRatingSum();
}


var resultBody = "";
try {
var fuzzy = 1.0;
if($.request.parameters.get("fuzzy") != undefined) {
	fuzzy = parseFloat($.request.parameters.get("fuzzy"));
}
var multilang = false;
if($.request.parameters.get("multilang") != undefined && 
		$.request.parameters.get("multilang") === "true") {
	multilang = true;
}
var debug = false;
if($.request.parameters.get("debug") != undefined &&
		$.request.parameters.get("debug") === "true") {
	debug = true;
}

var tyArray = new Array();
// Lets try calling our own api - queryCategory.xsjs! - use xsjslib! :)
$.import("harubixMatch.WebContent","DBpediaLib");
for(var i=0; i<tables.length; i++) {
	for(var j=0; j<tables[i].getColumnCount(); j++) {
		for(var k=0; k<tables[i].getColumn(j).getCellCount(); k++) {
			tyArray = $.harubixMatch.WebContent.DBpediaLib.getCategories(tables[i].getColumn(j).getCell(k).getValue(), 20, 0.15, 0.1, fuzzy, multilang, false);
			tyArray = JSON.parse(tyArray);
			for(var m=0; m<tyArray.types.length; m++) {
				tables[i].getColumn(j).getCell(k).addPossibleType(new PossibleType(tyArray.types[m].name, tyArray.types[m].score));
			}
		}
	}
}

var debugBody = "";
for(var i=0; i<tables.length; i++) {
	debugBody += "<br/>Table1:";
	for(var j=0; j<tables[i].getColumnCount(); j++) {
		debugBody += "<br/>";
		for(var k=0; k<tables[i].getColumn(j).getCellCount(); k++) {
			debugBody += "<br/>"+tables[i].getColumn(j).getCell(k).getValue()+":";
			for(var n=0; n<tables[i].getColumn(j).getCell(k).getPossibleTypeCount(); n++) {
				debugBody += ", "+ tables[i].getColumn(j).getCell(k).getPossibleType(n).getType() + "(" +tables[i].getColumn(j).getCell(k).getPossibleType(n).getRating()+ ")";
			}
		}
	}
}


//Calculate the similarity scores
var cosineArray = new Array();
var jsonResult = '"scores":[';
for(var i=0; i<tables[0].getColumnCount(); i++) {
	cosineArray[i] = JSON.parse('{"column":0, "score":0.0}');
	for(var j=0; j<tables[1].getColumnCount(); j++) {
		var cosine = parseFloat(calculateCosineSimilarity(tables[0].getColumn(i), tables[1].getColumn(j))).toFixed(6);
		if(cosine > cosineArray[i].score) {
			cosineArray[i] = JSON.parse('{"column":'+j+', "score":'+cosine+'}');
		}
		jsonResult += '{"column1":' + i + ',"column2":' + j + ',"cosine":' + 
		parseFloat(calculateCosineSimilarity(tables[0].getColumn(i), tables[1].getColumn(j))).toFixed(6) + ',"ppmcc":' +
		parseFloat(calculatePPMCC(tables[0].getColumn(i), tables[1].getColumn(j))).toFixed(6) + '},';
	}
}



// Do column name suggestion
var matchResult = '"matches":[';
for(var i=0; i<cosineArray.length; i++) {
	var typeVector = tables[0].getColumn(i).getTypeVector();
	typeVector.sort(typeVectorSort);
	matchResult += '{"column1":'+i+',"column2":'+cosineArray[i].column+',"score":'+cosineArray[i].score+', "suggestedName":"'+
		typeVector[0].getType()+'"},';
	
}
matchResult = matchResult.substring(0, matchResult.length-1);
matchResult += ']';

//Output PPMCC
//resultBody += "<br/><br/>Pearson Product-Moment Correlation Coefficient:<br/>";
//for(var i=0; i<tables[0].getColumnCount(); i++) {
//	for(var j=0; j<tables[1].getColumnCount(); j++) {
//		resultBody += "<br/>Column " + i + " and Column " + j + ": " + ;
//	}
//}

jsonResult = jsonResult.substring(0, jsonResult.length-1);
jsonResult += ']';
jsonResult = '{'+matchResult+','+jsonResult;

if(debug === true) {
	jsonResult += ',"debug":"' + debugBody + '"';
}

jsonResult += '}';
resultBody = jsonResult;

} catch(e) {resultBody += e.toString();}
$.response.setBody(resultBody);
$.response.status = $.net.http.OK;
