import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;


public class HANATable {
	
	private static String outputFolder;
	private static String schemaName;
	
	private String tableName;
	private File tablePath;
	private String[] tableFields;
	private String primaryKey;
	private String tableOptions;
	private String[] indices;
	private Writer writer;
	
	private static ArrayList<HANATable> tableList;
	
	public static ArrayList<HANATable> initialize(String outputFolder, String schemaName) throws IOException {
		
		HANATable.outputFolder = outputFolder;
		HANATable.schemaName = schemaName.toUpperCase();
		
		tableList = new ArrayList<HANATable>();
		
		/*String[] tableFields1 = {
				"uri,VARCHAR(1024),NOT NULL FUZZY SEARCH INDEX ON",
				"incomingno,INTEGER CS_INT,",
				"types,VARCHAR(5000),"
		};
		new HANATable("INFOITEMS", tableFields1, "uri", "UNLOAD PRIORITY 0 AUTO MERGE", null);*/
		
		String[] tableFields2 = {
				"source,VARCHAR(1024),NOT NULL",
				"type,VARCHAR(1024),NOT NULL",
				"target,VARCHAR(1024),NOT NULL"
		};
		String[] indices2 = {
				"assource,source",
				"astarget,target"
		};
		new HANATable("ASSOCIATIONS", tableFields2, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices2);
		
		String[] tableFields2a = {
				"source,VARCHAR(1024),NOT NULL",
				"type,VARCHAR(1024),NOT NULL",
				"target,VARCHAR(5000),NOT NULL"
		};
		String[] indices2a = {
				"rasource,source",
				"ratarget,target"
		};
		new HANATable("RAWASSOCIATIONS", tableFields2a, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices2a);
		
		String[] tableFields3 = {
				"uri,VARCHAR(1024),NOT NULL",
				"type,VARCHAR(1024),NOT NULL",
				"value,VARCHAR(5000),NOT NULL",
				"datatype,VARCHAR(1024),",
				"lang,VARCHAR(10),"
		};
		String[] indices3 = {
				"pruri,uri",
				"prtype,type"
		};
		new HANATable("PROPERTIES", tableFields3, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices3);
		
		String[] indices3a = {
				"rauri,uri",
				"ratype,type"
		};
		new HANATable("RAWPROPERTIES", tableFields3, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices3a);
		
		String[] tableFields4 = {
				"uri,SHORTTEXT(1024),NOT NULL FUZZY SEARCH INDEX ON",
				"type,VARCHAR(1024),NOT NULL",
				"order,INTEGER CS_INT,",
				"incomingno,INTEGER CS_INT,"
		};
		String[] indices4 = {
				"tyuri,uri",
				"tytype,type"
		};
		new HANATable("TYPES", tableFields4, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices4);
		
		String[] tableFields5 = {
				"uri,VARCHAR(1024),NOT NULL",
				"abstract,TEXT CS_TEXT,FUZZY SEARCH INDEX ON",
				"lang,VARCHAR(10),"
		};
		new HANATable("ABSTRACTS", tableFields5, "uri", "UNLOAD PRIORITY 0 AUTO MERGE", null);
		
		String[] tableFields6 = {
				"uri,VARCHAR(1024),NOT NULL FUZZY SEARCH INDEX ON",
				"category,VARCHAR(1024),NOT NULL"
		};
		new HANATable("CATEGORIES", tableFields6, null, "UNLOAD PRIORITY 0 AUTO MERGE", null);
		
		String[] tableFields7 = {
				"source,VARCHAR(1024),NOT NULL",
				"type,VARCHAR(1024),NOT NULL",
				"target,VARCHAR(1024),NOT NULL",
				"lang,VARCHAR(10),"
		};
		String[] indices7 = {
				"casource,source",
				"catarget,target"
		};
		new HANATable("CATEGSKOS", tableFields7, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices7);
		
		/*String[] tableFields8 = {
				"uri,VARCHAR(1024),NOT NULL",
				"disambiguation,VARCHAR(1024),NOT NULL"
		};
		new HANATable("DISAMBIGUATIONS", tableFields8, null, "UNLOAD PRIORITY 0 AUTO MERGE", null);*/
		
		String[] tableFields9 = {
				"uri,VARCHAR(1024),NOT NULL",
				"sameas,VARCHAR(1024),NOT NULL",
				"lang,VARCHAR(10),NOT NULL"
		};
		String[] indices9 = {
				"inuri,uri",
				"insameas,sameas"
		};
		new HANATable("INTERLANGUAGE", tableFields9, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices9);
		
		String[] tableFields10 = {
				"uri,VARCHAR(5000),NOT NULL", // Use 5000 here, there is a very long uri it seems
				"type,VARCHAR(1024),NOT NULL",
				"value,VARCHAR(5000),NOT NULL"
		};
		String[] indices10 = {
				"imuri,uri",
				"imtype,type"
		};
		new HANATable("IMAGES", tableFields10, null, "UNLOAD PRIORITY 0 AUTO MERGE", indices10);
		
		return HANATable.tableList;
		
	}
	
