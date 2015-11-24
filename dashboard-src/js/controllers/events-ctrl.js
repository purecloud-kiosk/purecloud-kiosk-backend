/**
 * Master Controller
 */

angular.module('RDash')
    .controller('EventsCtrl', ['$scope', EventsCtrl]);

function EventsCtrl($scope) {
    // stub
	$scope.eventName= "Conference1";
	$scope.eventDate= "12/12/2015";
	$scope.loci="San Diego";
	$scope.org="Interactive Itelligence";
	
}
