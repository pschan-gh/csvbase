var hwsets = [];
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
var maxCols = 50;

function report () {
};

function initializeDB(plaintextDB, key) {
    // alert('EMPTY TABLE');
    $('#mainTable').find('tbody').html('');
    // $('#header_row').html('');

    var row;
    var rows = [];
    var field;
    var dbKey = headerIndex[key];

    report('INIT primaryKey: ' + key);
    report('INIT primaryDbKey: ' + dbKey);

    var dbName = 'csvDB' + plaintextDB.hashCode();
    report('DB NAME: ' + dbName);

    indexedDB.deleteDatabase(dbName);
    // key.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
    // key = sanitize(key);

    schemaBuilder = lf.schema.create(dbName, 1);

    var tableBuilder = schemaBuilder.createTable('LogTable' + tableVersion);

    report(headerNames);
    report(headerIndex);

    // for (j = 0; j < sanitizedHeaders.length; j++) {
    for (var j = 0; j < maxCols; j++) {
        // field = sanitizedHeaders[j];
        // report('ADD HEADER  ' + field);
        tableBuilder = tableBuilder.addColumn('COL' + j.toString(), lf.Type.STRING);
        if (dbKey == 'COL' + j.toString()) {
            report('DBKEY MATCH: ' + dbKey);
            tableBuilder = tableBuilder.addPrimaryKey([dbKey]);
        }
    }

    report('HEADERINDEX');
    report(headerIndex);

    sortField = key;
    groupField = key;
    primaryKey = key;
    primaryDbKey = dbKey;

    schemaBuilder.connect().then(function(db) {
        report('CONNECTED');
        var row;
        var rows = [];
        var logTable = db.getSchema().table('LogTable' + tableVersion);
        console.log(logTable);

        $('#exportJSON').show();
        $('#exportJSON').on('click', function(){
            db.export().then(function(data) {
                // https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
                var dlAnchorElem = document.getElementById('downloadJSON');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", "db.json");
                dlAnchorElem.click();
            });
        });

        $('#messages').html('<strong>Database Loaded.</strong>');
        $('#hover_msg').hide();

        // var field = headerNames[0];
        // report('FIELD IS: ' + field);

        baseQuery = "select().from(table)";
        $('#query').val(baseQuery);

        $('#messages').html('<strong>Database Loaded.</strong>');
        $('#hover_msg').hide();

        $('#query_submit').on('click', function() {
            baseQuery = $('#query').val();
            queryHWSet(db, logTable, baseQuery, primaryKey);
            $('.dropdown-toggle.query').dropdown('toggle');
        });

        $('#calc_col_submit').on('click', function() {
            let field = $('#calc_col_name').val();
            let routine = $('#calc_col_routine').val();
            let sanitizedField = sanitize(field);
            sanitizedField = sanitizedField == '' ? 'BLANK' + j.toString() : sanitizedField;
            if (sanitizedHeaders.indexOf(sanitizedField) <= -1) {
                if (field != '') {
                    headerNames.push(field);
                } else {
                    headerNames.push(sanitizedField);
                }
                headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
                sanitizedHeaders.push(sanitizedField);
            }
            dataIndex[sanitizedField] = field;
            calculateColumn(db, logTable, sanitizedField, routine);
            $('.dropdown-toggle.query').dropdown('toggle');
        });

        var fieldToLf = {};
        sanitizedHeaders.map(function(field) {
            fieldToLf[field] = 'table.' + field;
            if (!(clickedArray.hasOwnProperty(field))) {
                clickedArray[field] = 0;
            }
        });
        clickedArray['count'] = 0;
        // fieldToLf['time'] = 'table.unixtime';

        updateButtons(db, logTable);
        $('#secondary-file-input').off();
        $('#secondary-file-input').on('change', function(e) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                updateTable(db, logTable, contents, key, false);
                $('#second_key_li').show();
                $('a.pastebin').addClass('disabled');
                $('a.query').addClass('disabled');
            }
            reader.readAsText(e.target.files[0]);
        });
        $('#fields_submit').off();
        $('#fields_submit').on('click', function() {
            updateTable(db, logTable, $('#fields').val(), key, false);
            $('#second_key_li').show();
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
            $('#pastebin').modal('hide')
        });

        updateTable(db, logTable, plaintextDB, primaryKey, true);
    });

}

