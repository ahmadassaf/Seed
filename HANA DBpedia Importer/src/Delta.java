import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.MalformedInputException;
import java.util.ArrayList;
import java.util.Scanner;
import java.util.zip.GZIPInputStream;

public class Delta {
	
	URL url;
	String fileName;
	int addedTriples = 0;
	int removedTriples = 0;
	int ignoredTriples = 0;
	
	private static ArrayList<Delta> deltaList = new ArrayList<Delta>();
	
	public Delta(String strUrl) throws IOException {
		
		this.url = new URL(strUrl);
		this.fileName = url.toString().substring(url.toString().lastIndexOf('/')+1);
		deltaList.add(this);
	}
	
	public String getFileName() {
		return this.fileName;
	}
	
	public String getUrlStr() {
		return this.url.toString();
	}
	
	public String getStatistics() {
		return "Triples added: " + addedTriples + ", removed: " + removedTriples + ", ignored: " + ignoredTriples;
	}
	
	private String determineTable(Triple triple) {
		
		String table = "";
		String pred = triple.getPredicateURI();
		RDFObjectRef ref = null;
		RDFObjectLiteral lit = null;
		if(triple.getObject() instanceof RDFObjectRef) {
			ref = (RDFObjectRef)triple.getObject();
		} else if(triple.getObject() instanceof RDFObjectLiteral) {
			lit = (RDFObjectLiteral)triple.getObject();
		}
		
		if(pred.equals("<http://purl.org/dc/terms/subject>")) {
			table = "CATEGORIES";
		} else if(pred.equals("http://www.w3.org/2004/02/skos/core#prefLabel") ||
				pred.equals("http://www.w3.org/2004/02/skos/core#broader") ||
				(ref != null && ref.getURI().startsWith("http://www.w3.org/2004/02/skos/"))) {
			table = "CATEGSKOS";
		} else if(pred.equals("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")) {
			table = "TYPES";
		} else if(pred.equals("wikiPageDisambiguates")) {
			table = "DISAMBIGUATIONS";
		} else if(pred.equals("http://www.w3.org/2002/07/owl#sameAs")) {
			table = "INTERLANGUAGE";
		} else if(pred.equals("abstract")) {
			table = "ABSTRACTS";
		} else if(pred.equals("http://xmlns.com/foaf/0.1/depiction") ||
				pred.equals("thumbnail") || pred.equals("http://xmlns.com/foaf/0.1/thumbnail") ||
				pred.equals("http://purl.org/dc/elements/1.1/rights")) {
			table = "IMAGES";
		} else if(ref != null) {
			// Write to ASSOCIATIONS & RAWASSOCIATIONS
			table = "ASSOCIATIONS";
		} else if(lit != null) {
			// Write to PROPERTIES & RAWPROPERTIES
			table = "PROPERTIES";
		}
		
		return table;
		
	}
	
