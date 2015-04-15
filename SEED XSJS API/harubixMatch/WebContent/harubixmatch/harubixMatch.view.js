sap.ui.jsview("harubixmatch.harubixMatch", {

	/** Specifies the Controller belonging to this View. 
	* In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	* @memberOf harubixmatch.harubixMatch
	*/ 
	getControllerName : function() {
		return "harubixmatch.harubixMatch";
	},

	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	* Since the Controller is given to this method, its event handlers can be attached right away. 
	* @memberOf harubixmatch.harubixMatch
	*/ 
	createContent : function(oController) {
		
		////////////////////////////////////////////////////////////////////////////////////////////////////
		// Semantic Enrichment
		////////////////////////////////////////////////////////////////////////////////////////////////////
		
		var oEnrichLayout = new sap.ui.commons.layout.VerticalLayout();
		var oEnrichControlsLayout = new sap.ui.commons.layout.HorizontalLayout();
		var oEnrichSearch = new sap.ui.commons.SearchField("searchEnrich",{
			searchProvider: new sap.ui.core.search.OpenSearchProvider({
				suggestType: "json",
				suggestUrl: "disambiguate.xsjs?query={searchTerms}&entityMode=true&limit=50&fuzzy=0.9&multilang=true&openSearch=true"
			}),
			enableListSuggest: true,
			showListExpander: false,
			search: function(oEvent) {
				oController.enrichEntity(oEvent.getParameter("query"));
			}
		});
		
		var oEnrichLoadFilterButton = new sap.ui.commons.Button("btnEnrichLoadFilter",{
			text:"Load Filter",
			press: function() {oController.enrichLoadFilter(oEnrichSearch.getValue());}
		});
		var oEnrichResetFilterButton = new sap.ui.commons.Button("btnEnrichResetFilter",{
			text:"Reset Filter",
			press: function() {oController.enrichResetFilter();}
		});
		
		oEnrichControlsLayout.addContent(oEnrichSearch);
		oEnrichControlsLayout.addContent(oEnrichLoadFilterButton);
		oEnrichControlsLayout.addContent(oEnrichResetFilterButton);

		var oFilterPanel = new sap.ui.commons.Panel("pnEnrichFilter",{
			title: new sap.ui.core.Title({text: "Filter"})
		});
		var oEnrichThumbnailPanel = new sap.ui.commons.Panel("pnEnrichThumbnail",{
			title: new sap.ui.core.Title({text: "Thumbnail"}),
			content: new sap.ui.commons.Image("imgThumbnail")
		});
		var oEnrichAbstractPanel = new sap.ui.commons.Panel("pnEnrichAbstract",{
			title: new sap.ui.core.Title({text: "Abstract"}),
			width: "700px",
			content: new sap.ui.commons.FormattedTextView("queryDataResultAbstract")
		});
		var oEnrichAttributesPanel = new sap.ui.commons.Panel({
			title: new sap.ui.core.Title({text: "Attributes"}),
			width: "300px",
			content: new sap.ui.commons.FormattedTextView("queryDataResultAttributes")
		});
		var oEnrichOutgoingPanel = new sap.ui.commons.Panel("pnEnrichOutgoing",{
			title: new sap.ui.core.Title({text: "Outgoing associations"}),
			content: new sap.ui.commons.FormattedTextView("queryDataResultOutgoing")
		});
		
		var oEnrichResultLeftLayout = new sap.ui.commons.layout.VerticalLayout();
		oEnrichResultLeftLayout.addContent(oEnrichAbstractPanel);
		oEnrichResultLeftLayout.addContent(oEnrichOutgoingPanel);
		
		var oEnrichResultRightLayout = new sap.ui.commons.layout.VerticalLayout();
		oEnrichResultRightLayout.addContent(oEnrichThumbnailPanel);
		oEnrichResultRightLayout.addContent(oEnrichAttributesPanel);
		
		var oEnrichResultLayout = new sap.ui.commons.layout.HorizontalLayout();
		oEnrichResultLayout.addContent(oEnrichResultLeftLayout);
		oEnrichResultLayout.addContent(oEnrichResultRightLayout);

		oEnrichLayout.addContent(oEnrichControlsLayout);
		oEnrichLayout.addContent(oFilterPanel);
		oEnrichLayout.addContent(oEnrichResultLayout);
		
		////////////////////////////////////////////////////////////////////////////////////////////////////
		// Entity Disambiguation
		////////////////////////////////////////////////////////////////////////////////////////////////////
		
		var oDisambiguateLayout = new sap.ui.commons.layout.HorizontalLayout();
		
		var oDisambiguateLeftLayout = new sap.ui.commons.layout.VerticalLayout({width:"700px"});
		var oDisambiguateControlsLayout = new sap.ui.commons.layout.VerticalLayout();
		oDisambiguateLayout.addContent(oDisambiguateLeftLayout);
		oDisambiguateLayout.addContent(oDisambiguateControlsLayout);

		var oDisambiguateSearch = new sap.ui.commons.SearchField("searchDisambiguate",{
			width: "300px",
			enableListSuggest: false,
			search: function(oEvent) {
				oController.disambiguate(oEvent.getParameter("query"), oQueryCategoryExhaustiveInput.getValue(),
						oQueryCategoryIncInput.getValue(), oQueryCategoryParamInput.getValue(),
	            		oRadioEntity.getSelected(), oQueryCategoryFuzzyMode.getValue(), oDescribeContextText.getValue(),
	            		oDescribeMultilangCheckbox.getChecked(), oDescribeVerbose.getChecked());
			}
		});

		var oQueryCategoryExhaustiveInput = new sap.ui.commons.TextField("txtExhaustiveLimit",{value:"75"});
		var oQueryCategoryParamInput = new sap.ui.commons.TextField("txtParamWeight",{value:"0.1"});
		var oQueryCategoryIncInput = new sap.ui.commons.TextField({value:"0.15"});
		var oRadioEntity = new sap.ui.commons.RadioButton({
			text : 'Entity Mode',
			tooltip : '',
			groupName : 'Group1',
				selected : true
		});
		var oRadioCategory = new sap.ui.commons.RadioButton({
			text : 'Category Mode',
			tooltip : '',
			groupName : 'Group1'
		});
		var oQueryCategoryFuzzyMode = new sap.ui.commons.TextField("txtFuzzyMode",{value:"1.0"});
		var oDescribeContextText = new sap.ui.commons.TextField("txtDescribeContext");
		var oDescribeMultilangCheckbox = new sap.ui.commons.CheckBox("chkMultilang",{text:"Multilanguage"});
		var oDescribeVerbose = new sap.ui.commons.CheckBox("chkVerbose",{text:"Verbose"});

		oDisambiguateLeftLayout.addContent(oDisambiguateSearch);
		oDisambiguateLeftLayout.addContent(new sap.ui.commons.FormattedTextView("queryCategoryResult"));
		oDisambiguateControlsLayout.addContent(oRadioEntity);
		oDisambiguateControlsLayout.addContent(oRadioCategory);
		oDisambiguateControlsLayout.addContent(new sap.ui.commons.Label({text:"Limit: "}));
		oDisambiguateControlsLayout.addContent(oQueryCategoryExhaustiveInput);
		oDisambiguateControlsLayout.addContent(new sap.ui.commons.Label({text:"Order weight: "}));
		oDisambiguateControlsLayout.addContent(oQueryCategoryParamInput);
		oDisambiguateControlsLayout.addContent(new sap.ui.commons.Label({text:"incomingNoWeight: "}));
		oDisambiguateControlsLayout.addContent(oQueryCategoryIncInput);
		oDisambiguateControlsLayout.addContent(new sap.ui.commons.Label({text: "Fuzzy parameter: "}));
		oDisambiguateControlsLayout.addContent(oQueryCategoryFuzzyMode);
		oDisambiguateControlsLayout.addContent(new sap.ui.commons.Label({text:"Enter context separated by comma: "}));
		oDisambiguateControlsLayout.addContent(oDescribeContextText);
		oDisambiguateControlsLayout.addContent(oDescribeMultilangCheckbox);
		oDisambiguateControlsLayout.addContent(oDescribeVerbose);
		
		
		////////////////////////////////////////////////////////////////////////////////////////////////////
		// Table Matching
		////////////////////////////////////////////////////////////////////////////////////////////////////
		
		var oSchemaMatchingLayout = new sap.ui.commons.layout.VerticalLayout();
		var oMatchTablesLayout = new sap.ui.commons.layout.HorizontalLayout();
		var oMatchControlsLayout = new sap.ui.commons.layout.VerticalLayout();
		var oMatchResultLayout = new sap.ui.commons.layout.HorizontalLayout();
		oSchemaMatchingLayout.addContent(oMatchTablesLayout);
		oSchemaMatchingLayout.addContent(oMatchControlsLayout);
		oSchemaMatchingLayout.addContent(oMatchResultLayout);
		
		var table1Data = [
		  {"fruit":"Apple","company":"Microsoft","country":"Spain"},
		  {"fruit":"Ananas","company":"Apple","country":"Deutschland"},
		  {"fruit":"Strawberry","company":"SAP AG","country":"Germany"},
		  {"fruit":"Carrot","company":"Siemens","country":"Austria"}
		];		
		
		var table2Data = [
		  {"fruit":"Grape","company":"Google","country":"Schweiz"},
		  {"fruit":"Birne","company":"micrsoft","country":"Italy"},
		  {"fruit":"Straberry","company":"Aple","country":"France"},
		  {"fruit":"Kartoffel","company":"Siemens","country":"Deutschland"}
		];
	
		var oTable1 = new sap.ui.table.Table("table1",{
			title: "Table 1",
			visibleRowCount: 4,
			selectionMode: sap.ui.table.SelectionMode.Single,
			fixedColumnCount: 3,
			width: "350px",
			editable: true
		});
		
		var oTable2 = new sap.ui.table.Table("table2",{
			title: "Table 2",
			visibleRowCount: 4,
			selectionMode: sap.ui.table.SelectionMode.Single,
			fixedColumnCount: 3,
			width: "350px",
			editable: true
		});
		
		oTable1.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "???"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "fruit"),
			sortProperty: "fruit",
			filterProperty: "fruit",
			width: "100px"
		}));
		
		oTable1.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "???"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "company"),
			sortProperty: "company",
			filterProperty: "company",
			width: "100px"
		}));
		
		oTable1.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "???"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "country"),
			sortProperty: "country",
			filterProperty: "country",
			width: "100px"
		}));
		
		oTable2.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Fr"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "fruit"),
			sortProperty: "fruit",
			filterProperty: "fruit",
			width: "100px"
		}));
		
		oTable2.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Co"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "company"),
			sortProperty: "company",
			filterProperty: "company",
			width: "100px"
		}));
		
		oTable2.addColumn(new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Cou"}),
			template: new sap.ui.commons.TextField().bindProperty("value", "country"),
			sortProperty: "country",
			filterProperty: "country",
			width: "100px"
		}));
		
		var oModel1 = new sap.ui.model.json.JSONModel();
		oModel1.setData({modelData: table1Data});
		oTable1.setModel(oModel1);
		oTable1.bindRows("/modelData");
		
		var oModel2 = new sap.ui.model.json.JSONModel();
		oModel2.setData({modelData: table2Data});
		oTable2.setModel(oModel2);
		oTable2.bindRows("/modelData");
		
		var oButtonMatch = new sap.ui.commons.Button("btnMatch",{text:"Match!"});
		var oMatchFuzzyText = new sap.ui.commons.TextField("txtFuzzy",{value:"1.0"});
		var oMatchMultilangCheckBox = new sap.ui.commons.CheckBox("chkMatchMultilang",{text:"Multilanguage"});
		var oMatchDebugCheckBox = new sap.ui.commons.CheckBox("chkDebug",{text:"Debug information"});

		var mResult = new sap.ui.commons.FormattedTextView("result");

		oButtonMatch.attachPress(null, function(mEvent){    
            oController.onMatch('['+oTable1.getModel().getJSON()+','+oTable2.getModel().getJSON()+']',
            		oMatchFuzzyText.getValue(), oMatchMultilangCheckBox.getChecked(), oMatchDebugCheckBox.getChecked()); });
		
		oMatchTablesLayout.addContent(oTable1);
		oMatchTablesLayout.addContent(oTable2);
		oMatchTablesLayout.addContent(oMatchControlsLayout);
		oMatchControlsLayout.addContent(new sap.ui.commons.Label({text:"Fuzzy parameter:"}));
		oMatchControlsLayout.addContent(oMatchFuzzyText);
		oMatchControlsLayout.addContent(oMatchMultilangCheckBox);
		oMatchControlsLayout.addContent(oMatchDebugCheckBox);
		oMatchControlsLayout.addContent(oButtonMatch);
		oMatchResultLayout.addContent(mResult);
		
		var oShell = new sap.ui.ux3.Shell("myShell", {
			appTitle: "Explore DBpedia 3.9 on SAP HANA",
			appIcon: "http://www.sap.com/global/images/SAPLogo.gif",
			appIconTooltip: "SAP logo",
			showLogoutButton: false,
			showSearchTool: false,
			showInspectorTool: false,
			showFeederTool: false,
			worksetItems: [new sap.ui.ux3.NavigationItem("WI_disambiguate",{key:"wi_enrich",text:"Entity disambiguation"}),
			               new sap.ui.ux3.NavigationItem("WI_enrich",{key:"wi_disambiguate",text:"Entity enrichment"}),
			               new sap.ui.ux3.NavigationItem("WI_match",{key:"wi_match",text:"Table matching"})],
			content: oDisambiguateLayout,
			worksetItemSelected: function(oEvent){
				var sId = oEvent.getParameter("id");
				var oShell = oEvent.oSource;
				switch (sId) {
				case "WI_enrich":
					oShell.setContent(oEnrichLayout);
					break;
				case "WI_disambiguate":
					oShell.setContent(oDisambiguateLayout);
					break;
				case "WI_match":
					oShell.setContent(oSchemaMatchingLayout);
					break;
				default:
					break;
				}
			}
		});
		oShell.placeAt("content");
		
	}

});
