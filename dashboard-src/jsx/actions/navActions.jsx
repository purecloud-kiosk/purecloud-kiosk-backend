"use strict";
/**
 *  Actions related to Navigation
 **/
import dispatcher from "../dispatchers/dispatcher";
import navConstants from "../constants/navConstants";

export function toggleSideBar(){
  dispatcher.dispatch({
    actionType : navConstants.SIDEBAR_TOGGLED
  });
}
