"use strict";
/**
 *  Actions related to Navigation
 **/
import dispatcher from "../dispatchers/dispatcher";
import requestConstants from "../constants/requestConstants"
import eventsConstants from "../constants/eventsConstants";
/**
 *  Dispatches to the navStore that the sidebar has been toggled
 **/
export function getPublicEvents(page){
  $.ajax({
    url : "/events/public?page=" + page,
    method : "GET",
    headers : {
      "Authorization" : "bearer " + requestConstants.AUTH_TOKEN
    }
  }).done(function(data){
    console.log(data);
    dispatcher.dispatch({
      actionType : eventsConstants.PUBLIC_EVENTS_RETRIEVED,
      data : data
    });
  }).error(function(error){
    console.log(error);
  });
}

/**
 *  Dispatches to the navStore that the sidebar has been toggled
 **/
export function getPrivateEvents(page){
  $.ajax({
    url : "/events/private?page=" + page,
    method : "GET",
    headers : {
      "Authorization" : "bearer " + requestConstants.AUTH_TOKEN
    }
  }).done(function(data){
    console.log(data);
    dispatcher.dispatch({
      actionType : eventsConstants.PRIVATE_EVENTS_RETRIEVED,
      data : data
    });
  }).error(function(error){
    console.log(error);
  });
}

/**
 *  Dispatches to the navStore that the sidebar has been toggled
 **/
export function getEventsManaging(page){
  $.ajax({
    url : "/events/managing?page=" + page,
    method : "GET",
    headers : {
      "Authorization" : "bearer " + requestConstants.AUTH_TOKEN
    }
  }).done(function(data){
    console.log(data);
    dispatcher.dispatch({
      actionType : eventsConstants.EVENTS_MANAGING_RETRIEVED,
      data : data
    });
  }).error(function(error){
    console.log(error);
  });
}

export function setCurrentEvent(event){
  dispatcher.dispatch({
    actionType : eventsConstants.CURRENT_EVENT_SET,
    data : event
  });
}
/**
 *  Dispatches to the navStore that the sidebar has been toggled
 **/

export function createEvent(event){
	console.log("Data we are sending: ");
	console.log(event);
	 $.ajax({
	    url : "/events/create",
	    method : "POST",
	    data : event,
	    headers : {
	      "Authorization" : "bearer " + requestConstants.AUTH_TOKEN
	    }
	  }).done(function(data){
	  	console.log("Response from Create : ");
	    console.log(data);
	    dispatcher.dispatch({
	      actionType : eventsConstants.EVENT_CREATED,
	      data : data
	    });
	  }).error(function(error){
	  	console.log("ERROR : ");
	    console.log(error);
	  });
}

