export function convertMillisToDate(millis){
  var date = new Date(millis);
  var year = date.getFullYear();
  var month = date.getMonth();
  var day = date.getDate();
  var hour = date.getHours() === 0 ? "12" : date.getHours();
  var period = "AM";
  if(hour > 12){
    hour -= 12;
    period = "PM";
  }
  var min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  return month + '/' + day + '/' + year + ' ' + hour + ':' + min + " " + period;
}
