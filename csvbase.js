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
// var headerIndex = {};
var dataIndex = {};
var highlightHue = 0;
var primaryDbKey = '';
var primaryKey = '';
var primaryFile = null;
var tableVersion = 0;
var schemaBuilder;
var maxCols = 0;
var columnData = new Object();
var dbFields;


function initializeDB(data, headers, key, sqlite = null) {
    $('#mainTable').find('tbody').html('');

    var row;
    var rows = [];
    var field;
    var dbKey = sanitize(key);

    console.log('PRIMARY KEY: ' + dbKey);
    // var dbName = 'csvDB' + JSON.stringify(data).hashCode();

    config = {
        locateFile: filename => `js/${filename}`
    }
    initSqlJs(config).then(function(SQL){
        var db = sqlite == null ? new SQL.Database() : new SQL.Database(sqlite);
        let meta;
        dbFields = headers.map(field => {return "`" + field + "`";});
        let columns = dbFields.map(field => {
            meta = field + " char";
            if (field == '`' + dbKey + '`') {
                meta += " PRIMARY KEY";
            }
            return meta;
        });

        console.log(columns);
        // db.run("CREATE TABLE DataTable (" + colQuery + ");");
        db.run("CREATE TABLE DataTable (" + columns.join(",") + ");");

        let results = db.exec("SELECT * FROM DataTable ");
        console.log(results);

        sortField = dbKey;
        groupField = dbKey;
        primaryKey = key;
        primaryDbKey = dbKey;


        postInitialization(db, 'DataTable');
        updateTable(db, 'DataTable', data, headers, primaryKey, true);
    });
}

function resetTable() {
    $('#mainTable > tbody > tr').remove();
    $('#header_row').html('<th id="th_rank" clicked="0" class="col_rank header" field="rank">Rank</th><th id="th_count" clicked="0" field="count" class="col_count header"><a href="#">#</a><div class="triangle">&#x25BA;</div></th>');

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
    let sanitizedField;
    console.log(sanitizedHeaders);
    for (var j = 0; j < headers.length; j++) {
        var field = headers[j];
        sanitizedField = sanitize(field);
        sanitizedField = sanitizedField == '' ? 'BLANK' + j.toString() : sanitizedField;
        sanitizedSecondaryHeaders.push(sanitizedField);
    }

    primaryDbKey = sanitize(key);
    primaryKey = key;
    sortField = primaryDbKey;
    groupField = primaryDbKey;

    updateFieldsMenu();
    $("#second_key_sel")[0].innerHTML = '';
    updateSecondaryKeys();

    $('#second_key_sel').off();
    if (!isPrimary) {
        $('#second_key_sel').on('change', function() {
            var secondaryKey = sanitize($('#second_key_sel').val());
            sanitizedSecondaryHeaders.forEach(header => {
                if (!(sanitizedHeaders.includes(header))) {
                    console.log('ADDING HEADER ' + header);
                    headerNames.push(header);
                    // headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
                    sanitizedHeaders.push(header);
                    // columnData[sanitizedField]['name'] = sanitizedField;
                    db.exec('ALTER TABLE DataTable ADD COLUMN ' + header + ' char;');
                }
            });
            dbFields = sanitizedHeaders.map(field => {return "`" + field + "`";});
            updateFieldsMenu();
            resetTable();
            updateRows(data, db, table, secondaryKey);
            $('a.pastebin').removeClass('disabled');
            $('a.query').removeClass('disabled');
        });
    } else {
        resetTable();
        updateRows(data, db, table, primaryKey);
    }
}

