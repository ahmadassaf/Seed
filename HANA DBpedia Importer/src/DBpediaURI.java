public class DBpediaURI {

	String inputURI, cleanURI;
	
	public DBpediaURI(String inputURI) {
		
		this.inputURI = inputURI;
		this.cleanURI = DBpediaURI.cleanURI(this.inputURI);
		
	}
	
	public String getURI() {
		
		// Returns cleaned URI
		return this.cleanURI;
		
	}
	
	public static String cleanURI(String uri) {
		
		String returnURI = uri;
		
		// IN BEFORE: Since we do not need WIPE for now, leave the URIs as they are
		// At least for ntriple-files
		
		// Everything will be lower case - for case-insensitive search
		//returnURI = returnURI.toLowerCase();
		
		// Increase performance by shortening the most common URIs (?)
		// Speed improvements are not really measurable
		// Should decrease file size of the output drastically => by about 30%
		// Might also improve HANA import speed => not really
		// This might be buggy right now! Investigating...
		if(returnURI.startsWith("http://dbpedia.org/resource/") || returnURI.startsWith("http://dbpedia.org/ontology/")) {
			returnURI = returnURI.substring(28);
		} else if(returnURI.startsWith("http://dbpedia.org/property/")) {
			returnURI = returnURI.substring(28);
		} else if(returnURI.startsWith("http://dbpedia.org/datatype/")) {
			returnURI = returnURI.substring(28);
		}
		
		// Some characters are not allowed in URIs (WIPE complains / does not work)
		// We get away with these characters when importing because WIPE is not used for that
		// For querying we have to use WIPE though (do we really have to?)
		
		// Known to be allowed: 	: . / _ # % !
		// Known to be not allowed: - , ( ) ' +
		// Suspicious spotted:      
		
		// Use char as parameters! Much faster than using String as parameters.
		// We use the standard replacements: http://tools.ietf.org/html/rfc3986
		// http://www.w3schools.com/tags/ref_urlencode.asp
		// Fast  mode: replace char with char, e.g. everything with '_'
		// String replacing is slower unfortunately
		
		//returnURI = returnURI.replace('-', "%2D");
		
		// Since replace("string", "string") is much slower than replace('c', 'c')
		// we have to use StringBuilder here - it is faster and can replace with
		// Strings
		/*StringBuilder retu = new StringBuilder(returnURI);
		int idx = retu.indexOf("-");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'2', 'D'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf("-");
		}
		idx = retu.indexOf(",");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'8', '2'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf(",");
		}
		idx = retu.indexOf("(");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'2', '8'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf("(");
		}
		idx = retu.indexOf(")");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'2', '9'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf(")");
		}
		idx = retu.indexOf("'");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'2', '7'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf("'");
		}
		idx = retu.indexOf("+");
		while(idx != -1) {
			retu.replace(idx, idx+1, "%");
			char[] charArr = {'2', 'B'};
			retu.insert(idx+1, charArr);
			idx = retu.indexOf("+");
		}*/

		// Hard mode -> this encodes ALL special characters
		// Slower than the current solution but should catch all of them
		// Maybe use this for international files!
		// DBpedia says that the nt files are already encoded - so maybe
		// replacing the few special characters is enough - it should be!
		/*try {
		returnURI = URLEncoder.encode(returnURI, "utf-8");
		} catch (Exception e) {}*/
		
		return returnURI;
		
	}
	
}
