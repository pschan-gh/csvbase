var sortField = 'undefined';
var groupField = 'undefined';
var headerNames = [];
var sanitizedHeaders = [];
var secondaryHeaderNames = [];
var sanitizedSecondaryHeaders = [];
var headerTypes = {};
var baseQuery;
var clickedArray = {};
var wscale = 1;
var colWidths = {};
var primaryDbKeyValues = [];
var headerIndex = {};
var dataIndex = {};
var highlightHue = 0;
var primaryDbKey = '';
var primaryKey = '';
var primaryFile = null;
var tableVersion = 0;
var schemaBuilder;
var maxCols = 100;
var columnData = new Object();

function report () {
};

function initializeDB(data, headers, key) {
    $('#mainTable').find('tbody').html('');

    var row;
    var rows = [];
    var field;
    var dbKey = headerIndex[key];
    var dbName = 'csvDB' + JSON.stringify(data).hashCode();

    console.log('DB NAME: ' + dbName);
    indexedDB.deleteDatabase(dbName);
    console.log(dbName + ' DELETED');

    schemaBuilder = lf.schema.create(dbName + Math.random().toString(), 1);

    var tableBuilder = schemaBuilder.createTable('LogTable' + tableVersion);

    for (var j = 0; j < maxCols; j++) {
        tableBuilder = tableBuilder.addColumn('COL' + j.toString(), lf.Type.STRING);
        if (dbKey == 'COL' + j.toString()) {
            tableBuilder = tableBuilder.addPrimaryKey([dbKey]);
        }
    }

    sortField = key;
    groupField = key;
    primaryKey = key;
    primaryDbKey = dbKey;

    schemaBuilder.connect().then(function(db) {
        console.log('CONNECTED');
        var row;
        var rows = [];
        var logTable = db.getSchema().table('LogTable' + tableVersion);

        postInitialization(db, logTable);

        updateTable(db, logTable, data, headers, primaryKey, true);
    });

}

function resetTable() {
    $('#mainTable > tbody > tr').remove();
    $('#header_row').html('<th id="th_count" clicked="0" field="count" class="col_count header"><a href="#">#</a><div class="triangle">&#x25BA;</div></th>');

    var hfield;

    sanitizedHeaders.map(function(sfield) {
        hfield = sfield;
        var $th = $("<th>", {"id" : 'th_' + hfield, 'clicked': '0', 'field': hfield, "class":'col_' + hfield});
        var html = '<a id="a_' + hfield + '" href="#" class="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + hfield.replace(/_/, ' ') + '</a>';
        html += '<div class="dropdown-menu" aria-labelledby="a_' + hfield + '"><a class="dropdown-item group_by" field="' + hfield + '" href="#">Group by</a><a class="dropdown-item fields statistics" field="' + hfield + '" href="#" >Statistics</a><a class="dropdown-item recalculate fields" data-toggle="modal" data-target="#column_bin" field="' + hfield + '" href="#">Recalculate</a><a class="dropdown-item fields hide" field="' + hfield + '" href="#">Hide</a></div>';

        html += "<div class='triangle'>&#x25BA;</div>";
        $th.html(html);
        $th.appendTo($('#header_row'));
    });

    $('th').attr('clicked', 0);

}

function sanitize(str) {
    var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
    str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
    return str;
}

function updateTable(db, table, data, headers, key, isPrimary) {
    console.log(data);
    sanitizedSecondaryHeaders = [];
    var sanitizedField;
    console.log(sanitizedHeaders);
    for (var j = 0; j < headers.length; j++) {
        var field = headers[j];
        sanitizedField = sanitize(field);
        sanitizedField = sanitizedField == '' ? 'BLANK' + j.toString() : sanitizedField;
        sanitizedSecondaryHeaders.push(sanitizedField);
        if (sanitizedHeaders.indexOf(sanitizedField) <= -1) {
            console.log('ADDING HEADER ' + sanitizedField);
            if (field != '') {
                headerNames.push(field);
            } else {
                headerNames.push(sanitizedField);
            }
            headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
            sanitizedHeaders.push(sanitizedField);
            columnData[headerIndex[sanitizedField]]['name'] = sanitizedField;
        }
    }

    primaryDbKey = headerIndex[key];
    primaryKey = key;
    sortField = key;
    groupField = key;

    updateFieldsMenu();

    $("#second_key_sel")[0].innerHTML = '';
    updateSecondaryKeys();

    $('#second_key_sel').off();
    if (!isPrimary) {
        $('#second_key_sel').on('change', function() {
            resetTable();
            var secondaryKey = sanitize($('#second_key_sel').val());
            updateRows(data, db, table, headerIndex[secondaryKey]);
            $('a.pastebin').removeClass('disabled');
            $('a.query').removeClass('disabled');
        });
    } else {
        resetTable();
        updateRows(data, db, table, primaryDbKey);
    }
}

