(function () {
    'use strict';
    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var selectDate, selectYear;
    var currencyName = [], converter = [], currencyCode = [], averageRate = [];
    var sourceData = [];
    var applicationData = Windows.Storage.ApplicationData.current;
    var localFolder = applicationData.localFolder;
    var filename = "dataFile.txt";
    var fileDate;


    WinJS.UI.Pages.define("index.html", {
        ready: function (element, options) {
            this.fillYearSelect();
            //this.getExchangeDates();
        },

        fillYearSelect: function () {
            selectYear = document.getElementById("year-select");
            var date = new Date();
            var year = date.getFullYear();
            for (var i = year; i >= 2002; i--) {
                var dateOption = document.createElement("option");
                dateOption.text = i;
                dateOption.value = i;
                selectYear.appendChild(dateOption);
            }
            getExchangeDates("http://www.nbp.pl/kursy/xml/dir.txt", true);
            selectYear.onchange = function () {
                console.log(selectYear.options[selectYear.selectedIndex].value);
                if (selectYear.options[selectYear.selectedIndex].value == year) {
                    getExchangeDates("http://www.nbp.pl/kursy/xml/dir.txt",true);
                } else {
                    //console.log("http://www.nbp.pl/kursy/xml/dir" + selectYear.options[selectYear.selectedIndex].value + ".txt");
                    getExchangeDates("http://www.nbp.pl/kursy/xml/dir" + selectYear.options[selectYear.selectedIndex].value + ".txt", true);
                }
            };
        }

    }
    )

    function getExchangeDates(url, flag) {
       // loadDate();
        //var url = "http://www.nbp.pl/kursy/xml/dir.txt";
        var httpClient = new XMLHttpRequest();
        httpClient.open('GET', url);
        httpClient.onreadystatechange = function () {
            var responseMessage = httpClient.responseText;
            if (httpClient.readyState === 4) {
                var splittedResponseMessage = responseMessage.split('\n');
                var splittedDates = [], splittedFileNames = [];
                var j = 0;
                for (var i = 0; i < splittedResponseMessage.length; i++) {
                    if (splittedResponseMessage[i].substring(0, 1) == 'a') {
                        splittedDates[splittedDates.length] = "20" + splittedResponseMessage[i].substring(5, 7) + "-" + splittedResponseMessage[i].substring(7, 9) + "-" + splittedResponseMessage[i].substring(9, 11);
                        splittedFileNames[splittedFileNames.length] = splittedResponseMessage[i];
                    }
                }
                splittedFileNames.reverse();
                splittedDates.reverse();

                selectDate = document.getElementById("date-select");
                selectDate.options.length = 0;
                for (var i = 0; i < splittedDates.length; i++) {
                    var dateOption = document.createElement("option");
                    dateOption.text = splittedDates[i];
                    dateOption.value = splittedDates[i];
                    selectDate.appendChild(dateOption);
                }
                if (flag == true) {
                    document.getElementById("p-info").innerHTML = "Na podstawie danych NBP z dnia: " + splittedDates[selectDate.selectedIndex];
                    getXMLData("http://www.nbp.pl/kursy/xml/" + splittedFileNames[selectDate.selectedIndex].substring(0, 11) + ".xml");
                }
                else {
                    if (fileDate == null) {
                        getXMLData("http://www.nbp.pl/kursy/xml/" + splittedFileNames[selectDate.selectedIndex].substring(0, 11) + ".xml");
                        saveDate(splittedFileNames[selectDate.selectedIndex].substring(0, 11));
                        selectDate.options[0].selected = true;
                    }
                    else {
                        var tmpIndex=0;
                        for (var i = 0; i < selectDate.length; i++) {
                            var tmpFileData = "20" + fileDate.substring(5, 7) + "-" + fileDate.substring(7, 9) + "-" + fileDate.substring(9, 11);
                            if (selectDate[i].value == tmpFileData) {
                                tmpIndex = i;
                            }
                        }
                        selectDate.options[tmpIndex].selected = true;
                        getXMLData("http://www.nbp.pl/kursy/xml/" + fileDate + ".xml");
                    }
                }

                
               
                
                selectDate.onchange = function () {
                    document.getElementById("p-info").innerHTML = "Na podstawie danych NBP z dnia: " + splittedDates[selectDate.selectedIndex];
                    getXMLData("http://www.nbp.pl/kursy/xml/" + splittedFileNames[selectDate.selectedIndex].substring(0, 11) + ".xml")
                    saveDate(splittedFileNames[selectDate.selectedIndex].substring(0, 11));
                };
                
            }
        }
        httpClient.send();
    }
    


    function  getXMLData (xmlURL) {
        document.getElementById("someDiv").style.visibility = "visible";
        console.log(xmlURL);
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", xmlURL, false);
        httpRequest.send();
        var xmlData = httpRequest.responseXML;
        var currencies = xmlData.getElementsByTagName("pozycja");
        for (var i = 0; i < currencies.length; i++) {
            try{
                currencyName[i] = currencies[i].getElementsByTagName("nazwa_waluty")[0].childNodes[0].nodeValue;
            }catch(e){
                currencyName[i] = currencies[i].getElementsByTagName("nazwa_kraju")[0].childNodes[0].nodeValue;
            }
            converter[i] = currencies[i].getElementsByTagName("przelicznik")[0].childNodes[0].nodeValue;
            currencyCode[i] = currencies[i].getElementsByTagName("kod_waluty")[0].childNodes[0].nodeValue;
            averageRate[i] = currencies[i].getElementsByTagName("kurs_sredni")[0].childNodes[0].nodeValue;
        }
        return new WinJS.Promise.timeout(1000).then(function () {
            fillTable();
            setTimeout(function () { setRowsAction(); }, 500);
            document.getElementById("someDiv").style.visibility = "hidden";
        }, function (reason) {
            document.getElementById("tableContent").style.visibility = "hidden";
            document.getElementById("info").style.visibility = "hidden";
        });

    };

    function fillTable() {
        sourceData.length = 0;
        var tableBody = document.getElementById("myTableBody");
        var template = document.getElementById("myTemplate").winControl;
        for (var i = 0; i < currencyCode.length; i++) {
            sourceData.push({ currencyName: currencyName[i], converter: converter[i], currencyCode: currencyCode[i], averageRate: averageRate[i] });
        }
        while (tableBody.rows.length > 0) {
            tableBody.deleteRow(0);
        }
        sourceData.forEach(function (item) {
            template.render(item, tableBody);
        })

    }

    function saveDate(content) {
        localFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting)
        .then(function (file) {
            return Windows.Storage.FileIO.writeTextAsync(file, content);
        }).done(function () {
        });
    }

    function loadDate() {
        return WinJS.Application.local.exists(filename).then(function (found) {
            if (found) {
                return localFolder.getFileAsync(filename).then(function (file) {
                    return Windows.Storage.FileIO.readTextAsync(file).then(function (fileContent) {
                        fileDate = fileContent;
                    });
                });
                }
        });
    }

    function setRowsAction() {
        var table = document.getElementById("myTableBody");
        var rows = table.getElementsByTagName("tr");

        for (var i = 0; i < rows.length; i++) {
            //gets cells of current row  
            var oCells = table.rows.item(i).cells;
            //gets amount of cells of current row

            var cellVal = oCells.item(1).innerHTML;

            rows[i].onclick = (function () {
                var oCellss = table.rows.item(i).cells;
                var x = cellVal = oCellss.item(1).innerHTML;;
                return function () {
                    window.location = "chart.html?currencyCode=" + x;
                }
            })();
        }
    }

//    app.onactivated = function (args) {
//        if (args.detail.kind === activation.ActivationKind.launch) {
//            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
//                // TODO: This application has been newly launched. Initialize your application here.
//            } else {
//                // TODO: This application has been reactivated from suspension.
//                // Restore application state here.
//            }
//            args.setPromise(WinJS.UI.processAll().then(function () {
//                // TODO: Your code here.
//               // getExchangeDates();
//            }));
//        }
//    };
//    app.oncheckpoint = function (args) {
//        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
//        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
//        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
//    };
//    app.start();
}());
