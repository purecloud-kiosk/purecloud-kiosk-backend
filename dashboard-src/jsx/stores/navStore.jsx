"use strict";
/**
 *  This is a pretty basic data store for handling the toggling of side bar.
 **/
import { EventEmitter } from "fbemitter";
import dispatcher from "../dispatchers/dispatcher";
import navConstants from "../constants/navConstants";

var open = false;
function toggleOpen(){
  open = !open;
}

class NavStore extends EventEmitter{
  sideBarIsOpen(){
    return open;
  }
}

var navStore = new NavStore();

// register for data from dispatcher
dispatcher.register(function(payload){
  switch(payload.actionType){
    case navConstants.SIDEBAR_TOGGLED:
      toggleOpen();
      break;
  }
  navStore.emit(payload.actionType);
});

export default navStore;