function updateRows(data, db, table, secondaryDbKey) {
    var str, row;
    var newRows = [];
    var sanitizedField;
    var sfield, field;

    $('#messages').html('Updating Database<img class="loading" src="./Loading_icon.gif"/>');
    console.log(data);
    console.log(headerIndex);
    console.log(sanitizedHeaders);
    window.setTimeout(function(){
        let sanitizedField;
        let dataRow;
        for (let i = 0; i < data.length; i++) {
            dataRow = data[i];
            var rowObj = {};
            for (key in dataRow) {
                if (dataRow.hasOwnProperty(key)) {
                    // console.log(field);
                    sanitizedField = sanitize(key);
                    // console.log(sanitizedField);
                    if (sanitizedField in headerIndex) {
                        rowObj[headerIndex[sanitizedField]] = dataRow[key];
                    }
                }
            }
            // console.log(rowObj);

            let secondaryKeyValue = rowObj[secondaryDbKey];
            // console.log('SECONDDARY KEY: ' + secondaryKeyValue);
            if (secondaryKeyValue == null || typeof secondaryKeyValue == typeof undefined || secondaryKeyValue == '') {
                console.log('INVALID KEY: ' + secondaryDbKey);
                continue;
            }
            secondaryKeyValue = secondaryKeyValue.toString().trim();
            // if (isNaN(secondaryKeyValue)) {
            //     secondaryKeyValue = secondaryKeyValue.trim();
            // }

            // insert new database entry
            if (primaryDbKeyValues.indexOf(secondaryKeyValue) <= -1 && secondaryKeyValue != '') {
                // console.log('NEW ENTRY');
                var datum = {};
                for (var j = 0; j < maxCols; j++) {
                    var key = 'COL' + j.toString();
                    if (!(key in datum)) {
                        datum[key] = " ";
                    }
                }
                sanitizedHeaders.forEach(sfield => {
                    if (sfield in headerIndex) {
                        let dbField = headerIndex[sfield];
                        if (typeof rowObj[dbField] !== "undefined" && rowObj[dbField] !== null) {
                            datum[dbField] = rowObj[dbField];
                        } else {
                            datum[dbField] = " ";
                        }
                    }
                });

                datum[primaryDbKey] = secondaryKeyValue;
                // console.log(datum);
                newRows.push(table.createRow(datum));
                primaryDbKeyValues.push(secondaryKeyValue.toString());
            } else { // udpate existing database entry
                // console.log('UPDATE');
                // console.log(secondaryDbKey);
                let sfield;
                sanitizedHeaders.map(function(sfield) {
                    let dbField = headerIndex[sfield];
                    if (dbField != primaryDbKey) {
                        let value = rowObj[dbField];
                        if (value != null && typeof value != typeof undefined) {
                            db.update(table).
                            set(table[dbField], value).
                            where(table[primaryDbKey].eq(rowObj[secondaryDbKey])).
                            exec().then(function() {  // Returns a Promise.
                                report('UPDATED: ' + sfield + ' ' + value);
                            });
                        }
                    }
                });
            }
        }
        for (var key in colWidths) {
            if (colWidths.hasOwnProperty(key)) {
                colWidths[key] = colWidths[key] + 2;
            }
        }
        console.log('INSERT INTO TABLE');
        db.insertOrReplace().into(table).values(newRows).exec().then(function() {
            baseQuery = "select().from(table)";
            $('#query').val(baseQuery);
            // queryHWSet(db, table, baseQuery, groupField);
            $(this).val('Select Matching Key...');
            let columnsWithRoutines = [];
            for (let key in columnData) {
                if (columnData.hasOwnProperty(key)) {
                    if (columnData[key].hasOwnProperty('routine') && columnData[key].routine != "") {
                        columnsWithRoutines.push(columnData[key]);
                    }
                }
            }
            console.log(columnData);
            recalculateColumns(db, table, columnsWithRoutines);
        });
    }, 0);
}

function addColumn(db, table, field, routine) {

    let sanitizedField = sanitize(field);
    sanitizedField = sanitizedField == '' ? 'BLANK' + sanitizedHeaders.length : sanitizedField;

    if (sanitizedHeaders.indexOf(sanitizedField) <= -1) {
        // sanitizedHeaders.push(sanitizedField);
        if (field != '') {
            headerNames.push(field);
        } else {
            headerNames.push(sanitizedField);
        }
        sanitizedHeaders.push(sanitizedField);
        headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
    }
    dataIndex[sanitizedField] = field;

    columnData[headerIndex[sanitizedField]]['name'] = sanitizedField;
    columnData[headerIndex[sanitizedField]]['routine'] = routine;
    recalculateColumns(db, table, [{name: sanitizedField, routine: routine}]);
    addFieldToMenu(sanitizedField);
}

function recalculateColumns(db, table, columns) {

    var newRows = [];
    let functionStr = 'return db.select().from(table).exec()';
    console.log(functionStr);
    console.log(columnData);
    let queryFunc = new Function('db', 'table',  functionStr);
    queryFunc(db, table).then(function(rows) {
        // let value = '';
        let sanitizedField;
        let dbField;
        columns.forEach(col => {
            let sfield = col.name;
            let routine = col.routine;
            // console.log(sfield);
            // console.log(routine);
            // console.log(headerIndex[sfield]);
            columnData[headerIndex[sfield]].routine = routine;

            rows.forEach(function(rowObj) {

                let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'row[headerIndex[sanitize("$1")]]');
                // console.log(routineStr);
                let routineFunc = new Function('row',  routineStr);
                // console.log(sfield);
                // console.log(headerIndex[sfield]);
                rowObj[headerIndex[sfield]] = routineFunc(rowObj);
                var datum = {};
                for (var j = 0; j < sanitizedHeaders.length; j++) {
                    sanitizedField = sanitizedHeaders[j];
                    if (sanitizedField in headerIndex) {
                        dbField = headerIndex[sanitizedField];
                        if (typeof rowObj[dbField] !== "undefined" && rowObj[dbField] !== null) {
                            datum[dbField] = rowObj[dbField];
                        } else {
                            datum[dbField] = "";
                        }
                    }
                }
                for (var j = 0; j < maxCols; j++) {
                    var key = 'COL' + j.toString();
                    if (!(key in datum)) {
                        datum[key] = "";
                    }
                }
                newRows.push(table.createRow(datum));
            });
        });
        db.insertOrReplace().into(table).values(newRows).exec().then(function() {
            console.log(groupField);
            queryHWSet(db, table, baseQuery, groupField);
        });
    });
}

