import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Scanner;

public class ParseTriples {

	final static Charset ENCODING = StandardCharsets.UTF_8;
	
	final static String mappingbasedPropertiesFolder = "/home/madevr/Downloads/dbpedia39/MAPPINGS";
	final static String rawPropertiesFolder = "/home/madevr/Downloads/dbpedia39/RAWPROPERTIES";
	final static String instanceTypesFolder = "/home/madevr/Downloads/dbpedia39/INSTANCES";
	final static String abstractsFolder = "/home/madevr/Downloads/dbpedia39/ABSTRACTS";
	final static String categoriesFolder = "/home/madevr/Downloads/dbpedia39/CATEGORIES";
	final static String categSkosFolder = "/home/madevr/Downloads/dbpedia39/CATEGSKOS";
	final static String disambiguationsFolder = "/home/madevr/Downloads/dbpedia39/DISAMBIGUATIONS";
	final static String interlanguageFolder = "/home/madevr/Downloads/dbpedia39/INTERLANGUAGE";
	final static String imagesFolder = "/home/madevr/Downloads/dbpedia39/IMAGES";
	final static String outputFolder = "/home/madevr/Downloads/dbpediav5";
	final static String schemaName = "DBPEDIA5";
	
	/*final static String mappingbasedPropertiesFolder = "C:\\Users\\D056869\\Downloads\\MAPPINGS";
	final static String instanceTypesFolder = "C:\\Users\\D056869\\Downloads\\INSTANCES";
	final static String abstractsFolder = "C:\\Users\\D056869\\Downloads\\ABSTRACTS";
	final static String categoriesFolder = "C:\\Users\\D056869\\Downloads\\INSTANCES";
	final static String categSkosFolder = "C:\\Users\\D056869\\Downloads\\INSTANCES";
	//final static String inputFilename4 = "C:\\Users\\D056869\\Downloads\\long_abstracts_en.ttl";
	public final static String outputFolder = "C:\\wraptest6";
	final static String schemaName = "PERSON2";*/
	
	/*private static String currentSubjectURI = "";
	private static String dataCSVBuffer = "";
	
	public static void createDataCSV(Triple triple, boolean newSubject) throws IOException {

	    if(newSubject) {
	    	
	    	if(dataCSVBuffer != "") { // not the first call
	    		
	    		
	    		dataCSVBuffer += "\n";
	    		HANATable.get("INFOITEMS").write(dataCSVBuffer);
	    		dataCSVBuffer = "";
	    	}
	    	
	    	if(triple != null) {
	    		dataCSVBuffer = "\""+ triple.getSubjectURI() +"\",0,\"-\"";
	    	}
	    }
		
	}*/
	
	
	private static void processMappingbasedProperties(String mappingbasedPropertiesFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(mappingbasedPropertiesFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					/*if(triple.getSubjectURI().equals(currentSubjectURI)) {
						// same subject, only update internally
						createDataCSV(triple, false);
					} else {
						// actually write the line to CSV and start new one
						createDataCSV(triple, true);
					}*/
					
					if(triple.getObject() instanceof RDFObjectRef) {
						RDFObjectRef ref = (RDFObjectRef) triple.getObject();
						HANATable.get("ASSOCIATIONS").write("\""+triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\"" +
								ref.getURI() + "\"\n");
					} else if(triple.getObject() instanceof RDFObjectLiteral) {
						RDFObjectLiteral lit = (RDFObjectLiteral) triple.getObject();
						HANATable.get("PROPERTIES").write("\"" + triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\"" +
								lit.getStrValue() +  "\",\""+lit.getDatatypeURI()+"\",\""+lit.getLanguage()+"\"\n");
					}
					
					//currentSubjectURI = triple.getSubjectURI();
				}
			}
			scanner.close();
			
			// Write last triple!
			//createDataCSV(null, true);
			
		}
		
	}
	