	private void commitTable(String table, Triple triple, boolean add) throws IOException, InterruptedException {
		// if add == true  => add triple
		// if add == false => remove triple
		
		// Correct instance, user and password have to be inserted here!
		// We assume we are on the HANA instance itself.
		String[] execArgs = new String[6];
		execArgs[0] = "hdbsql";
		execArgs[1] = "-j";
		execArgs[2] = "-u system";
		execArgs[3] = "-p manager";
		execArgs[4] = "-i 00";
		execArgs[5] = "";
		Process commitProc;
		
		boolean twice = false;
		
		RDFObjectRef ref = null;
		RDFObjectLiteral lit = null;
		if(triple.getObject() instanceof RDFObjectRef) {
			ref = (RDFObjectRef)triple.getObject();
		} else if(triple.getObject() instanceof RDFObjectLiteral){
			lit = (RDFObjectLiteral)triple.getObject();
		}
		
		if(table.equals("CATEGORIES")) {
			
			if(add) {
			
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"CATEGORIES\" VALUES('"+
					triple.getSubjectURI() + "','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"CATEGORIES\" WHERE \\\"uri\\\"='"+
						triple.getSubjectURI() + "' AND \\\"category\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("CATEGSKOS")) {
			// Add language?
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"CATEGSKOS\" VALUES('"+
						triple.getSubjectURI()+"','"+triple.getPredicateURI();
				if(ref != null) {
					execArgs[5] += "','"+ref.getURI()+"')";
				} else if(lit != null) {
					execArgs[5] += "','"+lit.getStrValue()+"')";
				}
			
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"CATEGSKOS\" WHERE \\\"source\\\"='"+
						triple.getSubjectURI()+"' AND \\\"type\\\"='"+triple.getPredicateURI();
				if(ref != null) {
					execArgs[5] += "' AND \\\"value\\\"='"+ref.getURI()+"'";
				} else if(lit != null) {
					execArgs[5] += "' AND \\\"value\\\"='"+lit.getStrValue()+"'";
				}
			}
			
		} else if(table.equals("TYPES")) {
			
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"TYPES\" VALUES('"+
					triple.getSubjectURI()+"','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"TYPES\" WHERE \\\"uri\\\"='"+
					triple.getSubjectURI()+"' AND \\\"type\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("DISAMBIGUATIONS")) {
			
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"DISAMBIGUATIONS\" VALUES('"+
					triple.getSubjectURI()+"','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"DISAMBIGUATIONS\" WHERE \\\"uri\\\"='"+
					triple.getSubjectURI()+"' AND \\\"disambiguation\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("INTERLANGUAGE")) {
			// Add language?
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"INTERLANGUAGE\" VALUES('"+
					triple.getSubjectURI()+"','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"INTERLANGUAGE\" WHERE \\\"uri\\\"='"+
					triple.getSubjectURI()+"' AND \\\"sameas\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("ABSTRACTS")) {
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"ABSTRACTS\" VALUES('"+
					triple.getSubjectURI()+"','"+lit.getStrValue();
			} else {
				// Only one abstract per URI!
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"ABSTRACTS\" WHERE \\\"uri\\\"='"+
						triple.getSubjectURI()+"'";
			}
			
		} else if(table.equals("IMAGES")) {
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"IMAGES\" VALUES('"+
					triple.getSubjectURI()+"','"+triple.getPredicateURI()+
					"','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"IMAGES\" WHERE \\\"uri\\\"='"+
						triple.getSubjectURI()+"' AND \\\"type\\\"='"+triple.getPredicateURI()+
						"' AND \\\"value\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("ASSOCIATIONS")) {
			// Write to ASSOCIATIONS & RAWASSOCIATIONS
			twice = true;
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"RAWASSOCIATIONS\" VALUES('"+
					triple.getSubjectURI()+"','"+triple.getPredicateURI()+
					"','"+ref.getURI()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"RAWASSOCIATIONS\" WHERE \\\"source\\\"='"+
						triple.getSubjectURI()+"' AND \\\"type\\\"='"+triple.getPredicateURI()+
						"' AND \\\"target\\\"='"+ref.getURI()+"'";
			}
			
		} else if(table.equals("PROPERTIES")) {
			// Add language?
			// Write to PROPERTIES & RAWPROPERTIES
			twice = true;
			if(add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"RAWPROPERTIES\" VALUES ('"+
					triple.getSubjectURI()+"','"+triple.getPredicateURI()+"','"+
					lit.getStrValue()+"')";
			} else {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"RAWPROPERTIES\" WHERE \\\"uri\\\"='"+
						triple.getSubjectURI()+"' AND \\\"type\\\"='"+triple.getPredicateURI()+
						"' AND \\\"value\\\"='"+lit.getStrValue()+"'";
			}
			
		}
		
		// To write into both tables at the same time - either use stored procedure
		// or call it here twice. Let's do it here for now.
		
		if(!execArgs[5].equals("")) {
			commitProc = Runtime.getRuntime().exec(execArgs);
			commitProc.waitFor();
			if(twice && add) {
				execArgs[5] = "INSERT INTO \"DBPEDIA5\".\"" + 
						execArgs[5].substring(29);
			} else if(twice && !add) {
				execArgs[5] = "DELETE FROM \"DBPEDIA5\".\"" + 
						execArgs[5].substring(29);
			}
			commitProc = Runtime.getRuntime().exec(execArgs);
			commitProc.waitFor();
		} else {
			System.out.println("UNKNOWN TRIPLE - ERROR! Triple skipped.");
		}
		
		
	}
	
	private void addTriple(Triple triple) throws IOException, InterruptedException {
		
		String table = determineTable(triple);
		commitTable(table, triple, true);
		
	}
	
	private void removeTriple(Triple triple) throws IOException, InterruptedException {
		
		String table = determineTable(triple);
		commitTable(table, triple, false);
		
	}
	
	public boolean download() {
		
		int i;
		try {
			// Proxy for sap network
			Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress("proxy.wdf.sap.corp", 8080));
			URLConnection con = url.openConnection(proxy);
			con.setConnectTimeout(2000);
			con.setReadTimeout(2000);
			File file = new File(getFileName());
			BufferedInputStream bis = new BufferedInputStream( con.getInputStream());
			BufferedOutputStream bos = new BufferedOutputStream( new FileOutputStream(file.getName()));
			while ((i = bis.read()) != -1) {
				bos.write(i);
			}
			bos.flush();
			bos.close();
			bis.close(); 
		} catch (MalformedInputException malformedInputException) {
			malformedInputException.printStackTrace(); 
		} catch (IOException ioException) { 
			// This is normal - sometimes DBpedia does not generate a daily delta zip.
			// The changes are then merged into the next daily zip so no information
			// is lost.
			return false;
		}
		
		return true;
		
	}
	
	public void unpack() {
		
		try {
			//System.out.println(fileName);
			String[] execArgs = {"tar", "-zxvf", fileName};
			Process unpackProc = Runtime.getRuntime().exec(execArgs);
			unpackProc.waitFor();
		} catch (IOException e) {
			// Tar is not installed on this system
			// Throw an exception!
			e.printStackTrace();
		} catch (InterruptedException e) {
			// Something bad happened!
			e.printStackTrace();
		}
	}
	
	public boolean importDelta() throws IOException, InterruptedException {
		
		File folderTmp = new File("");
		File folder = new File(folderTmp.getAbsoluteFile()+"/");
		File[] listOfFiles = folder.listFiles();
		
		for(File file : listOfFiles) {
			
			if(file.getName().endsWith(".added.nt.gz") || file.getName().endsWith(".removed.nt.gz")) {
				
				Reader in = new InputStreamReader(new GZIPInputStream(new FileInputStream(file)));
				Scanner scanner = new Scanner(new BufferedReader(in));
				while(scanner.hasNextLine()) {
					Triple triple = new Triple(scanner.nextLine());
					if(file.getName().endsWith(".added.nt.gz")) {
						addTriple(triple);
					} else {
						removeTriple(triple);
					}
				}
				scanner.close();
				
			}
			
		
		}
		
		return false;
	}
	
	public void cleanUp() {
		
		File folderTmp = new File("");
		File folder = new File(folderTmp.getAbsoluteFile()+"/");
		File[] listOfFiles = folder.listFiles();
		
		for(File file : listOfFiles) {
			System.out.println(fileName);
			if(file.getName().startsWith(fileName.substring(0, 10)) ||
					file.getName().endsWith(".added.nt.gz") ||
					file.getName().endsWith(".removed.nt.gz")) {
				file.delete();
			}
			
		}
		
	}
	
	public static ArrayList<Delta> getDeltaList() {
		return deltaList;
	}

}