// function recalculateColumn(db, table, sfield, routine) {
//
//     columnData[headerIndex[sfield]]['routine'] = routine;
//
//     let functionStr = 'return db.select().from(table).exec()';
//     console.log(functionStr);
//     let queryFunc = new Function('db', 'table',  functionStr);
//
//     let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'row[headerIndex[sanitize("$1")]]');
//     console.log(routineStr);
//     var routineFunc = new Function('row',  routineStr);
//
//     console.log(sfield);
//     console.log(headerIndex[sfield]);
//     queryFunc(db, table).then(function(rows) {
//         let value = '';
//         let newRows = [];
//         let sanitizedField;
//         let dbField;
//         rows.forEach(function(rowObj) {
//             rowObj[headerIndex[sfield]] = routineFunc(rowObj);
//             var datum = {};
//             for (var j = 0; j < sanitizedHeaders.length; j++) {
//                 sanitizedField = sanitizedHeaders[j];
//                 if (sanitizedField in headerIndex) {
//                     dbField = headerIndex[sanitizedField];
//                     if (typeof rowObj[dbField] !== "undefined" && rowObj[dbField] !== null) {
//                         datum[dbField] = rowObj[dbField];
//                     } else {
//                         datum[dbField] = "";
//                     }
//                 }
//             }
//             for (var j = 0; j < maxCols; j++) {
//                 var key = 'COL' + j.toString();
//                 if (!(key in datum)) {
//                     datum[key] = "";
//                 }
//             }
//             newRows.push(table.createRow(datum));
//         });
//         db.insertOrReplace().into(table).values(newRows).exec().then(function() {
//             queryHWSet(db, table, baseQuery, primaryKey);
//         });
//     });
// }

//https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function queryHWSet(db, table, query, field) {

    $('th').css('background-color', '');
    $('th').css('color', '');
    $('th').find('a').css('color', '');
    $('th').find('div').css('color', '');
    $('td').css('border-left', '');
    $('td').css('border-right', '');
    $('td').css('color', '#eee');

    var dbGroup = headerIndex[field];

    resetTable();

    var prev_row = null;
    var prev_tableRow = null;
    var white = 'rgb(255, 255, 255)';
    var grey = 'rgb(245, 245, 245)';
    var bgcolor;
    var order = lf.Order.DESC;
    var index = 0;
    var count = 0;

    var queryFunc = new Function('db', 'table',  'return db.' + query + '.exec()');

    $('#messages').html('Running Query<img class="loading" src="./Loading_icon.gif"/>');
    window.setTimeout(function(){
        return queryFunc(db, table).then(function(rows) {
            rows.forEach(function(row, rowIndex) {
                // console.log(row);
                var tableRow = document.getElementById('mainTable').getElementsByTagName('tbody')[0].insertRow(-1);

                var cell;
                cell = tableRow.insertCell(0);
                $(cell).addClass('col_count');
                $(cell).attr('field', 'count');

                if ((prev_row == null) || (prev_row[dbGroup] != row[dbGroup])) {
                    $(".col_count[index='" + index + "']:not(:first)").html(count + '<strong style="float:right">&ndash;</strong>');
                    $("td.root[index='" + index + "']").html(count);
                    index++;
                    count = 1;
                    $(cell).addClass('root');
                    $(tableRow).addClass('root');
                } else {
                    count++;
                    $(cell).addClass('branch');
                    $(tableRow).addClass('branch');
                }
                $(".col_count[index='" + index + "']:not(:first)").html(count + '<strong style="float:right">&ndash;</strong>');
                $("td.root[index='" + index + "']").html(count);

                $(tableRow).attr('index', index);
                $(cell).attr('index', index);
                $(cell).attr('clicked', 0);
                cell.textContent = count ;

                sanitizedHeaders.map(function(hfield) {
                    var $td = $("<td>", {
                        'field': hfield,
                        'class':'col_' + hfield
                    });
                    $td.text(row[headerIndex[hfield]]);
                    $td.appendTo($(tableRow));
                });

                prev_row = row;
                prev_tableRow = tableRow;

            });

            refreshTable(db, table, field);
        });
    }, 0);
}

