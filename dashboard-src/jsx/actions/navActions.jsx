"use strict";
/**
 *  Actions related to Navigation
 **/
import dispatcher from "../dispatchers/dispatcher";
import navConstants from "../constants/navConstants";
import history from "../history/history";
/**
 *  Dispatches to the navStore that the sidebar has been toggled
 **/
export function toggleSideBar(){
  dispatcher.dispatch({
    actionType : navConstants.SIDEBAR_TOGGLED
  });
}
/**
 *  replaces the state of the application's history (in other words, swaps pages)
 **/
export function routeToPage(page){
  history.replaceState(null, page);
}
