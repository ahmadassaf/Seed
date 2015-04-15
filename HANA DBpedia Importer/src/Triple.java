
public class Triple {

	private DBpediaURI subjectURI;
	private DBpediaURI predicateURI;
	private RDFObject object;
	
	public Triple(String line) {
		
		//String separatedBy = " ";
		
		// Try to optimize: split is faster with a one-char string!
		String[] tripleArr = new String[3];
		tripleArr = line.split(">", 3);
		//this.subjectURI = new DBpediaURI(line.split(">"+separatedBy+"<")[0].substring(1));
		//this.predicateURI = new DBpediaURI(line.split(">"+separatedBy)[1].substring(1));
		//if(tripleArr.length > 1) {
		// Get rid of stupid things like __1, __2, etc... pragmatic, don't know how to do this generic
		if(tripleArr[0].endsWith("__1") || tripleArr[0].endsWith("__2") || 
				tripleArr[0].endsWith("__3") || tripleArr[0].endsWith("__4") || 
				tripleArr[0].endsWith("__5") || tripleArr[0].endsWith("__6") || 
				tripleArr[0].endsWith("__7") || tripleArr[0].endsWith("__8") || 
				tripleArr[0].endsWith("__9")) {
			tripleArr[0] = tripleArr[0].substring(0, tripleArr[0].length()-3);
		}
		if(tripleArr[0].endsWith("__10") || tripleArr[0].endsWith("__11") || 
				tripleArr[0].endsWith("__12") || tripleArr[0].endsWith("__13") || 
				tripleArr[0].endsWith("__14") || tripleArr[0].endsWith("__15") || 
				tripleArr[0].endsWith("__16") || tripleArr[0].endsWith("__17") || 
				tripleArr[0].endsWith("__18") || tripleArr[0].endsWith("__19")) {
			tripleArr[0] = tripleArr[0].substring(0, tripleArr[0].length()-4);
		}
		this.subjectURI = new DBpediaURI(tripleArr[0].substring(1));
		if(tripleArr.length >= 2) {
			this.predicateURI = new DBpediaURI(tripleArr[1].substring(2));
		} else {
			this.predicateURI = new DBpediaURI("ERROR");
		}
		
		if(tripleArr.length >= 2 && tripleArr[2].startsWith(" <")) {
			
			this.object = new RDFObjectRef(tripleArr[2].substring(1, tripleArr[2].length()-3));
			
		} else if (tripleArr.length >= 2 && tripleArr[2].startsWith(" \"")) {
			
			this.object = new RDFObjectLiteral(tripleArr[2].substring(1)); // there are Literals like '> 100'!	
		
		} else {
			// ERROR
			this.object = new RDFObjectLiteral("error");
		}
		//} else {
		//	try {FileCreator.getInCSVWriter().write(line+"\n");} catch (Exception e) {}
		//}
		
	}
	
	public String getSubjectURI() {
		if(this.subjectURI != null) {
		return this.subjectURI.getURI();
		} else {
			return null;
		}
		
	}
	
	public String getPredicateURI() {
		
		return this.predicateURI.getURI();
		
	}
	
	public RDFObject getObject() {
		
		return this.object;
		
	}
	
	public String toString() {
		
		return(this.getSubjectURI()+"-"+this.getPredicateURI()+"-"+this.getObject().toString());
		
	}

}