function refreshTable(db, table, field) {
    console.log('REFRESHTABLE');
    updateKeys();

    $('#messages').text('Query Completed');
    $('#query_msg').hide();

    $('td.root').each(function() {
        var count = $(this).html();
        if (count > 1) {
            $(this).html(count + "<strong style='color:SteelBlue;float:right'>+</strong>");
        }
    });


    var colClass = 'col_' + field;

    $('td.' + colClass).css('border-left', '2px solid SteelBlue');
    $('td.' + colClass).css('border-right', '2px solid SteelBlue');

    if (field != 'unixtime') {
        // $('td').css('color', '#ccc');
        $('td.' + colClass).css('color', '');
        $('td.col_count').css('color', '');
    } else {
        $('td').css('color', '');
    }

    $('td').off();
    $('td.col_count').click(function() {
        console.log('COL_COUNT CLICKED');
        var index = $(this).closest('tr').attr('index');
        var clicked = 1 - parseInt($(this).closest('tr').find('td.col_count').attr('clicked'));
        $(".col_count[index='" + index + "']").attr('clicked', clicked);
        $(".col_count[index='" + index + "']").closest('tr').attr('clicked', clicked);

        $("td").css('color', '');
        $("td." + colClass).css('color', '');
        $("td.col_count").css('color', '');
        $("tbody tr[clicked=1] td").css('color', '');
        $("tbody tr[clicked=1][index='" + index + "'] td.col_count").css('background-color', 'hsl(' + highlightHue + ', 45%, 90%');
        highlightHue = (highlightHue + 75) % 360;
        $("tbody tr[clicked!=1] td").css('background-color', '');

        $("tbody tr[clicked=1]").show();
        $("tbody tr[clicked=1] td.col_chkbox input[type='checkbox']").prop('checked', true);
        $("tbody tr[clicked!=1]").hide();
        $("tbody tr[clicked!=1] td.col_chkbox input[type='checkbox']").prop('checked', false);
        $("tbody tr.root").show();

        $("td.col_count[clicked=1]").each(function() {
            $(this).html($(this).html().replace(/\+/, '-'));
        });
        $("td.col_count[clicked!=1]").each(function() {
            $(this).html($(this).html().replace(/\-/, '+'));
        });
    });



    var sfield;
    for (var j = 0; j < sanitizedHeaders.length; j++) {
        sfield = sanitizedHeaders[j];
        colWidths[sfield] = Math.max($("td[field='" + sfield + "']").width(), $("th[field='" + sfield + "']").width());
    }
    colWidths['count'] = 25;

    for (var key in colWidths) {
        if (colWidths.hasOwnProperty(key)) {
            colWidths[key] = colWidths[key] + 25;
        }
    }

    $('th, td').each(function() {
        var field = $(this).attr('field');
        if ($(".field_checkbox[field='" + field + "']").is(':checked')) {
            $(this).show();
        } else {
            $(this).hide();
        }

    });

    var tableWidth = 0;
    $('th:visible').each(function() {
        tableWidth += colWidths[$(this).attr('field')];
    });

    // $('#mainTable').css('width', 'auto');
    $('#mainTable').css('width', tableWidth);
    $('#table-container').css('width', tableWidth + 15);
    $('tbody tr').css('width', tableWidth);
    $('thead tr').css('width', tableWidth);
    $('th, td').each(function() {
        $(this).css('width', colWidths[$(this).attr('field')]);
    });
    $('tbody').css('margin-top', parseInt($('th').first().css('height')));

    $('.nav-item.calculated_column').show();
    $('tr.branch').hide();

    // var gridViewScroll = new GridViewScroll({
    //     elementID : "mainTable", // Target element id
    //     width : '100%', // Integer or String(Percentage)
    //     height : '100%', // Integer or String(Percentage)
    //     freezeColumn : true, // Boolean
    //     freezeFooter : false, // Boolean
    //     freezeColumnCssClass : "col_count", // String
    //     freezeFooterCssClass : "", // String
    //     freezeHeaderRowCount : 1, // Integer
    //     freezeColumnCount : 1, // Integer
    //     // onscroll: function (scrollTop, scrollLeft) // onscroll event callback
    // });
    // gridViewScroll.enhance();
    updateButtons(db, table);
}