	public static HANATable get(String tableName) {
		
		for(HANATable table : tableList) {
			if(table.getName().equals(tableName)) {
				return table;
			}
		}
		return null;
		
	}
	
	public HANATable(String tableName, String[] tableFields, String primaryKey, String tableOptions, String[] indices) throws IOException {
		
		this.tableName = tableName.toUpperCase();
		this.tableFields = tableFields;
		this.primaryKey = primaryKey;
		this.tableOptions = tableOptions;
		this.indices = indices;
		
		// Create folders and files
		this.tablePath = new File(outputFolder+"/index/"+schemaName+"/"+
				tableName.substring(0, 2)+"/"+tableName+"/");
		tablePath.mkdirs();
		
		this.writer = new BufferedWriter(new OutputStreamWriter(
		          new FileOutputStream(tablePath.getAbsolutePath() + "/data.csv"), "utf-8"));
		
		this.createCTL();
		this.createSQL();
		this.createXML();
		
		HANATable.tableList.add(this);
		
	}
	
	private void createCTL() throws IOException {
		
		Writer writeCTL = new BufferedWriter(new OutputStreamWriter(
		          new FileOutputStream(tablePath.getAbsolutePath() + "/data.ctl"), "utf-8"));
		writeCTL.write("import data\n" +
				"into table \""+schemaName+"\".\""+tableName+"\"\n" +
				"from 'data.csv'\n" +
				"    record delimited by '\\n'\n" +
				"    field delimited by ','\n" +
				"    optionally enclosed by '\"'\n" +
				"error log 'data.err'");
		writeCTL.close();
		
	}
	
	private void createSQL() throws IOException {
		
		String bufferStr = "";
		
		bufferStr = "CREATE COLUMN TABLE \""+schemaName+"\".\""+tableName+"\" (";
		for(String tableField : tableFields) {
			
			String[] tfield = tableField.split(",", -1);
			
			bufferStr += "\n\""+tfield[0]+"\" " + tfield[1] + " " + tfield[2] + ",";
			
		}
		
		if(primaryKey == null) {
			bufferStr = bufferStr.substring(0, bufferStr.length()-1);
		} else {
			bufferStr += "\nPRIMARY KEY (\""+primaryKey+"\")";
		}
		
		bufferStr += ")";
		bufferStr += " "+tableOptions;
		
		// IMPORTANT: No ; as last character in create.sql - import will fail!
		if(indices != null) {
			for(String index : indices) {
				String[] idx = index.split(",", -1);
				bufferStr += ";\nCREATE INDEX \""+idx[0]+"\" ON \""+schemaName+"\".\""+tableName+"\" " +
						"(\""+idx[1]+"\" ASC ) NONLEAF PARTIAL KEY LENGTH 1";
			}
		}
		
		Writer writeSQL = new BufferedWriter(new OutputStreamWriter(
		          new FileOutputStream(tablePath.getAbsolutePath() + "/create.sql"), "utf-8"));
		writeSQL.write(bufferStr);
		writeSQL.close();
		
	}
	
