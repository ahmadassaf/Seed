public abstract class RDFObject {
	
	private String inputStr;
	
	public RDFObject(String inputStr) {
		
		this.inputStr = inputStr;
		
	}
	
	public abstract String toString();
	
	public String getInputStr() {
		
		return this.inputStr;
		
	}

}