function updateButtons(db, table) {
    var fieldToLf = {};
    sanitizedHeaders.map(function(field) {
        fieldToLf[field] = 'table.' + field;
        if (!(clickedArray.hasOwnProperty(field))) {
            clickedArray[field] = 0;
        }
    });

    $("#exportCSV").off();
    $("#exportCSV").click(function () {
        $('th div.triangle').html('');

        // var $clone = $table.clone( true );
        // $clone.find('th div.triangle').html('');

        var $table = $('#mainTable');
        var csv = $table.table2csv('return', {
            "separator": ",",
            "newline": "\n",
            "quoteFields": true,
            "excludeColumns": ".col_chkbox, .col_count",
            "excludeRows": "",
            "trimContent": true,
            "filename": "table.csv"
        });

        csv = csv.replace(/Group byStatisticsRecalculateHide/g, '');

        // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
        var universalBOM = "\uFEFF";
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/csv;charset=UTF-8,'
        + encodeURIComponent(universalBOM + csv));
        a.setAttribute('download', 'untitled.csv');
        a.click()
        // window.location.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(universalBOM + csv);
        $('th div.triangle').html('&#x25ba;');
    });

    $('#exportJSON').off();
    $('#exportJSON').on('click', function(){
        console.log(headerIndex);
        db.export().then(function(data) {
            for (let key in headerIndex){
                if(headerIndex.hasOwnProperty(key)){
                    columnData[headerIndex[key]]['name'] = key;
                }
            }
            var jsonObj = {'primaryDbKey': primaryDbKey, 'columns': columnData, 'database' : data};
            console.log(jsonObj);
            // console.log(JSON.stringify(jsonObj));
            var a = document.createElement('a');
            a.setAttribute('href', 'data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(jsonObj)));
            a.setAttribute('download', 'database.json');
            a.click()
            // window.location.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
        });
    });

    $('.field_reference').html('');
    sanitizedHeaders.forEach(function(field) {
        $('.field_reference').append('<button class="field btn btn-outline-info btn-sm">' + field + '</button>');
    });

    $('.field_reference button.field').off();
    $('.field_reference button.field').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        // console.log(e);
        insertAtCursor(document.getElementById('column_routine'), '+(@' + $(this).text() + ')');
    });
    $('#calculated_column').off();
    $('#calculated_column').click(function() {
        $('#column_bin').find('.column_name').val('COL' + sanitizedHeaders.length);
    });

    $('#query_submit').off();
    $('#query_submit').on('click', function() {
        baseQuery = $('#query').val();
        queryHWSet(db, table, baseQuery, primaryKey);
        $('.dropdown-toggle.query').dropdown('toggle');
    })

    $('#column_submit').off();
    $('#column_submit').on('click', function() {
        let sfield = $('#column_bin').find('.column_name').val();
        let routine = $('#column_routine').val();
        // columnData[headerIndex[sanitizedField]]['name'] = sanitizedField;
        // $('.dropdown-toggle.query').dropdown('toggle');
        $('#messages').html('Adding Column<img class="loading" src="./Loading_icon.gif"/>');
        window.setTimeout(function(){
            if (sanitizedHeaders.indexOf(sfield) <= -1) {
                addColumn(db, table, sfield, routine);
            } else {
                recalculateColumns(db, table, [{name: sfield, routine: routine}]);
            }
            $('#column_bin').modal('hide');
        }, 0);

    });

    $('.secondary-input').off();
    $('#secondary-file-input').on('change', function(event) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var results = Papa.parse(e.target.result, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            data = results.data;
            if (data.length < 1) {
                return;
            }
            headers = results.meta['fields'];
            console.log(headers);
            // var contents = e.target.result;
            updateTable(db, table, data, headers, primaryKey, false);
            $('#second_key_li').show();
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
        }
        reader.readAsText(event.target.files[0]);
    });

    $('#secondary-json-input').off();
    $('#secondary-json-input').on('change', function(event) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var jsonObj = JSON.parse(e.target.result);
            console.log(jsonObj);
            let dataOriginal = jsonObj.database.tables.LogTable0;
            if (dataOriginal.length < 1) {
                return;
            }

            let data = dataOriginal.map(datum => {
                let newDatum = {};
                for (key in datum) {
                    if (datum.hasOwnProperty(key)) {
                        newDatum[jsonObj.columns[key].name] = datum[key];
                    }
                }
                return newDatum;
            });
            // console.log(data);

            let headers = [];
            let sfield;
            for (let key in jsonObj.columns) {
                if(jsonObj.columns.hasOwnProperty(key)){
                    if (jsonObj.columns[key].name != null && jsonObj.columns[key].name != '' && typeof jsonObj.columns[key].name !== typeof undefined) {
                        sfield = jsonObj.columns[key].name;
                        headers.push(sfield);
                        if (sanitizedHeaders.indexOf(sfield) <= -1) {
                            console.log('ADDING HEADER ' + sfield);
                            headerIndex[sfield] = 'COL' + sanitizedHeaders.length;
                            sanitizedHeaders.push(sfield);
                            columnData[headerIndex[sfield]]['name'] = sfield;
                        }
                    }
                    if ('routine' in jsonObj.columns[key]) {
                        columnData[headerIndex[sfield]]['routine'] = jsonObj.columns[key].routine;
                    }
                }
            }
            console.log(headers);
            // var contents = e.target.result;
            updateTable(db, table, data, headers, primaryKey, false);
            $('#second_key_li').show();
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
        }
        reader.readAsText(event.target.files[0]);
    });

    $('#secondary-xlsx-input').off();
    $('#secondary-xlsx-input').on('change', function(event) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var data = e.target.result;
          var workbook = XLSX.read(data, {
              type: 'binary'
          });

          // console.log(workbook.SheetNames);
          let sheetName = workbook.SheetNames[0];
          var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
          console.log(XL_row_object);
          var json_object = JSON.stringify(XL_row_object);
          let headers = Object.keys(XL_row_object[0]);
            console.log(headers);
            updateTable(db, table, XL_row_object, headers, primaryKey, false);
            $('#second_key_li').show();
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
        }
        reader.readAsBinaryString(event.target.files[0]);
    });

    $('#fields_submit').off();
    $('#fields_submit').on('click', function() {
        var results = Papa.parse($('#fields').val(), {
            header: true,
            dynamicTyping: false,
        });
        console.log(results);
        data = results.data;
        if (data.length < 1) {
            return;
        }
        headers = results.meta['fields'];
        console.log(headers);
        updateTable(db, table, data, headers, primaryKey, false);
        $('#second_key_li').show();
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide')
    });

    $("th a").off();

    $("a.group_by[field!='count'][field!='chkbox']").off();
    $("a.group_by[field!='count'][field!='chkbox']").on('click', function() {
        $('th div.triangle').html('&#x25ba;');
        sortField = $(this).closest('th').attr('field');
        groupField = sortField;
        var sort = fieldToLf[sortField];

        var clicked = -1;
        clickedArray[sortField] = clicked;

        query = baseQuery +  ".orderBy(table." + headerIndex[sortField] + ", lf.Order.DESC)";
        $('#query').val(query);

        queryHWSet(db, table, query, groupField);
    });

    $('th').find('.fields.statistics').off();
    $('th').find('.fields.statistics').click(function() {
        var array = [];
        var field = $(this).attr('field');
        $("td[field='" + field + "']").each(function() {
            if ($(this).text() != '' && $(this).text() != null && typeof $(this).text() != typeof undefined) {
                array.push(+($(this).text()));
            }
        });

        statistics(array, field);
    });

    $('.fields.recalculate').off();
    $('.fields.recalculate').click(function() {
        let sfield = $(this).attr('field');
        $('#column_bin').find('.column_name').val(sfield);
        $('#column_routine').val('');
        $('#column_routine').val(columnData[headerIndex[sfield]]['routine']);
    });

    $('.fields.hide').off();
    $('.fields.hide').click(function() {
        var field = $(this).attr('field');
        $('#' + field + '_checkbox').click();
    });

    $("th div.triangle").off();
    $("th div.triangle").on('click', function() {
        $('th div.triangle').html('&#x25ba;');
        sortField = $(this).closest('th').attr('field');

        var clicked = clickedArray[sortField];
        clicked = clicked == 0 ? -1 : -1*clicked;
        clickedArray[sortField] = clicked;

        $(this).closest('th').attr('clicked', clicked);

        var aContent, bContent;
        var tbody = $('#mainTable').find('tbody');

        console.log(groupField);
        if (sortField != groupField && sortField != 'count' && groupField != primaryKey) {
            tbody.find('tr').sort(function(a, b) {
                aContent = $('td[field="' + sortField + '"]', a).html();
                bContent = $('td[field="' + sortField + '"]', b).html();

                aContent = typeof aContent !== typeof undefined ? aContent : '';
                bContent = typeof bContent !== typeof undefined ? bContent : '';

                if (isNaN(aContent) || isNaN(bContent)) {
                    return ($('td[field="' + groupField + '"]', a).html().localeCompare($('td[field="' + groupField + '"]', b).html())) || clicked*(aContent.localeCompare(bContent));
                } else {
                    return ($('td[field="' + groupField + '"]', a).html().localeCompare($('td[field="' + groupField + '"]', b).html())) || clicked*(+aContent - +bContent);
                }
            }).appendTo(tbody);
        } else {
            tbody.find('tr').sort(function(a, b) {
                aContent = $('td[field="' + sortField + '"]', a).html();
                bContent = $('td[field="' + sortField + '"]', b).html();
                if ((isNaN(aContent) || isNaN(bContent)) && sortField != 'count') {
                    return clicked*(aContent.localeCompare(bContent));
                } else {
                    return clicked*(+aContent - +bContent);
                }
            }).appendTo(tbody);
        }
        tbody.find('tr').each(function(rowIndex) {
            $(this).find('td[field=' + sortField+ ']')
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'bottom')
                .attr('title', 'rank ' + (rowIndex + 1).toString());
        });

        tbody.find('tr.branch').each(function() {
            var index = $(this).closest('th').attr('index');
            $(this).closest('th').detach().insertAfter($("tr.root[index='" + index + "']"));
        });
        if ($(this).closest('th').attr('clicked') == 1) {
            $(this).html('&#x25B2;');
        } else if ($(this).closest('th').attr('clicked') == -1){
            $(this).html('&#x25BC;');
        }
        $('tbody').css('margin-top', parseInt($('th').first().css('height')) + 'px');
    });

    var field;
    $("th").each(function() {
        field = $(this).attr('field');
        if (field != groupField) {
            $(this).find('a.triangle').html('&#x25BA;');
            $(this).css('background-color', '');
            $(this).find('a').css('color', '');
            $(this).find('div').css('color', '');
        } else {
            $(this).css('background-color', 'SteelBlue');
            $(this).find('a.header').css('color', 'white');
            $(this).find('div.triangle').css('color', 'white');

            if (clickedArray[field] == 1) {
                $(this).find('.triangle').html('&#x25B2;');
                $(this).find('.triangle').show();
            } else if (clickedArray[field] == -1) {
                $(this).find('.triangle').html('&#x25BC;');
                $(this).find('.triangle').show();
            }
        }
    });

    $('tr').off();
    $('tr').on('click', function() {
        $('td').css('color', '');
        $(this).find('td').css('color', 'red');
    });

    $('td').on('click', function() {
        var query = 'select().from(table).where(lf.op.and(table.' + headerIndex[$(this).attr('field')] + ".eq('" + $(this).text() + "')))";
        $('#query').val(query);

    });

}

