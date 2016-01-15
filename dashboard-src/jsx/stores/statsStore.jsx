"use strict";
/**
 *  This is a pretty basic data store for handling the toggling of side bar.
 **/
import { EventEmitter } from "fbemitter";
import dispatcher from "../dispatchers/dispatcher";
import statsConstants from "../constants/statsConstants";

var stats = {};
function setStats(statistics){
  stats = statistics;
}

class NavStore extends EventEmitter{
  getStats(){
    return stats;
  }
}

var navStore = new NavStore();

// register for data from dispatcher
dispatcher.register(function(payload){
  switch(payload.actionType){
    case statsConstants.STATS_RETRIEVED:
      setStats(payload.data)
      break;
  }
  navStore.emit(payload.actionType);
});

export default navStore;