	private void createXML() throws IOException {
		
		String tf = "";
		String keyAttr = "";
		
		if(primaryKey != null) {
			keyAttr = "<Name>"+primaryKey+"</Name>";
		}
		
		for(String tableField : tableFields) {
			String[] tfield = tableField.split(",", -1);
			if(tfield[1].equals("TEXT CS_TEXT") || tfield[1].startsWith("SHORTTEXT")) {
				tf += "has_text_fields ";
				break;
			}
		}
		
		Writer writeXML = new BufferedWriter(new OutputStreamWriter(
		          new FileOutputStream(tablePath + "/table.xml"), "utf-8"));
		writeXML.write("<?xml version='1.0'?>\n"+
		"<Table>\n"+
		"    <Name>"+tableName+"</Name>\n"+
		"    <IT>PHYSICAL_INDEX</IT>\n"+
		"    <TF>language_detection auto_replication auto_create_languages auto_merge public auto_optimize_compression "+tf+"</TF>\n"+
		"    <TFlags>539557901</TFlags>\n"+ // What is this?
		"    <Descr></Descr>\n"+
		"    <IsTmpInd>0</IsTmpInd>\n"+
		"    <MinTPD>-1</MinTPD>\n"+
		"    <MaxTPD>-1</MaxTPD>\n"+
		"    <Flags>0</Flags>\n"+
		"    <MlangLInd></MlangLInd>\n"+
		"    <NeedExtKeyTF>0</NeedExtKeyTF>\n"+
		"    <SType>1</SType>\n"+
		"    <PartSpec></PartSpec>\n"+
	    "    <KeyAttrs>"+keyAttr+"</KeyAttrs>\n"+
		"    <DefPreAttrs></DefPreAttrs>\n"+
		"    <FreeStyleAttrs></FreeStyleAttrs>\n"+
		"    <RangeAttrs></RangeAttrs>\n"+
		"    <AllAttrs>\n");
		int ordpos = -1;
		int fieldid = 200;
		int idxingrp = 0;
		for(String tableField : tableFields) {
			ordpos++;
			fieldid++;
			String[] tfield = tableField.split(",", -1);
			String sqltype = "36";
			String abaptype = "32";
			String trextype = "83";
			String offset = "16";
			String length = "5";
			String attrtype = "STRING";
			int iflags = 1;
			if(ordpos % 2 != 0) {
				iflags = 17;
			}
			if(tfield[1].startsWith("VARCHAR")) {
				length = tfield[1].substring(8, tfield[1].lastIndexOf(')'));
			} else if(tfield[1].startsWith("SHORTTEXT")) {
				length = tfield[1].substring(10, tfield[1].lastIndexOf(')'));
				sqltype = "52";
			} else if(tfield[1].equals("INTEGER CS_INT")) {
				length = "5";
				sqltype = "3";
				abaptype = "32";
				trextype = "73";
				offset = "1";
				attrtype = "INTEGER";
			} else if(tfield[1].equals("TEXT CS_TEXT")) {
				length = "0";
				sqltype = "51";
				abaptype = "32";
				trextype = "86";
				offset = "8";
				attrtype = "TEXT";
			}
			if(tfield[2].contains("FUZZY")){
				iflags += 67108864;
			}
			if(indices != null) {
				for(String index : indices) {
					String[] idx = index.split(",", -1);
					if(idx[1].equals(tfield[0])){
						idxingrp++;
						break;
					}
				}
			}
			writeXML.write("        <Field>\n"+
			"            <Name>"+tfield[0]+"</Name>\n"+
			"            <SQLType>"+sqltype+"</SQLType>\n"+
			"            <ABAPType>"+abaptype+"</ABAPType>\n"+
			"            <TrexType>"+trextype+"</TrexType>\n"+
			"            <MdrsType>0</MdrsType>\n"+
			"            <Constr>0</Constr>\n"+
			"            <Offset>"+offset+"</Offset>\n"+
			"            <Length>"+length+"</Length>\n"+
			"            <Scale>0</Scale>\n"+
			"            <OrdPos>"+ordpos+"</OrdPos>\n"+
			"            <IdxInGrp>"+idxingrp+"</IdxInGrp>\n"+
			"            <Collat></Collat>\n"+
			"            <HasDefVal>0</HasDefVal>\n"+
			"            <FieldId>"+fieldid+"</FieldId>\n"+
			"            <AttrType>AttributeType["+attrtype+"]</AttrType>\n"+
			"            <Group></Group>\n"+
			"            <IntDigs>0</IntDigs>\n"+
			"            <FractDigs>0 </FractDigs>\n"+
			"            <IFlags>"+iflags+"</IFlags>\n"+
			"            <IParams></IParams>\n"+
			"            <FuzzyMode>0</FuzzyMode>\n"+
			"            <MinVal></MinVal>\n"+
			"            <MaxVal></MaxVal>\n"+
			"            <UTFlags>1</UTFlags>\n"+
			"            <UType>1</UType>\n"+
			"        </Field>\n");
		}
		writeXML.write(
			"        <Field>\n"+
			"            <Name>$trex_udiv$</Name>\n"+
			"            <TrexType>73</TrexType>\n"+
			"            <FieldId>5</FieldId>\n"+
			"            <AttrType>AttributeType[INTEGER]</AttrType>\n"+
			"            <Group></Group>\n"+
			"            <IntDigs>0</IntDigs>\n"+
			"            <FractDigs>0 </FractDigs>\n"+
			"            <IFlags>16385</IFlags>\n"+
			"            <IParams></IParams>\n"+
			"            <FuzzyMode>0</FuzzyMode>\n"+
			"            <MinVal></MinVal>\n"+
			"            <MaxVal></MaxVal>\n"+
			"            <UTFlags>0</UTFlags>\n"+
			"            <UType>0</UType>\n"+
			"        </Field>\n"+
			"        <Field>\n"+
			"            <Name>$rowid$</Name>\n"+
			"            <TrexType>66</TrexType>\n"+
			"            <FieldId>7</FieldId>\n"+
			"            <AttrType>AttributeType[FIXED]</AttrType>\n"+
			"            <Group></Group>\n"+
			"            <IntDigs>18</IntDigs>\n"+
			"            <FractDigs>0 </FractDigs>\n"+
			"            <IFlags>134217729</IFlags>\n"+
			"            <IParams></IParams>\n"+
			"            <FuzzyMode>0</FuzzyMode>\n"+
			"            <MinVal></MinVal>\n"+
			"            <MaxVal></MaxVal>\n"+
			"            <UTFlags>0</UTFlags>\n"+
			"            <UType>0</UType>\n"+
			"        </Field>\n");
		
		writeXML.write("    </AllAttrs>\n"+
					   "</Table>");
		writeXML.close();
		
	}
	
	public void write(String str) throws IOException {
		this.writer.write(str);
	}
	
	public String getName() {
		return tableName;
	}
	
	public void close() throws IOException {
		this.writer.close();
	}

}