function updateRows(data, db, table, secondaryDbKey) {
    var str, row;
    var newRows = [];
    var sanitizedField;
    var sfield, field;
    let queryINSERT = '';
    let queryUPDATE = '';
    var rowObj = {};

    $('#messages').html('Updating Database<img class="loading" src="./Loading_icon.gif"/>');
    console.log(secondaryDbKey);
    console.log(data);
    // console.log(headerIndex);
    console.log(sanitizedHeaders);
    window.setTimeout(function(){
        let sanitizedField;
        for(let i = 0; i < data.length; i++) {
            rowObj = {};
            // console.log(data[i]);
            for(key in data[i]) {
                rowObj[sanitize(key)] = data[i][key];
            }
            console.log(rowObj);
            let secondaryKeyValue = rowObj[secondaryDbKey];
            // console.log('SECONDDARY KEY: ' + secondaryKeyValue);
            if (secondaryKeyValue == null || typeof secondaryKeyValue == typeof undefined || secondaryKeyValue == '') {
                console.log('INVALID KEY: ' + secondaryDbKey);
                continue;
            }
            secondaryKeyValue = secondaryKeyValue.toString().trim();

            // insert new database entry
            if (primaryDbKeyValues.indexOf(secondaryKeyValue.toString()) <= -1 && secondaryKeyValue != '') {
                // console.log('NEW ENTRY');
                let datumString = '';
                console.log(sanitizedHeaders);
                let datum = sanitizedHeaders.map(dbField => {
                    if (dbField == primaryDbKey) {
                        return '"' + secondaryKeyValue + '"';
                    } else if (typeof rowObj[dbField] !== "undefined" && rowObj[dbField] !== null) {
                        return '"' + rowObj[dbField] + '"';
                    } else {
                        return '" "';
                    }
                });

                queryINSERT += "INSERT INTO DataTable (" + dbFields.join(",") + ") VALUES (" + datum.join(",") + ");";
                // db.run(query);
                primaryDbKeyValues.push(secondaryKeyValue.toString());
            } else { // udpate existing database entry
                // console.log('UPDATE');
                // console.log(secondaryDbKey);
                sanitizedHeaders.map(function(dbField) {
                    if (dbField != primaryDbKey) {
                        let value = rowObj[dbField];
                        if (value != null && typeof value != typeof undefined) {
                            // db.update(table).
                            // set(table[dbField], value).
                            // where(table[primaryDbKey].eq(rowObj[secondaryDbKey])).
                            // exec().then(function() {  // Returns a Promise.
                            //     report('UPDATED: ' + sfield + ' ' + value);
                            // });
                            queryUPDATE += 'UPDATE DataTable SET `' + dbField + '` = "' + value + '" WHERE ' + primaryDbKey + ' = "' + secondaryKeyValue + '";';
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
        console.log(queryINSERT);
        db.run(queryINSERT);
        console.log(queryUPDATE);
        db.run(queryUPDATE);
        console.log(db.exec("SELECT * FROM DataTable"));
        baseQuery = "SELECT * FROM DataTable";
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
        // console.log(columnData);
        recalculateColumns(db, table, columnsWithRoutines);

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
        // headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
    }
    dataIndex[sanitizedField] = field;

    columnData[sanitizedField] = {};
    columnData[sanitizedField]['name'] = sanitizedField;
    columnData[sanitizedField]['routine'] = routine;

    db.exec('ALTER TABLE ' + table + ' ADD `' + sanitizedField + '` char');

    recalculateColumns(db, table, [{name: sanitizedField, routine: routine}]);
    addFieldToMenu(sanitizedField);
}

function recalculateColumns(db, table, columns) {

    let rows = db.exec("SELECT * FROM DataTable")[0].values;
    // console.log(rows);

    let query = '';

    let rowObj;
    columns.forEach(col => {
        let sfield = col.name;
        let routine = col.routine;
        columnData[sfield].routine = routine;
        rows.forEach(function(row) {
            // console.log(row);
            rowObj = {};
            sanitizedHeaders.forEach(function(dbField, index) {
                rowObj[dbField] = row[index];
            });

            let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'row[sanitize("$1")]');
            let routineFunc = new Function('row',  routineStr);
            let value =  '"' + routineFunc(rowObj) + '"';
            // query += "INSERT OR REPLACE INTO DataTable (" + dbFields.join(",") + ") VALUES (" + datumString + ");";
            query += "UPDATE DataTable SET `" + sfield  + "` =  " + value + " WHERE `" + primaryDbKey + "` = " + rowObj[primaryDbKey] + "; \n";
        });
        // console.log(sanitizedHeaders);
        // console.log(query);
        db.run(query);
    });
    queryHWSet(db, table, baseQuery, groupField);
}



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

    var dbGroup = field;

    resetTable();

    var prev_row = null;
    var prev_tableRow = null;
    var white = 'rgb(255, 255, 255)';
    var grey = 'rgb(245, 245, 245)';
    var bgcolor;
    var order = 'DESC';
    var index = 0;
    var count = 0;

    let jsonObj = {'primaryDbKey': primaryDbKey, 'columns': columnData, 'database' : []};

    // var queryFunc = new Function('db', 'table',  'return db.' + query + '.exec()');

    $('#messages').html('Running Query<img class="loading" src="./Loading_icon.gif"/>');
    console.log(query);
    window.setTimeout(function(){
        let results = db.exec(query);
        console.log(results);
        let rows = results.length ? db.exec(query)[0].values : [];
        let row;

        rows.forEach(function(simpleRow, rowIndex) {
            // console.log(simpleRow);
            row = {};
            sanitizedHeaders.forEach(function(field, index) {
                row[field] = simpleRow[index];
            });
            jsonObj.database.push(row);
            // console.log(row);
            var tableRow = document.getElementById('mainTable').getElementsByTagName('tbody')[0].insertRow(-1);

            let cell;

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

            cell = tableRow.insertCell(0);
            $(cell).addClass('col_rank');
            $(cell).attr('field', 'rank');
            cell.textContent = rowIndex + 1;


            sanitizedHeaders.map(function(hfield) {
                var $td = $("<td>", {
                    'field': hfield,
                    'class':'col_' + hfield
                });
                $td.text(row[hfield]);
                $td.appendTo($(tableRow));
            });

            prev_row = row;
            prev_tableRow = tableRow;

        });

        $('#exportJSON').off();
        $('#exportJSON').on('click', function(){
            sanitizedHeaders.forEach(function(sfield) {
                 columnData[sfield]['name'] = sfield;
             });
            console.log(jsonObj);
            // console.log(JSON.stringify(jsonObj));
            var a = document.createElement('a');
            a.setAttribute('href', 'data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(jsonObj)));
            a.setAttribute('download', 'database.json');
            a.click();
            // window.location.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
        });
        refreshTable(db, table, field);
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
    colWidths['rank'] = 25;
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
            "excludeColumns": ".col_chkbox, .col_count, .col_rank",
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

    $('#exportSqlite').off();
    $('#exportSqlite').on('click', function(){
        // https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style = "display: none";
        let data = db.export();
        let blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'database.sqlite';
        a.click();
        window.URL.revokeObjectURL(url);
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
            let dataOriginal = jsonObj.database.tables.DataTable0;
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
                            sanitizedHeaders.push(sfield);
                            columnData[sfield]['name'] = sfield;
                        }
                    }
                    if ('routine' in jsonObj.columns[key]) {
                        columnData[sfield]['routine'] = jsonObj.columns[key].routine;
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

        query = baseQuery +  " ORDER BY " + sortField + " DESC;";
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
        $('#column_routine').val(columnData[sfield]['routine']);
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

        $('tbody').find('td.col_rank').each(function(index) {
            $(this).text(index + 1);
        });
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
        // var query = 'select().from(table).where(lf.op.and(table.' + $(this).attr('field') + ".eq('" + $(this).text() + "')))";
        let query = 'SELECT * FROM DataTable WHERE `' + $(this).attr('field') + '` = ' +  '"' + $(this).text() + '"';
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
    let a = document.createElement("a");
    $(a).addClass("dropdown-item");
    $(a).attr('href', "#");
    $(a).html("<input class='field_checkbox' checked type='checkbox' field='rank' id='rank_checkbox'>&nbsp;<label class='form-check-label' for='rank_checkbox'>Rank</label>");
    $("#columns_menu").append(a);
    a = document.createElement("a");
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
    // for (var i = 0; i < maxCols; i++) {
    //     columnData['COL' + i] = {};
    // }

    columnData = {};

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
        columnData[sanitizedField] = new Object();
        columnData[sanitizedField]['name'] = sanitizedField;
        columnData[sanitizedField]['routine'] = '';
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
        initializeDB(data, sanitizedHeaders, sanitize($(this).val()));
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

    baseQuery = "SELECT * FROM DataTable";
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
            maxCols = headers.length;
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
            // console.log(jsonObj);
            let row;
            let rows;
            var field;
            var dbKey = jsonObj.primaryDbKey;
            primaryDbKey = dbKey;

            columnData = jsonObj.columns;

            let headers = [];
            for (let key in columnData) {
                if (columnData.hasOwnProperty(key)) {
                    headers.push(key);
                    sanitizedHeaders.push(key);
                }
            }
            console.log(headers);

            // jsonObj.database.forEach(function(obj) {
            //     console.log(obj);
            // });
            initializeDB(jsonObj.database, headers, primaryDbKey);

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
            let headers = Object.keys(XL_row_object[0]);
            console.log(headers);
            loadPrimary(XL_row_object, headers);
        };

        reader.onerror = function(ex) {
            console.log(ex);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });

    $('#importSqlite').change(function(e) {
        // https://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5
        var reader = new FileReader();
        reader.onload = function(e) {
            let sqlite = e.target.result;

            config = {
                locateFile: filename => `js/${filename}`
            }
            initSqlJs(config).then(function(SQL){
                // Load the db
                initializeDB(null, null, null, sqlite);
                console.log(db);
            });
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
         // headerIndex = {};
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
