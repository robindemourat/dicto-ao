'use strict';

angular.module('dictofullstackApp')
  .directive('ngHold', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
      }, controller :  function ($scope, $element, $attrs, $transclude, $timeout) {
                var onHold = function () {
                    return $scope.$eval($attrs.ngHold);
                };
                var onDone = function () {
                    return $scope.$eval($attrs.ngHoldDone);
                };

                var intervals = [];
                ($attrs.ngHoldInterval || "500").split(",").forEach(function (interval) {
                    intervals.push(interval.split(";"));
                });
                var timeout=null;
                var intervalIdx;
                var intervalCount;

                function timeoutFoo() {
                    intervalCount++;
                    var max = intervals[intervalIdx].length == 1 ? 1 : intervals[intervalIdx][1];
                    if (intervalCount > max) {
                        intervalIdx = Math.min(intervalIdx + 1, intervals.length - 1);
                        intervalCount = 1;
                    }
                    timeout = $timeout(timeoutFoo, intervals[intervalIdx][0]);
                    onHold();
                }

                $element.on("mousedown", function (e) {
                    intervalIdx = 0;
                    intervalCount = 1;
                    timeout = $timeout(timeoutFoo, intervals[intervalIdx][0]);
                    $scope.$apply(onHold);
                });
                $element.on("mouseup", function (e) {
                    if (!!timeout) {
                        $timeout.cancel(timeout);
                        $scope.$apply(onDone);
                        timeout=null;
                    }
                });
                $element.on("mouseleave", function (e) {
                    if (!!timeout) {
                        $timeout.cancel(timeout);
                        $scope.$apply(onDone);
                        timeout=null;
                    }
                });
      }
    };
  });
