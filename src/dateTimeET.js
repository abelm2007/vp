const dateFormattedET = function(calendarType){
	let timeNow = new Date();
	const monthNamesET = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
	const folkMonthNamesET = ['näärikuu', 'radokuu', 'urbekuu', 'jürikuu', 'lehekuu', 'jaanikuu', 'heinakuu', 'põimukuu', 'mihklikuu', 'viinakuu', 'talvekuu', 'jõulukuu'];
	if(calendarType == 1){
		return timeNow.getDate() + '. ' + monthNamesET[timeNow.getMonth()] + ' ' + timeNow.getFullYear();
	}
	if(calendarType == 0){
		return timeNow.getDate() + '. ' + folkMonthNamesET[timeNow.getMonth()] + ' ' + timeNow.getFullYear();
	}
}
	
const timeFormattedET = function(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minuteNow = timeNow.getMinutes();
	let secondNow = timeNow.getSeconds();
	if(minuteNow < 10){
		minuteNow = '0' + minuteNow
	}
	if(secondNow < 10){
		secondNow = '0' + secondNow
	}
	let timeFormatted = hourNow + ":" + minuteNow + ':' + secondNow;
	return timeFormatted;
}

const weekdayET = function(){ 
	let weekDay = new Date().getDay();
	const weekdayNamesET = ['pühapäev ', 'esmaspäev ', 'teisipäev ', 'kolmapäev ', 'neljapäev ', 'reede ', 'laupäev '];
	return weekdayNamesET[weekDay];
}
//ekspordin kõik vajalikud
module.exports = {
	fullDate: dateFormattedET,
	fullTime: timeFormattedET,
	weekday: weekdayET
}