function resetTable() {
    $('#mainTable > tbody > tr').remove();
    $('#header_row').html('<th id="th_count" clicked="0" field="count" class="col_count header"><a href="#">#</a><div class="triangle">&#x25BA;</div></th>');
    var hfield;
    report(sanitizedHeaders);
    sanitizedHeaders.map(function(sfield) {
        hfield = sfield;
        var $th = $("<th>", {"id" : 'th_' + hfield, 'clicked': '0', 'field': hfield, "class":'col_' + hfield});
        var html = '<a id="a_' + hfield + '" href="#" class="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + hfield.replace(/_/, ' ') + '</a>';
        html += '<div class="dropdown-menu" aria-labelledby="a_' + hfield + '"><a class="dropdown-item group_by" field="' + hfield + '" href="#">Group by</a><a class="dropdown-item fields statistics" field="' + hfield + '" href="#" >Statistics</a><a class="dropdown-item fields hide" field="' + hfield + '" href="#">Hide</a></div>';

        html += "<div class='triangle'>&#x25BA;</div>";
        $th.html(html);
        $th.appendTo($('#header_row'));
    });

    $('th').attr('clicked', 0);

    // colWidths['count'] = 54;
    // colWidths['count'] = 3;
}

function sanitize(str) {
    var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
    str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
    return str;
}

function updateTable(db, table, plaintextDB, key, isPrimary) {

    var data = [];
    var headers = [];

    var results = Papa.parse(plaintextDB, {
        header: true,
        dynamicTyping: false,
    });
    // complete: function(results) {
    report(results);
    data = results.data;
    report(data);

    if (data.length < 1) {
        return;
    }

    headers = results.meta['fields'];
    report(headers);

    sanitizedSecondaryHeaders = [];
    var sanitizedField;
    for (var j = 0; j < headers.length; j++) {
        var field = headers[j];
        sanitizedField = sanitize(field);
        sanitizedField = sanitizedField == '' ? 'BLANK' + j.toString() : sanitizedField;
        sanitizedSecondaryHeaders.push(sanitizedField);
        if (sanitizedHeaders.indexOf(sanitizedField) <= -1) {
            if (field != '') {
                headerNames.push(field);
            } else {
                headerNames.push(sanitizedField);
            }
            headerIndex[sanitizedField] = 'COL' + sanitizedHeaders.length;
            sanitizedHeaders.push(sanitizedField);
        }
        dataIndex[sanitizedField] = field;
    }

    report(headerIndex);
    report(dataIndex);

    $("#second_key_sel")[0].innerHTML = '';
    updateSecondaryKeys();

    $('#second_key_sel').off();
    // report('SECONDARY KEY SELECTED');

    report($('#key_sel').val());

    primaryDbKey = headerIndex[key];
    primaryKey = key;
    sortField = key;
    groupField = key;
    report(primaryKey);
    report(primaryDbKey);

    if (!isPrimary) {
        $('#second_key_sel').on('change', function() {
            resetTable();
            // var secondaryKey = $('#second_key_sel').val().replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "");
            var secondaryKey = sanitize($('#second_key_sel').val());
            report(sanitizedHeaders);
            report(secondaryKey);
            report(headerIndex);
            report(dataIndex);
            $('#messages').text('Running Query');
            $('#query_msg').show();
            window.setTimeout(function(){
                updateRows(data, db, table, headerIndex[secondaryKey]);
            }, 0);
            $('a.pastebin').removeClass('disabled');
            $('a.query').removeClass('disabled');
        });
    } else {
        resetTable();
        report(primaryDbKey);
        $('#messages').text('Running Query');
        $('#query_msg').show()
        window.setTimeout(function(){
            updateRows(data, db, table, primaryDbKey);
        },0);
    }

}

