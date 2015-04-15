//import org.apache.commons.lang3.StringEscapeUtils;


public class RDFObjectLiteral extends RDFObject {

	private String strValue;
	private String language = "";
	private DBpediaURI datatypeURI;
	
	public RDFObjectLiteral(String inputStr) {
		super(inputStr);

		// NTriples file, escaped Unicode strings
		//this.strValue = StringEscapeUtils.unescapeJava(inputStr.split("\"")[1]);
		
		
		int tmpi = inputStr.lastIndexOf('"');
		if(tmpi > 0) {
			// postfix: either '"Bla100"@en .' or '"600"^^<http://...> .' 
			// we can save the postfix or we can only save a clean string...
			// for multilingual (like freebase) we should save the postfix (i.e. language)!
			/*String[] tma = new String[100];
			tma = inputStr.split("\"");*/
			String tmp = inputStr.substring(tmpi+1);
			//System.out.println(this.strValue);
			
			if(tmp.startsWith("@")) {
				
				this.language = tmp.substring(1);
				//if(this.language.length() > 2) {
					this.language = this.language.substring(0, this.language.length()-2);
					this.strValue = inputStr.substring(1, tmpi); // get rid of first "
				//} else {
				//	try{FileCreator.getInCSVWriter().write(inputStr+"\n");} catch (Exception e) {}
				//}
				
			} else if(tmp.startsWith("^^")) {
				
				String datatypeStr = tmp.substring(3);
				datatypeStr = datatypeStr.substring(0, datatypeStr.length()-3);
				this.datatypeURI = new DBpediaURI(datatypeStr);
				this.strValue = inputStr.substring(1, tmpi); // get rid of first "
				
			} else {
				// unexpected line breakf, but " found: should not cut away!
				this.strValue = inputStr.substring(1); // get rid of first "
			}
		} else {
			// Unexpected newline occured, we will not find a language or datatype!
		}
		/*} else {
			try{FileCreator.getInCSVWriter().write(inputStr+"\n");} catch (Exception e) {}
		}*/
		
	}
	
	public String getStrValue() {
		
		return strValue;
		
	}
	
	public String getDatatypeURI() {
		
		if(this.datatypeURI != null) {
			return this.datatypeURI.getURI();
		} else {
			return "";
		}
	}

	@Override
	public String toString() {

		return this.getStrValue()+"w"+this.datatypeURI+"w"+this.language;
		
	}
	
	public String getLanguage() {
		if(this.language != null) {
			return this.language;
		} else {
			return "";
		}
		
	}

}