function statistics(values, field) {
    $('#statistics').modal('toggle');
    $('.modal-title.field').text(field);

    let array = values.map(value => {return isNaN(value) ? 0 : value;});

    $('#statistics').find('.modal-body').find('.stats').html('COUNT: ' + array.length + '<br/>MEDIAN: ' + math.median(array) + '<br/>' + 'MEAN: ' + Math.round(100*math.mean(array))/100 +  '<br/>' + 'Standard Deviation: ' + Math.round(100*math.std(array))/100);

    $('#max').val(math.max(array));

    bars(array);
}


function addFieldToMenu(field) {
    var a = document.createElement("a");
    $(a).addClass("dropdown-item");
    $(a).attr('href', "#");

    $(a).html("<input class='field_checkbox' checked type='checkbox' field='" + field + "' id='" + field + "_checkbox'>&nbsp;<label class='form-check-label' for='" + field + "_checkbox'>" + field + "</label>" +
    "&nbsp;&nbsp;<a href='#' class='fields statistics' field='" + field + "'>Statistics</a>");
    $("#columns_menu").append(a);

    var f = document.createElement("a");
    $(f).addClass("dropdown-item");
    $(f).attr('href', "#");
    $(f).html("<span class='fields_item' field='" + field + "'>" + field + "</span>");
    $(".fields_menu").append(f);
}

function updateFieldsMenu() {
    $('#columns_menu').html('');
    var a = document.createElement("a");
    $(a).addClass("dropdown-item");
    $(a).attr('href', "#");
    $(a).html("<input class='field_checkbox' checked type='checkbox' field='count' id='count_checkbox'>&nbsp;<label class='form-check-label' for='count_checkbox'>Count</label>");
    $("#columns_menu").append(a);

    sanitizedHeaders.map(function(field) {
        addFieldToMenu(field);
    });

}

function updateKeys() {
    var o = new Option("option text", "value");
    $(o).html('Select Primary Key...');
    $(o).attr('selected');
    $("#key_sel").append(o);

    sanitizedHeaders.map(function(field) {
        var o = new Option("option text", "value");
        $(o).html(field);
        $(o).val(field);
        $("#key_sel").append(o);
    });

    $('.field_checkbox').off();
    $('.field_checkbox').on('change', function() {
        var field = $(this).attr('field');
        if ($(this).is(':checked')) {
            $('th[field="' + field + '"], td[field="' + field + '"]').show();
        } else {
            $('th[field="' + field + '"], td[field="' + field + '"]').hide();
        }

        var tableWidth = 0;
        $('th:visible').each(function() {
            tableWidth += colWidths[$(this).attr('field')];
        });

        $('#table-container').css('width', tableWidth + 15);
        $('#mainTable').css('width', tableWidth);
        $('#mainTable > thead > tr').css('width', tableWidth);
    });

    // https://stackoverflow.com/questions/659508/how-can-i-shift-select-multiple-checkboxes-like-gmail
    var $chkboxes = $('.field_checkbox');
    var lastChecked = null;
    $chkboxes.click(function(e) {
        if (!lastChecked) {
            lastChecked = this;
            return;
        }

        if (e.shiftKey) {
            var start = $chkboxes.index(this);
            var end = $chkboxes.index(lastChecked);

            $chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).prop('checked', lastChecked.checked);

            $chkboxes.each(function() {
                var field = $(this).attr('field');
                if ($(this).is(':checked')) {
                    $('th[field="' + field + '"], td[field="' + field + '"]').show();
                } else {
                    $('th[field="' + field + '"], td[field="' + field + '"]').hide();
                }

                var tableWidth = 0;
                $('th:visible').each(function() {
                    tableWidth += colWidths[$(this).attr('field')];
                });

                $('#table-container').css('width', tableWidth + 15);
                $('#mainTable').css('width', tableWidth);
                $('#mainTable > thead > tr').css('width', tableWidth);
            });
        }

        lastChecked = this;
    });

    $('#columns_menu').find('.fields.statistics').click(function() {
        var array = [];
        var field = $(this).attr('field');
        $("td[field='" + field + "']").each(function() {
            array.push($(this).text());
        });
        statistics(array, field);
    });

}

