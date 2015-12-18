"use strict";
/**
 *  Actions related to Navigation
 **/
import dispatcher from "../dispatchers/dispatcher";
import navConstants from "../constants/navConstants";
import history from "../history/history";

export function toggleSideBar(){
  dispatcher.dispatch({
    actionType : navConstants.SIDEBAR_TOGGLED
  });
}

export function routeToPage(page){
  history.replaceState(null, page);
}
