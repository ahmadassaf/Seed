sap.ui.controller("harubixmatch.harubixMatch", {
	
	onMatch: function(combinedStr, fuzzy, multilang, debug){ 
		sap.ui.core.BusyIndicator.show();
        var aUrl = 'matchTables.xsjs?fuzzy='+fuzzy+'&multilang='+multilang+'&debug='+debug;  
        jQuery.ajax({    
                  url: aUrl,    
                  type: 'POST',    
                  dataType: 'json', 
                  data: combinedStr,
                  success: this.onCompleteMatch,    
                  error: this.onErrorCall });    
	},
	
	enrichResetFilter: function() {
		sap.ui.getCore().byId("pnEnrichFilter").destroyContent();
	},
	
	enrichLoadFilter: function(queryString) {
		aUrl = 'describe.xsjs?query='+queryString;
		jQuery.ajax({    
            url: aUrl,    
            type: 'POST',    
            dataType: 'json', 
            //data: '{"queryString":"'+queryString+'"}',
            success: this.onQueryMetaComplete,    
            error: this.onErrorCall });
	},
	
	buildQueryDataURL: function(queryString) {
		
		var url = 'enrich.xsjs?query='+queryString;
		var counter = 0;
		
		if(sap.ui.getCore().byId("pnEnrichFilter").getContent().length > 0) {
			
			url += '&filter={';
			
			if(sap.ui.getCore().byId("chkAbstract") != null) {
		 		url += '"abstract":' + sap.ui.getCore().byId("chkAbstract").getChecked();
		 	} else {
		 		url += '"abstract":false';
		 	}
			
			if(sap.ui.getCore().byId("chkThumbnail") != null) {
				url += ',"thumbnail":' + sap.ui.getCore().byId("chkThumbnail").getChecked();
			} else {
				url += ',"thumbnail":false';
			}
			
			url += ',"attributes":[';
			$.each(sap.ui.getCore().byId("pnEnrichFilter").getContent(), function(index, object) {
				
	   		 	if(object.getId().substring(0, 7) === "chkAttr" && object.getChecked()) {	
	   		 		url += '{"type":"' + encodeURIComponent(object.getText()) + '"},';
	   		 		counter++;
	   		 	}
	   	 	});
			if(counter != 0) {
				url = url.substring(0, url.length-1);
			}
			counter = 0;
			url += '],"outgoingAssociations":[';
			$.each(sap.ui.getCore().byId("pnEnrichFilter").getContent(), function(index, object) {
				
	   		 	if(object.getId().substring(0, 6) === "chkOut" && object.getChecked()) {	
	   		 		url += '{"type":"' + encodeURIComponent(object.getText()) + '"},';
	   		 		counter++;
	   		 	}
	   	 	});
			if(counter != 0) {
				url = url.substring(0, url.length-1);
			}
			url += ']}';
		}
		
		return url;
		
	},
	
	enrichEntity: function(queryString){ 
		sap.ui.core.BusyIndicator.show();
		var aUrl;
		//if(sap.ui.getCore().byId("chkMeta").getChecked()) {
			
		//} else {
			aUrl = this.buildQueryDataURL(queryString);
			jQuery.ajax({    
                url: aUrl,    
                type: 'POST',    
                dataType: 'json', 
                //data: '{"queryString":"'+queryString+'"}',
                success: this.onQueryDataComplete,    
                error: this.onErrorCall });
		//}
            
	},
	
	disambiguate: function(queryString, exhaustiveLimit, incomingNoWeight, orderWeight, entityMode, fuzzyMode, context, multilang, verbose){
		sap.ui.core.BusyIndicator.show();
		var strContext="";
		if(context != "") {
			strContext = '&context={"context":[';
			var cArr = context.split(",");
			
			for(var i=0; i<cArr.length; i++) {
				strContext += '{"entity":"'+cArr[i]+'"},';
			}
			strContext = strContext.substring(0, strContext.length-1);
			strContext += ']}';
		}
        var aUrl = 'disambiguate.xsjs?query='+queryString+'&limit='+exhaustiveLimit+'&incomingNoWeight='+incomingNoWeight+'&orderWeight='+orderWeight+'&entityMode='+entityMode+'&fuzzy='+fuzzyMode+'&multilang='+multilang+'&verbose='+verbose+strContext;
        jQuery.ajax({    
                  url: aUrl,    
                  type: 'POST',    
                  dataType: 'json', 
                  //data: '{"queryString":"'+queryString+'"}',
                  success: this.onQueryCategoryComplete,    
                  error: this.onErrorCall });    
	},
	
	onQueryDataComplete: function(mt){ 
		sap.ui.core.BusyIndicator.hide();
		var oAbstract = sap.ui.getCore().byId("queryDataResultAbstract");  
		var oAttributes = sap.ui.getCore().byId("queryDataResultAttributes");
		var oOutgoing = sap.ui.getCore().byId("queryDataResultOutgoing");
		//mt = JSON.parse(mt);
		var htmlText = "";
		oAbstract.setHtmlText("");
		oAttributes.setHtmlText("");
		oOutgoing.setHtmlText("");
		sap.ui.getCore().byId("imgThumbnail").setSrc("");
	     //if(mt==undefined){ mResult.setText(0); } 
		 if(mt==undefined) {}
	     else{  
	    	if(mt.fuzzy!=undefined) {
	    		 htmlText = "Did you mean (fuzzy):<br/>";
	    		 $.each(mt.fuzzy, function(index, object) {
		    		 htmlText += object.type +": "+ object.value +"<br/>";
		    	 });
	    		 oAbstract.setHtmlText(htmlText);
	    	 } else if(mt.interlanguage!=undefined) {
	    		 htmlText = "Did you mean (English):<br/>";
	    		 $.each(mt.interlanguage, function(index, object) {
		    		 htmlText += object.type +": "+ object.value +"<br/>";
		    	 });
	    		 oAbstract.setHtmlText(htmlText);
	    	 } else if(mt.disambiguations!=undefined) {
	    		 htmlText = "Did you mean:<br/>";
	    		 $.each(mt.disambiguations, function(index, object) {
		    		 htmlText += object.type +": "+ object.value +"<br/>";
		    	 });
	    		 oAbstract.setHtmlText(htmlText);
	    	 } else {
		    	 sap.ui.getCore().byId("imgThumbnail").setSrc(mt.thumbnail);
		    	 htmlText += decodeURIComponent(mt.abstract)+"<br/>";
		    	 oAbstract.setHtmlText(htmlText);
		    	 htmlText = "";
		    	 $.each(mt.attributes, function(index, object) {
		    		 var tystr = decodeURIComponent(object.type);
		    		 if(tystr.substring(0, 28) === "http://dbpedia.org/property/") {
		    			 tystr = tystr.substring(28);
		    		 }
		    		 htmlText += tystr  +": "+ decodeURIComponent(object.value) +"<br/>";
		    	 });
		    	 oAttributes.setHtmlText(htmlText);
		    	 htmlText = "";
		    	 $.each(mt.outgoingAssociations, function(name, object) {
		    		htmlText += object.type +": "+ object.value +"<br/>";
		    	 });
		    	 oOutgoing.setHtmlText(htmlText);
		    	 htmlText += "";
		    	 /*$.each(mt.incomingAssociations, function(name, object) {
		    		 htmlText += object.type +": "+ object.value +"<br/>";
		    	 });*/
	    	 }
	      
	    	 //mResult.setHtmlText(htmlText);
	     //mResult.setText(html1.getSanitizeContent());	 
	     }
	},
	
	onQueryMetaComplete: function(mt){ 
		sap.ui.core.BusyIndicator.hide();
		//var oAbstract = sap.ui.getCore().byId("queryDataResultAbstract");  
		//var oAttributes = sap.ui.getCore().byId("queryDataResultAttributes");
		//var oOutgoing = sap.ui.getCore().byId("queryDataResultOutgoing");
		//var htmlText = "";
		var oFilterPanel = sap.ui.getCore().byId("pnEnrichFilter");
		var done = new Array();
		sap.ui.getCore().byId("pnEnrichFilter").destroyContent();
		//oAbstract.setHtmlText("");
		//oAttributes.setHtmlText("");
		//oOutgoing.setHtmlText("");
		//sap.ui.getCore().byId("imgThumbnail").setSrc("");
		 if(mt==undefined) {}
	     else{  
	    	   	 //sap.ui.getCore().byId("chkMeta").toggle();
	    	   	 if(mt.abstract) {
	    	   		 //htmlText += "true";
	    	   		 var oChkAbstract = new sap.ui.commons.CheckBox("chkAbstract",{text:"Abstract", checked:true});
	    	   		 oFilterPanel.addContent(oChkAbstract);
	    	   	 }
	    	   	 if(mt.thumbnail!=undefined && mt.thumbnail === true) {
	    	   		 var oChkThumbnail = new sap.ui.commons.CheckBox("chkThumbnail",{text:"Thumbnail", checked:true});
	    	   		 oFilterPanel.addContent(oChkThumbnail);
	    	   	 }
	    	   	 var counter = 0;
		    	 $.each(mt.attributes, function(index, object) {
		    		 //htmlText += object.type + "<br/>";
		    		 if(done.indexOf(object.type) == -1) {
		    			 var strty = decodeURIComponent(object.type);
		    			 if(strty.substring(0, 28) === "http://dbpedia.org/property/") {
		    				 strty = strty.substring(28);
		    			 }
			    		 var oChk = new sap.ui.commons.CheckBox("chkAttr"+counter,{text:strty, checked:true});
		    	   		 oFilterPanel.addContent(oChk);
		    	   		 counter++;
		    	 	}
	    	   		done.push(object.type);
		    	 });
		    	 counter = 0;
		    	 $.each(mt.outgoingAssociations, function(index, object) {
		    		 if(done.indexOf(object.type) == -1) {
			    		 var oChk = new sap.ui.commons.CheckBox("chkOut"+counter,{text:object.type, checked: true});
		    	   		 oFilterPanel.addContent(oChk);
		    	   		 counter++;
		    	 	}
		    		 //htmlText += object.type + "<br/>";
		    		 done.push(object.type);
		    	 });
		    //oAbstract.setHtmlText(htmlText);
	    }
	},
	
	onQueryCategoryComplete: function(mt){ 
		sap.ui.core.BusyIndicator.hide();
		var oResult = sap.ui.getCore().byId("queryCategoryResult");
		//mt = JSON.parse(mt);
		var htmlText = "<br/>";
	     //if(mt==undefined){ mResult.setText(0); } 
		 if(mt==undefined) {}
	     else{  
		    	
	    	 if(mt.entity!=undefined) {
	    		 htmlText = "Tryied to use context to determine appropriate entity:<br/>";
	    		 htmlText += "Appropriate entity: " + mt.entity + " with type " + mt.type + " (confidence: " + mt.score + ")";
	    	 } else if(mt.types != undefined) { 
	    	 	$.each(mt.types, function(name, object) {
		    		 htmlText += object.name +": "+ object.score;
		    		 if(object.entity != undefined) {
		    			 htmlText += ", "+object.entity+", txtScore: "+object.txtScore+", incomingNo: "+object.incomingNo+
		    			 	", order: "+object.order;
		    		 }
		    		 htmlText += "<br/>";
		    	 });
		    	} else if(mt.entities != undefined) {
		    		$.each(mt.entities, function(name, object) {
			    		 htmlText += object.name +": " + object.score;
			    		 if(object.txtScore != undefined) {
			    			 htmlText += ", txtScore: "+object.txtScore+", incomingNo: "+object.incomingNo;
			    		 }
			    		 htmlText += "<br/>";
			    	 });
		    	}
	    	 }
	      
	    	 //mResult.setHtmlText(htmlText);
	     //mResult.setText(html1.getSanitizeContent());	 
		 oResult.setHtmlText(htmlText);
	},

	onCompleteMatch: function(mt){    
	    var mResult = sap.ui.getCore().byId("result"); 
	    sap.ui.core.BusyIndicator.hide();
	    var htmlText = ""; 
	    if(mt==undefined){ mResult.setText(0); }    
	     else{
	    	 htmlText += "<br/><br/>";
	    	 htmlText += "The following columns have been matched:<br/>";
	    	 $.each(mt.matches, function(name, object) {
	    		htmlText += 'Column ' + object.column1 + ' and Column ' + object.column2 +
	    			', score: '+object.score + ', suggested column Name: ' + object.suggestedName+'<br/>';
	    	 });
	         htmlText += "<br/>";
	    	 $.each(mt.scores, function(name, object) {
	    		 htmlText += 'Column '+object.column1+ ' with Column '+object.column2+
	    		 	': Cosine: '+object.cosine+' PPMCC: '+object.ppmcc+'<br/>';
	    	 });
	    	 
	    	 htmlText += "<br/><br/>";
	    	 
	    	 if(mt.debug != undefined) {
	    		 htmlText += "Debug:<br/>";
	    		 htmlText += mt.debug;
	    	 }
	    	 
	    	 mResult.setHtmlText(htmlText);
	      
	     }    
	}, 
	
	onErrorCall: function(jqXHR, textStatus, errorThrown){    
        sap.ui.commons.MessageBox.show(jqXHR.responseText,     
                            "ERROR",    
                            "Error in calling Service" );     
       return;    
	},

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf harubixmatch.harubixMatch
*/

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf harubixmatch.harubixMatch
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf harubixmatch.harubixMatch
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf harubixmatch.harubixMatch
*/
//	onExit: function() {
//
//	}

});