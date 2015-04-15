
public class RDFObjectRef extends RDFObject {

	private DBpediaURI uri;
	
	public RDFObjectRef(String inputStr) {
		super(inputStr);
		
		this.uri = new DBpediaURI(inputStr.substring(1));
	}
	
	public String getURI() {
		
		return this.uri.getURI();
		
	}

	@Override
	public String toString() {

		return this.getURI();
		
	}

}