function updateRows(data, db, table, secondaryDbKey) {
    var str, row;
    var newRows = [];
    var sanitizedField;

    report('UPDATEROWS');
    report(secondaryDbKey);
    report(headerIndex);
    report(dataIndex);

    var sfield, field;
    for (var j = 0; j < sanitizedHeaders.length; j++) {
        sfield = sanitizedHeaders[j];
    }

    for(var i = 0; i < data.length; i++) {
        var rowObj = {};
        headerNames.map(function(field) {
            sanitizedField = sanitize(field);
            if (sanitizedField in headerIndex) {
                if (dataIndex[sanitizedField] in data[i]) {
                    rowObj[headerIndex[sanitizedField]] = data[i][dataIndex[sanitizedField]];
                } else {
                    rowObj[headerIndex[sanitizedField]] = " ";
                }
            }
        });
        report(rowObj);

        var secondaryKeyValue = rowObj[secondaryDbKey];
        if (secondaryKeyValue == null || typeof secondaryKeyValue == typeof undefined) {
            continue;
        }

        // insert new database entry
        if (primaryDbKeyValues.indexOf(secondaryKeyValue) <= -1 && secondaryKeyValue.trim() != '') {
            report('NEW PRIMARY KEY VALUE: ' + secondaryKeyValue);
            var datum = {};
            for (var j = 0; j < sanitizedHeaders.length; j++) {
                sfield = sanitizedHeaders[j];
                if (sfield in headerIndex) {
                    var field = headerIndex[sfield];
                    if (typeof rowObj[field] !== "undefined" && rowObj[field] !== null) {
                        datum[field] = rowObj[field];
                    } else {
                        datum[field] = " ";
                    }
                }
            }
            for (var j = 0; j < maxCols; j++) {
                var key = 'COL' + j.toString();
                if (!(key in datum)) {
                    datum[key] = " ";
                }
            }
            // report(primaryDbKey);
            datum[primaryDbKey] = secondaryKeyValue;
            report(datum);
            newRows.push(table.createRow(datum));
            primaryDbKeyValues.push(secondaryKeyValue);
        } else { // udpate existing database entry
            sanitizedHeaders.map(function(sfield) {
                var field = headerIndex[sfield];
                if (field != primaryDbKey && sanitizedSecondaryHeaders.indexOf(sfield) > -1) {
                    var value = rowObj[field];
                    if (value != null && typeof value != typeof undefined) {
                        db.update(table).
                        set(table[field], value).
                        where(table[primaryDbKey].eq(rowObj[secondaryDbKey])).
                        exec().then(function() {  // Returns a Promise.
                            report('UPDATED: ' + sfield + ' ' + value);
                        });
                    }
                }
            });
        }
    }
    report('NEWROWS INITIATED');
    for (var key in colWidths) {
        if (colWidths.hasOwnProperty(key)) {
            colWidths[key] = colWidths[key] + 2;
        }
    }
    report(colWidths);
    report(newRows);
    report(db);
    db.insertOrReplace().into(table).values(newRows).exec().then(function() {
        report('TABLE UPDATED');
        report(table);
        baseQuery = "select().from(table)";
        $('#query').val(baseQuery);
        report('SECONDARY QUERY');
        queryHWSet(db, table, baseQuery, groupField);
        $(this).val('Select Matching Key...');
    });
}