function updateSecondaryKeys() {
    var o = new Option("option text", "value");
    $(o).html('Select Matching Key...');
    $(o).attr('selected');
    $("#second_key_sel").append(o);

    sanitizedSecondaryHeaders.map(function(field, index) {
        var o = new Option("option text", "value");
        $(o).html(field);
        $(o).val(field);
        $("#second_key_sel").append(o);
    });

}

function loadPrimary(data, headers) {
    colWidths = {};
    for (var i = 0; i < maxCols; i++) {
        columnData['COL' + i] = {};
    }

    var field;
    var sanitizedField;

    headerNames = [];
    sanitizedHeaders = [];
    colWidths = {};

    for (j = 0; j < headers.length; j++) {
        field = headers[j].replace(/^\s+|\s+$/g, "");
        field = field == '' ? 'BLANK' + (j + 1) : field;
        headerNames.push(field);
        sanitizedField = sanitize(field);
        sanitizedHeaders.push(sanitizedField);
        headerTypes[sanitizedField] = lf.Type.STRING;
        headerIndex[sanitizedField] = 'COL' + j.toString();
        // columnData[headerIndex[sanitizedField]]['name'] = sanitizedField;
        columnData[headerIndex[sanitizedField]]['routine'] = '';
        dataIndex[sanitizedField] = headers[j];
    }

    $("#key_sel").html('');
    $("#second_key_sel").html('');
    updateKeys();
    $('#key_div').css('display', 'inline-block');
    $('#hover_msg').text('Please Set the Primary Key');
    $("#key_sel").tooltip('show');

    $('#key_sel').off();
    $('#key_sel').on('change', function() {
        initializeDB(data, headers, sanitize($(this).val()));
        $("#key_sel").tooltip('hide');
    });
}


var margin = {top: 10, right: 30, bottom: 30, left: 40},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

var svg = d3.select("#bars")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
"translate(" + margin.left + "," + margin.top + ")");

// append the svg object to the body of the page
// https://www.d3-graph-gallery.com/graph/histogram_binSize.html
function bars(data) {
    // A function that builds the graph for a specific value of bin
    function update(nBin, max) {

        d3.selectAll("svg").remove();
        var svg = d3.select("#bars")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


        var x = d3.scaleLinear()
        //.domain([0, 100])     // can use this instead of 1000 to have the max of data:
        // .domain([0, d3.max(data, function(d) { return +d })])
        .domain([0, max])
        .range([0, width]);
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        // Y axis: initialization
        var y = d3.scaleLinear()
        .range([height, 0]);
        var yAxis = svg.append("g");

        var thresholds = [];
        for(let i = 0; i < +nBin; i++) {
            thresholds.push(i*Math.round(100*max/nBin)/100);
        }

        // set the parameters for the histogram
        var histo = d3.histogram()
        .domain(x.domain())  // then the domain of the graphic
        // .thresholds(x.ticks(nBin)); // then the numbers of bins
        .thresholds(thresholds);

        // And apply this function to data to get the bins
        var bins = histo(data.map(function(d) {return Math.max(+d - 0.5, 0);}));
        // Y axis: update now that we know the domain
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        yAxis
        //.transition()
        //.duration(1000)
        .call(d3.axisLeft(y));

        // Join the rect with the bins data
        var u = svg.selectAll("rect")
        .data(bins);

        // Manage the existing bars and eventually the new ones:
        u
        .enter()
        .append("rect") // Add a new rect for each new elements
        .merge(u) // get the already existing elements as well
        //.transition() // and apply changes to all of them
        //.duration(1000)
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return Math.round(Math.max(0, x(d.x1) - x(d.x0) -1)) ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "SteelBlue");

        // If less bar in the new histogram, I delete the ones not in use anymore
        u
        .exit()
        .remove();

    }

    update(+$('#nBin').val(), +$('#max').val());

    // Listen to the button -> update if user change it
    d3.select("#nBin").on('input', function() {
        update(+$(this).val(), +$('#max').val());
    });
    d3.select("#max").on('input', function() {
        update(+$('#nBin').val(), +$(this).val());
    });

}

// https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
function insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
    myField.focus();
}

function postInitialization(db, table) {
    console.log('POSTINIT');

    $('.nav-item.dropdown.update').show();
    $('#key_sel').closest('li').find('a').addClass("disabled").attr('aria-disabled', 'true');
    $('#export').show();
    $('a.pastebin').removeClass('disabled');
    $('a.query').removeClass('disabled');

    $('#import').hide();
    $('#exportJSON').show();
    $('#columns_toggle').show();
    $('#fields').closest('li').hide();
    $('#primary-file-input').closest('li').hide();
    $('#query').closest('li').show();
    $('#messages').html('<strong>Database Loaded.</strong>');
    $('#hover_msg').hide();

    baseQuery = "select().from(table)";
    $('#query').val(baseQuery);

    var fieldToLf = {};
    sanitizedHeaders.map(function(field) {
        fieldToLf[field] = 'table.' + field;
        if (!(clickedArray.hasOwnProperty(field))) {
            clickedArray[field] = 0;
        }
    });
    clickedArray['count'] = 0;

    updateButtons(db, table);

}

