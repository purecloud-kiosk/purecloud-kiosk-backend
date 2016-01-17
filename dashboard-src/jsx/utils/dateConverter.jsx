export function convertMillisToDate(millis){
  var date = new Date(millis);
  var year = date.getFullYear();
  var month = date.getMonth() + 1;// jan starts at 0, so plus 1 to match regular date
  var day = date.getDate();
  var hour = (date.getHours() + 1) === 0 ? "12" : date.getHours();
  var period = "AM";
  if(hour > 12){
    hour -= 12;
    period = "PM";
  }
  var min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  return month + '/' + day + '/' + year + ' ' + hour + ':' + min + " " + period;
}
