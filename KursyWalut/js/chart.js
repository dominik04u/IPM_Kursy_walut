(function () {
    'use strict';
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var selectStartDate, selectEndDate, selectYear;
    var averageRates = [];
    var sourceData = [];
    var allDates = [];
    var applicationData = Windows.Storage.ApplicationData.current;

   
    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    function fillYearSelect() {
        selectYear = document.getElementById("year-select");
        var date = new Date();
        var year = date.getFullYear();
        for (var i = year; i >= 2002; i--) {
            var dateOption = document.createElement("option");
            dateOption.text = i;
            dateOption.value = i;
            selectYear.appendChild(dateOption);
        }
        loadData("http://www.nbp.pl/kursy/xml/dir.txt");
        selectYear.onchange = function () {
            console.log(selectYear.options[selectYear.selectedIndex].value);
            if (selectYear.options[selectYear.selectedIndex].value == year) {
                loadData("http://www.nbp.pl/kursy/xml/dir.txt");
            } else {
                //console.log("http://www.nbp.pl/kursy/xml/dir" + selectYear.options[selectYear.selectedIndex].value + ".txt");
                loadData("http://www.nbp.pl/kursy/xml/dir" + selectYear.options[selectYear.selectedIndex].value + ".txt");
            }
        };
    }

    var currencyCode;
    var splittedDates = [], splittedFileNames = [];

    function loadData(url) {
        currencyCode = getUrlParameter('currencyCode');
        console.log(currencyCode);
       // var url = "http://www.nbp.pl/kursy/xml/dir.txt";
        var httpClient = new XMLHttpRequest();
        httpClient.open('GET', url);
        httpClient.onreadystatechange = function () {
            var responseMessage = httpClient.responseText;
            if (httpClient.readyState == 4) {
                var splittedResponseMessage = responseMessage.split('\n');
                for (var i = 0; i < splittedResponseMessage.length; i++) {
                    if (splittedResponseMessage[i].substring(0, 1) == 'a') {
                        splittedDates[splittedDates.length] = "20" + splittedResponseMessage[i].substring(5, 7) + "-" + splittedResponseMessage[i].substring(7, 9) + "-" + splittedResponseMessage[i].substring(9, 11);
                        splittedFileNames[splittedFileNames.length] = splittedResponseMessage[i];
                    }
                }
                splittedFileNames.reverse();
                splittedDates.reverse();

                selectStartDate = document.getElementById("start_date");
                selectStartDate.options.length = 0;
                for (var i = 0; i < splittedDates.length; i++) {
                    var dateOption = document.createElement("option");
                    dateOption.text = splittedDates[i];
                    dateOption.value = splittedFileNames[i];
                    selectStartDate.appendChild(dateOption);
                }

                selectEndDate = document.getElementById("end_date");
                selectEndDate.options.length = 0;
                for (var i = 0; i < splittedDates.length; i++) {
                    var dateOption = document.createElement("option");
                    dateOption.text = splittedDates[i];
                    dateOption.value = splittedFileNames[i];
                    selectEndDate.appendChild(dateOption);
                }
            }
        }
        httpClient.send();
    }

    function getDates() {
        var startDate = document.getElementById("start_date").selectedIndex;
        var endDate = document.getElementById("end_date").selectedIndex;

        console.log(startDate+":"+endDate);

        if (startDate < endDate) {
            console.log("Error");
        }
        else {
            var iterator = startDate;
            var datesList = [];
            averageRates = [];
            allDates = [];
            datesList = [];
            while (iterator >= endDate) {
                datesList[datesList.length] = splittedFileNames[iterator];
                allDates[allDates.length] = splittedDates[iterator];
                iterator--;
            }
            
            for (var i = 0; i < datesList.length; i++) {
                var httpRequest = new XMLHttpRequest();
                var xmlURL = "http://www.nbp.pl/kursy/xml/" + datesList[i] + ".xml";
                httpRequest.open("GET", xmlURL, false);
                httpRequest.send();
                var xmlData = httpRequest.responseXML;
                var currencies = xmlData.getElementsByTagName("pozycja");
                for (var j = 0; j < currencies.length; j++) {
                    if (currencies[j].getElementsByTagName("kod_waluty")[0].childNodes[0].nodeValue == currencyCode) {
                        averageRates[averageRates.length] = currencies[j].getElementsByTagName("kurs_sredni")[0].childNodes[0].nodeValue;
                    }
                }
            }
           
            document.getElementById("progressDiv").style.visibility = "visible";
            return new WinJS.Promise.timeout(1000).then(function () {
                drawChart();
            });

            
        }
    }

    window.onload = function () {
        fillYearSelect();
        document.getElementById("progressDiv").style.visibility = "hidden";
        loadData();
        document.getElementById("showButton").onclick = function () { getDates() };
        document.getElementById("turnBack").onclick = (function () {
            return function goBack() {
                window.history.back();
            }
        })();
    };

    function drawChart() {
        
        var low = averageRates[0];
        var top = averageRates[0];

        for (var i = 0; i < averageRates.length; i++) {
            if (averageRates[i] < low) {
                low = averageRates[i];
            }
            if (averageRates[i] > top) {
                top = averageRates[i];
            }
        }
        var slicer = (top - low) / 8;
        var values = [];
        for (var j = 0; j < averageRates.length; j++) {
            var tmp = averageRates[j];
            tmp = tmp.replace(",", ".");
            console.log(tmp);
            values[j] = parseFloat(tmp);
        }

        var dps=[];
        dps = [{ label: allDates[0], y: values[0] }];


        var chart = new CanvasJS.Chart("chartContainer",
        {
            title: {
                text: "Wykres kursu "+currencyCode
            },
            axisX: {
                title: "Data",
            },
            axisY: {
                title: "Kurs średni",
                includeZero: false
            },
            data: [{
                color:"green",
                type: "line",
                dataPoints: dps
            }]
        });

        chart.render();

        
        for (var i = 1; i < averageRates.length; i++) {
            dps.push({ label: allDates[i], y: values[i] });
        }
        chart.render();
        document.getElementById("progressDiv").style.visibility = "hidden";
    }


    //app.onactivated = function (args) {
    //    if (args.detail.kind === activation.ActivationKind.launch) {
    //        if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
    //            // TODO: This application has been newly launched. Initialize your application here.
    //        } else {
    //            // TODO: This application has been reactivated from suspension.
    //            // Restore application state here.
    //        }
    //        args.setPromise(WinJS.UI.processAll().then(function () {
    //            // TODO: Your code here.
    //            loadData();
    //        }));
    //    }
    //};
    //app.oncheckpoint = function (args) {
    //    // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
    //    // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
    //    // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    //};
    //app.start();
}());
