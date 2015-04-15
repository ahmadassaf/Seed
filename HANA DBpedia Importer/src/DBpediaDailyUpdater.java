import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Scanner;


public class DBpediaDailyUpdater {
	
	private static PrintWriter logWriter = null;
	
	private static String getLogTime() {
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(Calendar.getInstance().getTime());
	}
	
	private static void log(String str) {
		logWriter.println(getLogTime() + ": " + str);
		System.out.println(getLogTime() + ": " + str);
	}
	
	private static ArrayList<Delta> downloadDeltaFiles(String strLast) throws IOException {
		
		
		//downloadFile("http://live.dbpedia.org/liveupdates/2013/08/2013-08-01.tar.gz");
		String strToday = new SimpleDateFormat("yyyy-MM-dd").format(Calendar.getInstance().getTime());
		
		int currentYear = Integer.parseInt(strToday.substring(0, 4));
		int lastYear = Integer.parseInt(strLast.substring(0, 4));
		int currentMonth = Integer.parseInt(strToday.substring(5, 7));
		int lastMonth = Integer.parseInt(strLast.substring(5, 7));
		int lastMonthTmp = lastMonth;
		int currentDay = Integer.parseInt(strToday.substring(8, 10));
		int lastDay = Integer.parseInt(strLast.substring(8, 10));
		int lastDayTmp = lastDay;
		String dlUrl = "";
		
		if(currentYear > lastYear) {
			// Download all deltas from last year(s) starting with the one after lastUpdated
			for(int i=lastYear; i<=currentYear; i++) {
				for(int j=lastMonthTmp; j<=12; j++) {
					int monthLength;
					monthLength = 31;
					if((j <= 7 && j % 2 == 0) || j > 7 && j % 2 != 0) {
						monthLength = 30;
					}
					if(j == 2) {
						if(new GregorianCalendar().isLeapYear(i)) {
							monthLength = 29;
						} else {
							monthLength = 28;
						}
					}
					for(int k=lastDayTmp+1; k<=monthLength; k++) {
						String z1 = "";
						String z2 = "";
						if(j < 10) {
							z1 = "0";
						}
						if(k < 10) {
							z2 = "0";
						}
						dlUrl = "http://live.dbpedia.org/liveupdates/" + i + "/" + z1 + j 
								+ "/"+i+"-"+z1+j+"-" + z2 + k+".tar.gz";
						//log("Download: "+dlUrl);
						new Delta(dlUrl);
						
						
					}
					lastDayTmp = 0;
				}
				lastMonthTmp = 1;
			}
			
		}
		if(currentMonth > lastMonth) {
			// Download all deltas from the current year until current month, starting with the one after lastUpdated
			for(int i=lastMonth; i<=currentMonth-1; i++) {
				int monthLength;
				monthLength = 31;
				if((i <= 7 && i % 2 == 0) || i > 7 && i % 2 != 0) {
					monthLength = 30;
				}
				if(i == 2) {
					if(new GregorianCalendar().isLeapYear(currentYear)) {
						monthLength = 29;
					} else {
						monthLength = 28;
					}
				}
				for(int j=lastDayTmp+1; j<=monthLength; j++) {
					
					String z1 = "";
					String z2 = "";
					if(i < 10) {
						z1 = "0";
					}
					if(j < 10) {
						z2 = "0";
					}
					dlUrl = "http://live.dbpedia.org/liveupdates/" + currentYear + "/" + z1+ i + 
							"/"+currentYear+"-"+z1+i+"-" + z2 + j+".tar.gz";
					//log("Download: "+dlUrl);
					new Delta(dlUrl);
					
				}
				lastDayTmp = 0;
			}
			
		}
		// Download all deltas from the current month, starting with the one after lastUpdated
		int startDay;
		if(currentMonth == lastMonth) {
			startDay = lastDay+1;
		} else {
			startDay = 1;
		}
		for(int i=startDay; i<=currentDay-1; i++) {
			
			String z1 = "";
			if(i < 10) {
				z1 = "0";
			}
			dlUrl = "http://live.dbpedia.org/liveupdates/" + currentYear + "/" + currentMonth + 
					"/"+currentYear+"-"+currentMonth+"-" + z1 + i+".tar.gz";
			//log("Download: "+dlUrl);
			new Delta(dlUrl);
			
		}
		
		ArrayList<Delta> deltaList = Delta.getDeltaList();
		ArrayList<Delta> downloadedList = new ArrayList<Delta>();
		for(Delta delta : deltaList) {
			
			log("Downloading: " + delta.getUrlStr());
			if(delta.download()) {
				log("Done!");
				downloadedList.add(delta);
			} else {
				log("File not found - this can be normal since not everyday a delta zip is generated");
			}
			
		}
		
		return downloadedList;

	}

	public static void main(String[] args) throws IOException, InterruptedException {

		// Initialize log
		File log = new File("logFile.txt");
		if(!log.exists()) {
			
			Writer lWriter = new BufferedWriter(new OutputStreamWriter(
			          new FileOutputStream(log.getName()), "utf-8"));
			
			lWriter.write(getLogTime() + ": logFile.txt initially created - first run");
			lWriter.write(getLogTime() + ": The first DBpedia live update zip after 3.9 release was provided 2013-10-20");
			lWriter.close();
			
		}
		
		logWriter = new PrintWriter(new BufferedWriter(new FileWriter(log.getName(), true)));
		
		log("DBpediaDailyUpdater starting...");
		
		// Check whether lastUpdate file exists - otherwise create it with
		// initial value (date of first live update published after release
		// of DBpedia 3.9)
		File lastUpdated = new File("lastUpdated.txt");
		if(!lastUpdated.exists()) { 
			
			log("No lastUpdated.txt found, creating new one...");
			Writer lastUpdatedWriter = new BufferedWriter(new OutputStreamWriter(
			          new FileOutputStream(lastUpdated.getName()), "utf-8"));
			
			lastUpdatedWriter.write("2013-08-26");
			lastUpdatedWriter.close();
			
		} else {
			log("lastUpdated.txt found");
		}
		
		// Read last updated value
		log("Reading lastUpdated.txt...");
		Scanner readLastUpdated = new Scanner(new FileReader(lastUpdated.getName()));
		String strLastUpdated = readLastUpdated.nextLine();
		readLastUpdated.close();
		log("Last update was " + strLastUpdated);
		
		ArrayList<Delta> downloadedList = downloadDeltaFiles(strLastUpdated);
		Delta lastImported = null;
		for(Delta delta : downloadedList) {
			log("Unpacking " + delta.getFileName() + "...");
			delta.unpack();
			log("Importing " + delta.getFileName() + "...");
			if(delta.importDelta()) {
				log("Done!");
				lastImported = delta;
				log(delta.getStatistics());
			} else {
				log("Error occured during import!");
			}
			log("Cleaning up " + delta.getFileName() + "...");
			delta.cleanUp();
		}
		
		if(lastImported != null) {
			log("Updating lastUpdated.txt...");
			Writer lastUpdatedWriter = new BufferedWriter(new OutputStreamWriter(
			          new FileOutputStream(lastUpdated.getName()), "utf-8"));
			
			lastUpdatedWriter.write(lastImported.getFileName().substring(0, 10));
			lastUpdatedWriter.close();
		} else {
			log("Nothing was imported");
		}
		
		log("DBpediaDailyUpdater closing...");
		logWriter.println();
		logWriter.close();

	}

}
