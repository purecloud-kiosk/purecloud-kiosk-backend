function getQueries() {
  var queries = [];
  var queryString = window.location.toString().split("?")[1];
  var hashes = queryString.split("&");
  for(var i = 0; i < hashes.length; i++){
    var query = hashes[i].split("=");
    queries.push(query[0]);
    queries[query[0]] = query[1];
  }
  return queries;
}
localStorage.setItem("pureCloudAccessToken", getQueries().client_token);
window.history.replaceState({}, document.title, location.protocol + "//" + location.host + location.pathname);
