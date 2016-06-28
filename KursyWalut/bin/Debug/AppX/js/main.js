(function() {
  'use strict';
  var app = WinJS.Application;
  var activation = Windows.ApplicationModel.Activation;


  function getExchangeDates() {
      var url = "http://www.nbp.pl/kursy/xml/dir.txt";
      var httpClient = new XMLHttpRequest();
      httpClient.open('GET', url, false);
      httpClient.onreadystatechange = function () {
          var responseMessage = httpClient.responseText;
          if (httpClient.readyState === 4) {
              var splittedResponseMessage = responseMessage.split('\n');
              var splittedDates = [];
              for (var i = 0; i < splittedResponseMessage.length; i++) {
                  if (splittedResponseMessage[i].substring(0, 1) == 'a') {
                      splittedDates[splittedDates.length] = "20" + splittedResponseMessage[i].Substring(5, 7) + "-" + splittedResponseMessage[i].Substring(7, 9) + "-" + splittedResponseMessage[i].Substring(9, 11);
                      splittedResponseMessage[splittedDates.length - 1] = splittedResponseMessage[i];
                  }
              }
              splittedResponseMessage.splice(splittedDates.length, splittedResponseMessage.length - splittedDates.length);
              splittedDates.reverse();
              //splittedResponseMessage.reverse();

              selectDates = document.getElementById("date-select");
              for (var i = 0; i < splittedDates.length; i++) {
                  var date = document.createElement("data-option");
                  date.text = splittedDates[i];
                  date.value = splittedDates[i];
                  selectDates.appendChild(date);
              }
          }
      }
  }



  app.onactivated = function (args) {
    if (args.detail.kind === activation.ActivationKind.launch) {
      if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
        // TODO: This application has been newly launched. Initialize your application here.
      } else {
        // TODO: This application has been reactivated from suspension.
        // Restore application state here.
      }
      args.setPromise(WinJS.UI.processAll().then(function() {
        // TODO: Your code here.
      }));
    }
  };
  app.oncheckpoint = function (args) {
    // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
    // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
    // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
  };
  app.start();
}());