function calculateColumn(db, table, sfield, routine) {
    let functionStr = 'return db.select().from(table).exec()';
    console.log(functionStr);
    let queryFunc = new Function('db', 'table',  functionStr);

    let routineStr = routine.replace(/@([^\s{}\(\)]+)/g, 'row[headerIndex[sanitize("$1")]]');
    console.log(routineStr);
    var routineFunc = new Function('row',  routineStr);

    queryFunc(db, table).then(function(rows) {
        let field = headerIndex[sfield];
        let value = '';
        let newRows = [];
        rows.forEach(function(rowObj) {
            rowObj[headerIndex[sfield]] = routineFunc(rowObj);
            var datum = {};
            for (var j = 0; j < sanitizedHeaders.length; j++) {
                sfield = sanitizedHeaders[j];
                if (sfield in headerIndex) {
                    var field = headerIndex[sfield];
                    if (typeof rowObj[field] !== "undefined" && rowObj[field] !== null) {
                        datum[field] = rowObj[field];
                    } else {
                        datum[field] = " ";
                    }
                }
            }
            for (var j = 0; j < maxCols; j++) {
                var key = 'COL' + j.toString();
                if (!(key in datum)) {
                    datum[key] = " ";
                }
            }
            newRows.push(table.createRow(datum));
        });
        db.insertOrReplace().into(table).values(newRows).exec().then(function() {
            report('TABLE UPDATED');
            queryHWSet(db, table, baseQuery, primaryKey);
        });
    });
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
    // alert(baseQuery);
    //$('th').find('.triangle').hide();
    $('th').css('background-color', '');
    $('th').css('color', '');
    $('th').find('a').css('color', '');
    $('th').find('div').css('color', '');
    $('td').css('border-left', '');
    $('td').css('border-right', '');
    $('td').css('color', '#eee');


    var logTable = table;
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

    report('FIELD: ' + field);

    report('QUERY: ' + query);
    var queryFunc = new Function('db', 'table',  'return db.' + query + '.exec()');

    return queryFunc(db, logTable).then(function(rows) {
        report(rows);
        // document.getElementById('mainTable').getElementsByTagName('tbody')[0].innerHTML = '';
        rows.forEach(function(row) {
            var tableRow = document.getElementById('mainTable').getElementsByTagName('tbody')[0].insertRow(-1);

            var cell;
            cell = tableRow.insertCell(0);
            $(cell).addClass('col_count');
            $(cell).attr('field', 'count');

            if ((prev_row == null) || (prev_row[dbGroup] != row[dbGroup])) {
                // $(".col_count[index='" + index + "']:not(:first)").html(count + '&#x21b3;');
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
                // $(tableRow).hide();
            }
            $(".col_count[index='" + index + "']:not(:first)").html(count + '<strong style="float:right">&ndash;</strong>');
            $("td.root[index='" + index + "']").html(count);

            $(tableRow).attr('index', index);
            // $(tableRow).attr('unixtime', row['unixtime']);

            $(cell).attr('index', index);
            $(cell).attr('clicked', 0);
            cell.textContent = count ;

            var cell;

            sanitizedHeaders.map(function(hfield) {
                var $td = $("<td>", {'field': hfield, "class":'col_' + hfield});
                $td.text(row[headerIndex[hfield]]);
                $td.appendTo($(tableRow));
            });

            prev_row = row;
            prev_tableRow = tableRow;

        });

        refreshTable(db, table, field);
    });
}