$(function () {

    $('input[type=file]').click(function () {
        this.value = null;
    });

    var $table = $('#mainTable');

    $('#primary-file-input').change(function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            let plaintextDB = e.target.result;
            let results = Papa.parse(plaintextDB, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            data = results.data;
                if (data.length < 1) {
                    return;
                }
            let headers = results.meta['fields'];
            loadPrimary(data, headers);
        }
        reader.readAsText(e.target.files[0]);
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
    });

    $('#importJSON').change(function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
            $('#mainTable').find('tbody').html('');

            var jsonObj = JSON.parse(e.target.result);
            console.log(jsonObj);
            var row;
            var rows = [];
            var field;
            var dbKey = jsonObj.primaryDbKey;
            var dbName = jsonObj.database.name;
            primaryDbKey = dbKey;

            indexedDB.deleteDatabase(dbName);
            schemaBuilder = lf.schema.create(dbName, jsonObj.database.version);

            var tableBuilder = schemaBuilder.createTable('LogTable0');

            for (var j = 0; j < maxCols; j++) {
                tableBuilder = tableBuilder.addColumn('COL' + j.toString(), lf.Type.STRING);
                if (dbKey == 'COL' + j.toString()) {
                    tableBuilder = tableBuilder.addPrimaryKey([dbKey]);
                }
            }

            colWidths = {};
            for (var i = 0; i < maxCols; i++) {
                columnData['COL' + i] = {};
            }

            dataIndex = {};
            headerIndex = {};
            sanitizedHeaders = [];
            for (let key in jsonObj.columns) {
                if(jsonObj.columns.hasOwnProperty(key)){
                    if (jsonObj.columns[key].name != null && jsonObj.columns[key].name != '' && typeof jsonObj.columns[key].name !== typeof undefined) {
                        dataIndex[key] = jsonObj.columns[key].name;
                        headerIndex[jsonObj.columns[key].name] = key;
                        headerNames.push(jsonObj.columns[key].name);
                        sanitizedHeaders.push(jsonObj.columns[key].name);
                        columnData[key]['name'] = jsonObj.columns[key].name;
                        columnData[key]['routine'] = jsonObj.columns[key].routine;
                    }
                }
            }
            console.log(headerIndex);
            console.log(sanitizedHeaders);
            primaryKey = dataIndex[primaryDbKey];
            sortField = primaryKey;
            groupField = primaryKey;

            let o = new Option("option text", "value");
            $(o).html(primaryKey);
            $(o).attr('selected');
            $("#key_sel").html('');
            $("#key_sel").append(o);
            $('#key_div').css('display', 'inline-block');
            $('#key_sel').closest('li').find('a').addClass("disabled").attr('aria-disabled', 'true');

            updateFieldsMenu();

            schemaBuilder.connect().then(function(db) {
                db.import(jsonObj.database);
                console.log(db);
                var logTable = db.getSchema().table('LogTable0');
                baseQuery = "select().from(table)";
                postInitialization(db, logTable);
                queryHWSet(db, logTable, baseQuery, primaryKey);
                $('#import').hide();
                $('#messages').html('');
                $('#hover_msg').hide();
            });
        }
        reader.readAsText(e.target.files[0]);
    });

    $('#importXLSX').change(function(e) {
        // https://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });

            // console.log(workbook.SheetNames);
            let sheetName = workbook.SheetNames[0];
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            console.log(XL_row_object);
            var json_object = JSON.stringify(XL_row_object);
            // console.log(json_object);
            // workbook.SheetNames.forEach(function(sheetName) {
            //     // Here is your object
            //     var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            //     var json_object = JSON.stringify(XL_row_object);
            //     console.log(json_object);
            //
            // })
            let headers = Object.keys(XL_row_object[0]);
            console.log(headers);
            loadPrimary(XL_row_object, headers);
        };

        reader.onerror = function(ex) {
            console.log(ex);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });

    $('#fields_submit').on('click', function() {
        let results = Papa.parse($('#fields').val(), {
            header: true,
            dynamicTyping: false,
        });
        console.log(results);
        data = results.data;
            if (data.length < 1) {
                return;
            }
        let headers = results.meta['fields'];
        loadPrimary(data, headers);
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide');
    });

    $('#query').keydown(function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            $('#query_submit').click();
        }
    });

    $('#paste_file').on('change', function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            $('#fields').val(contents);
        }
        reader.readAsText(e.target.files[0]);
    });

     $('[data-toggle="tooltip"]').tooltip();

     $('#reset').click(function() {
         $('.nav-item.dropdown.update').hide();
         $('#key_sel').closest('li').find('a').removeClass("disabled").attr('aria-disabled', 'false');
         $('#export').hide();
         $('a.pastebin').addClass('disabled');
         $('a.query').add('disabled');

         $('#import').show();
         $('#exportJSON').hide();
         $('#columns_toggle').hide();
         $('#fields').closest('li').show();
         $('#primary-file-input').closest('li').show();
         $('#query').closest('li').hide();
         $('#messages').html('');
         $('#hover_msg').html('No Database Loaded Yet').show();

         $('#table-container').css('width', '100%');
         $('#mainTable').css('width', '100%');
         $('#mainTable thead tr').html('');
         $('#mainTable tbody').html('').css('margin-top', '');
         sortField = 'undefined';
         groupField = 'undefined';
         headerNames = [];
         sanitizedHeaders = [];
         secondaryHeaderNames = [];
         sanitizedSecondaryHeaders = [];
         headerTypes = {};
         baseQuery = '';
         clickedArray = {};
         colWidths = {};
         primaryDbKeyValues = [];
         headerIndex = {};
         dataIndex = {};
         highlightHue = 0;
         primaryDbKey = '';
         primaryKey = '';
         primaryFile = null;
         schemaBuilder = null;
         maxCols = 100;
         columnData = new Object();
     });
})