private static void processRawProperties(String rawPropertiesFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(rawPropertiesFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					/*if(triple.getSubjectURI().equals(currentSubjectURI)) {
						// same subject, only update internally
						createDataCSV(triple, false);
					} else {
						// actually write the line to CSV and start new one
						createDataCSV(triple, true);
					}*/
					
					if(triple.getObject() instanceof RDFObjectRef) {
						RDFObjectRef ref = (RDFObjectRef) triple.getObject();
						String rstr = ref.getURI();
						if(rstr != null && rstr.length() > 4900) { // Precaution
							rstr = rstr.substring(0, 4900);
						}
						HANATable.get("RAWASSOCIATIONS").write("\""+triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\"" +
								rstr + "\"\n");
					} else 
					if(triple.getObject() instanceof RDFObjectLiteral) {
						RDFObjectLiteral lit = (RDFObjectLiteral) triple.getObject();
						String lstr = lit.getStrValue();		   // Check lstr for null - Lisa Arie!
						if(lstr != null && lstr.length() > 4900) { // in the RAWPROPERTIES this happens! The Raven by E.A.P. e.g.
							lstr = lstr.substring(0, 4900);
						}
						HANATable.get("RAWPROPERTIES").write("\"" + triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\"" +
								lstr + "\",\""+lit.getDatatypeURI()+"\",\""+lit.getLanguage()+"\"\n");
					}
					
					//currentSubjectURI = triple.getSubjectURI();
				}
			}
			scanner.close();
			
			// Write last triple!
			//createDataCSV(null, true);
			
		}
		
	}
	
	private static void processInstanceTypes(String instanceTypesFolder) throws IOException {
		
		int lineNo = 0;
		int order = 0;
		String currentURI = "";
		
		File folder = new File(instanceTypesFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					if(lineNo == 0) {
						currentURI = triple.getSubjectURI();
					}
					if(currentURI.equals(triple.getSubjectURI())) {
						order++;
					} else {
						order = 1;
						currentURI = triple.getSubjectURI();
					}
					System.out.println(++lineNo + triple.toString());
					
					RDFObjectRef ref = (RDFObjectRef) triple.getObject();
					/*if(!ref.getURI().equals("http://www.w3.org/2002/07/owl#Thing") &&
					   !ref.getURI().equals("http://schema.org/Place") &&
					   !ref.getURI().equals("http://www.w3.org/1999/02/22-rdf-syntax-ns#type-Agent") &&
					   !ref.getURI().equals("http://schema.org/Organization") &&
					   !ref.getURI().equals("http://schema.org/Country") &&
					   !ref.getURI().equals("http://schema.org/Person") &&
					   !ref.getURI().equals("http://xmlns.com/foaf/0.1/Person") &&
					   !ref.getURI().equals("http://schema.org/CreativeWork") &&
					   !ref.getURI().equals("http://schema.org/Language") &&
					   !ref.getURI().equals("http://schema.org/MusicGroup") &&
					   !ref.getURI().equals("http://dbpedia.org/ontology/Agent")) {*/
						HANATable.get("TYPES").write("\""+triple.getSubjectURI()+"\",\"" + ref.getURI() + "\",\""+order+"\",\n");
					//}
					
				}
				
			}
			scanner.close();
			
		}
		
	}
	
	private static void processCategories(String categoriesFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(categoriesFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					RDFObjectRef ref = (RDFObjectRef) triple.getObject();
					HANATable.get("CATEGORIES").write("\""+triple.getSubjectURI()+"\",\"" + ref.getURI() + "\"\n");
				}
				
			}
			scanner.close();
			
		}
		
	}
	
	private static void processCategSkos(String categSkosFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(categSkosFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					if(triple.getObject() instanceof RDFObjectRef) {
						RDFObjectRef ref = (RDFObjectRef) triple.getObject();
						HANATable.get("CATEGSKOS").write("\""+triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\""+
								ref.getURI() + "\",\n");
					} else if(triple.getObject() instanceof RDFObjectLiteral) {
						RDFObjectLiteral lit = (RDFObjectLiteral) triple.getObject();
						HANATable.get("CATEGSKOS").write("\""+triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\""+
								lit.getStrValue() + "\",\""+lit.getLanguage()+"\"\n");
					}
					
				}
				
			}
			scanner.close();
			
		}
		
	}
	
	private static void processAbstracts(String abstractsFolder) throws IOException {
		
		int lineNo = 0;

		File folder = new File(abstractsFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			String line = scanner.nextLine();
		
			// filter comments
			if(!line.startsWith("#")) {
				
				// Lets hope first line is a correct triple ala <... ;)
				Triple triple = new Triple(line);
				System.out.println(++lineNo + triple.toString());
				
				RDFObjectLiteral lit = (RDFObjectLiteral) triple.getObject();
				HANATable.get("ABSTRACTS").write("\""+triple.getSubjectURI()+"\",\"" + lit.getStrValue() + "\",\""+lit.getLanguage()+"\"");
				
			}
			
			while(scanner.hasNextLine()) {
				
				line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					if(line.startsWith("<")) {
						
						Triple triple = new Triple(line);
						System.out.println(++lineNo + triple.toString());
						
						RDFObjectLiteral lit = (RDFObjectLiteral) triple.getObject();
						HANATable.get("ABSTRACTS").write("\"");
						HANATable.get("ABSTRACTS").write("\n\""+triple.getSubjectURI()+"\",\"" + lit.getStrValue());
						
					} else {
						
						// Detect illegal newline, continue writing in the same line :)
						// Filter: end of line is incorrectly "@en ." => should only be "
						// In this case, the language information is lost
						if(line.endsWith("@en .\"")) {
							line = line.substring(0, line.length()-6);
						}
						HANATable.get("ABSTRACTS").write(line);
						
					}
				}
				
			}
			scanner.close();
			
		}
		
	}

	private static void processDisambiguations(String disambiguationsFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(disambiguationsFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					RDFObjectRef ref = (RDFObjectRef) triple.getObject();
					HANATable.get("DISAMBIGUATIONS").write("\""+triple.getSubjectURI()+"\",\"" + ref.getURI() + "\"\n");
				}
				
			}
			scanner.close();
			
		}
		
	}
	
	private static void processInterlanguage(String interlanguageFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(interlanguageFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					RDFObjectRef ref = (RDFObjectRef) triple.getObject();
					String lang = ref.getURI().substring(7, ref.getURI().indexOf('.', 7));
					String value = ref.getURI().substring(ref.getURI().lastIndexOf('/')+1);
					HANATable.get("INTERLANGUAGE").write("\""+triple.getSubjectURI()+"\",\"" + value + "\",\""+lang+"\"\n");
				}
				
			}
			scanner.close();
			
		}
		
	}

	private static void processImages(String imagesFolder) throws IOException {
		
		int lineNo = 0;
		
		File folder = new File(imagesFolder);
		
		for(File file : folder.listFiles()) {
		
			Path path = Paths.get(file.getAbsolutePath());
			Scanner scanner = new Scanner(path, ENCODING.name());
			
			while(scanner.hasNextLine()) {
				
				String line = scanner.nextLine();
				
				// filter comments
				if(!line.startsWith("#")) {
					
					Triple triple = new Triple(line);
					System.out.println(++lineNo + triple.toString());
					
					//if(triple.getObject() instanceof RDFObjectRef) {
						RDFObjectRef ref = (RDFObjectRef) triple.getObject();
						HANATable.get("IMAGES").write("\""+triple.getSubjectURI()+"\",\"" + triple.getPredicateURI() + "\",\""+
								ref.getURI() + "\"\n");
					//}
					
				}
				
			}
			scanner.close();
			
		}
		
	}

	
	public static void main(String args[]) throws IOException {
	    
		Calendar cal = Calendar.getInstance();
		cal.getTime();
		SimpleDateFormat sdf = new SimpleDateFormat("d.M.Y HH:mm:ss");
		String timeStarted = sdf.format(cal.getTime());
		
		ArrayList<HANATable> tableList = HANATable.initialize(outputFolder, schemaName);
			
		processMappingbasedProperties(mappingbasedPropertiesFolder);
		processRawProperties(rawPropertiesFolder);
		processInstanceTypes(instanceTypesFolder);
		processAbstracts(abstractsFolder); //ADDED A FIX - LOOK FOR ISSUES!
		processCategories(categoriesFolder);
		processCategSkos(categSkosFolder);
		//processDisambiguations(disambiguationsFolder);
		processInterlanguage(interlanguageFolder);
		processImages(imagesFolder);

		for(HANATable table : tableList) {
			table.close();
		}
		
		cal.clear();
		cal = Calendar.getInstance();
		cal.getTime();
		String timeFinished = sdf.format(cal.getTime());
		System.out.println("Started: " + timeStarted + " Finished: " + timeFinished);
	}
}