function refreshTable(db, table, field) {
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

    // $('.col_unixtime').hide();

    report('COLCLASS: ' + colClass);
    $('td.' + colClass).css('border-left', '2px solid SteelBlue');
    $('td.' + colClass).css('border-right', '2px solid SteelBlue');

    if (field != 'unixtime') {
        // $('td').css('color', '#ccc');
        $('td.' + colClass).css('color', '');
        $('td.col_count').css('color', '');
    } else {
        $('td').css('color', '');
    }

    $('td.col_count').on('click', function() {
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
        // $("tbody tr[clicked!=1][field!='count']").css('color', '');
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


    $('#mainTable').css('width', 'auto');
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

    $('#mainTable').css('width', tableWidth);
    $('#table-container').css('width', tableWidth + 15);
    $('tbody tr').css('width', tableWidth);
    $('thead tr').css('width', tableWidth);
    $('th, td').each(function() {
        $(this).css('width', colWidths[$(this).attr('field')]);
    });
    $('tbody').css('margin-top', parseInt($('th').first().css('height')));

    report('COLWIDTHS');
    report(colWidths);

    // $('#mainTable').show();

    $('#second_key_sel').off();
    $('#secondary-file-input').off();
    $('#secondary-file-input').on('change', function(e) {
        $('#second_key_li').show();
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            updateTable(db, logTable, contents, primaryKey, false);
        }
        reader.readAsText(e.target.files[0]);
    });

    $('#fields_submit').off();
    $('#fields_submit').on('click', function() {
        updateTable(db, logTable, $('#fields').val(), primaryKey, false);
        $('#second_key_li').show();
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide')
    });

    updateButtons(db, table);

    $('.nav-item.calculated_column').show();
    $('tr.branch').hide();
}

function updateButtons(db, table) {
    var fieldToLf = {};
    sanitizedHeaders.map(function(field) {
        fieldToLf[field] = 'table.' + field;
        if (!(clickedArray.hasOwnProperty(field))) {
            clickedArray[field] = 0;
        }

    });
    // fieldToLf['time'] = 'table.unixtime';

    $("th a").off();


    $("a.group_by[field!='count'][field!='chkbox']").on('click', function() {
        $('th div.triangle').html('&#x25ba;');
        sortField = $(this).closest('th').attr('field');
        groupField = sortField;
        var sort = fieldToLf[sortField];

        var clicked = -1;
        clickedArray[sortField] = clicked;

        report(clickedArray);

        query = baseQuery +  ".orderBy(table." + headerIndex[sortField] + ", lf.Order.DESC)";
        $('#query').val(query);

        queryHWSet(db, table, query, groupField);

    });

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

        if (sortField != groupField && sortField != 'count' && groupField != primaryKey) {
            tbody.find('tr').sort(function(a, b) {
                aContent = $('td[field="' + sortField + '"]', a).html();
                bContent = $('td[field="' + sortField + '"]', b).html();
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

    $('tr').on('click', function() {
        $('td').css('color', '');
        $(this).find('td').css('color', 'red');
    });

    $('td').on('click', function() {
        var query = 'select().from(table).where(lf.op.and(table.' + headerIndex[$(this).attr('field')] + ".eq('" + $(this).text() + "')))";
        $('#query').val(query);

    });

    $('#calculated_column').click(function() {
        $('.field_reference').html('');
        sanitizedHeaders.forEach(function(field) {
            $('.field_reference').append('<button class="field btn btn-outline-info btn-sm">' + field + '</button>');
        });
        $('.field_reference button.field').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('+@' + $(this).text());
            insertAtCursor(document.getElementById('calc_col_routine'), '+' + $(this).text());
        });
    });

}

function statistics(values, field) {
    $('#statistics').modal('toggle');
    $('.modal-title.field').text(field);

    let array = values.map(value => {return isNaN(value) ? 0 : value;});

    $('#statistics').find('.modal-body').find('.stats').html('COUNT: ' + array.length + '<br/>MEDIAN: ' + math.median(array) + '<br/>' + 'MEAN: ' + Math.round(100*math.mean(array))/100 +  '<br/>' + 'Standard Deviation: ' + Math.round(100*math.std(array))/100);

    report('DOMAIN MAX: ' + math.max(array));
    $('#max').val(math.max(array));

    bars(array);
}

function updateKeys() {
    report('UPDATEKEYS');
    report(sanitizedHeaders);
    var o = new Option("option text", "value");
    $(o).html('Select Primary Key...');
    $(o).attr('selected');
    $("#key_sel").append(o);

    $('#columns_menu').html('');
    sanitizedHeaders.map(function(field) {
        var o = new Option("option text", "value");
        $(o).html(field);
        $(o).val(field);
        $("#key_sel").append(o);

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

    });
    var a = document.createElement("a");
    $(a).addClass("dropdown-item");
    $(a).attr('href', "#");
    $(a).html("<input class='field_checkbox' checked type='checkbox' field='count' id='count_checkbox'>&nbsp;<label class='form-check-label' for='count_checkbox'>Count</label>");
    $("#columns_menu").append(a);

    $('.field_checkbox').off();
    $('.field_checkbox').on('change', function() {
        var field = $(this).attr('field');
        if ($(this).is(':checked')) {
            $('th[field="' + field + '"], td[field="' + field + '"]').show();
        } else {
            $('th[field="' + field + '"], td[field="' + field + '"]').hide();
        }

        /*
        $('th, td').each(function() {
        var field = $(this).attr('field');
        if ($(".field_checkbox[field='" + field + "']").is(':checked')) {
        $(this).show();
    } else {
    $(this).hide();
}
});
*/

var tableWidth = 0;
$('th:visible').each(function() {
    tableWidth += colWidths[$(this).attr('field')];
});

report('TABLEWIDTH: ' + tableWidth);

$('#table-container').css('width', tableWidth + 15);
$('#mainTable').css('width', tableWidth);
$('#mainTable > thead > tr').css('width', tableWidth);

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
    report('UPDATEKEYS');
    report(headerNames);
    report(sanitizedSecondaryHeaders);

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

function loadPrimary(plaintextDB) {

    var results = Papa.parse(plaintextDB, {
        header: true,
        dynamicTyping: false,
    });
    // var fields = plaintextDB.split(/\n|\r/)[0];

    var field;
    var sanitizedField;

    // var delimiters = /,|\t/;
    // var headers = fields.split(delimiters);
    var headers = results.meta['fields'];

    headerNames = [];
    sanitizedHeaders = [];
    colWidths = {};
    for (j = 0; j < headers.length; j++) {
        //field = headers[j].replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "");
        field = headers[j].replace(/^\s+|\s+$/g, "");
        field = field == '' ? 'BLANK' + (j + 1) : field;
        headerNames.push(field);
        // sanitizedField = field.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
        sanitizedField = sanitize(field);
        sanitizedHeaders.push(sanitizedField);
        headerTypes[sanitizedField] = lf.Type.STRING;
        headerIndex[sanitizedField] = 'COL' + j.toString();
        dataIndex[sanitizedField] = headers[j];
    }
    report('LOADPRIMARY');
    report(headerIndex);
    report(dataIndex);


    report('HEADER TYPES');
    report(headerTypes);
    $("#key_sel")[0].innerHTML = '';
    $("#second_key_sel")[0].innerHTML = '';
    updateKeys();
    $('#key_div').css('display', 'inline-block');
    $('#columns_toggle').show();
    $('.math').show();

    $('#key_sel').on('change', function() {

        initializeDB(plaintextDB, sanitize($(this).val()));

        $('#secondary-file-input').closest('li').show();
        $('#key_sel').closest('li').find('a').addClass("disabled").attr('aria-disabled', 'true');
        // $('#key_sel').css('color', 'grey');
        $('#export').show();
        $('a.pastebin').removeClass('disabled');
        $('a.query').removeClass('disabled');
    });

    $('#fields').closest('li').hide();
    $('#primary-file-input').closest('li').hide();
    $('#query').closest('li').show();
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
        report(nBin);
        for(let i = 0; i < +nBin; i++) {
            thresholds.push(i*Math.round(100*max/nBin)/100);
        }
        report('THRESHOLDS');
        report(thresholds);

        // set the parameters for the histogram
        var histo = d3.histogram()
        .domain(x.domain())  // then the domain of the graphic
        // .thresholds(x.ticks(nBin)); // then the numbers of bins
        .thresholds(thresholds);

        // And apply this function to data to get the bins
        var bins = histo(data.map(function(d) {return Math.max(+d - 0.5, 0);}));
        report('BINS');
        report(bins);
        report('MAX: ' + d3.max(bins, function(d) { return d.length; }));
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
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

$(function () {
    var $table = $('#mainTable');

    $('#primary-file-input').change(function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            loadPrimary(contents);
        }
        reader.readAsText(e.target.files[0]);
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
    });

    $("#exportCSV").click(function () {
        $('.triangle').html('');

        var csv = $table.table2csv('return', {
            "separator": ",",
            "newline": "\n",
            "quoteFields": true,
            "excludeColumns": ".col_chkbox, .col_count",
            "excludeRows": "",
            "trimContent": true,
            "filename": "table.csv"
        });

        // var csv = $table.table2CSV({
        //     delivery: 'value'
        // });

        csv = csv.replace(/Group byStatisticsHide/g, '');

        window.location.href = 'data:text/csv;charset=UTF-8,'
        + encodeURIComponent(csv);
    });

    $('#fields_submit').on('click', function() {
        loadPrimary($('#fields').val());
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide');
    });

    // $('#fields').keydown(function(event) {
    //     if (event.keyCode === 13) {
    //         event.preventDefault();
    //         $('#fields_submit').click();
    //     }
    // });

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
})
