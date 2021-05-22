function sanitize(str) {
    // var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
    var str = str.replace(/[^a-z0-9_\-]/ig, " ").replace(/\s+/g, ' ');
    // str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
    return str;
}

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

function computeColWidths(headers) {
    let colWidths = {};
    headers.map(field => {
        let widths = [];
        $("td[data-field='" + field + "']").each(function() {
            widths.push(($(this).text().length)*6);
        });
        $("th[data-field='" + field + "'] > a.header").each(function() {
            widths.push(($(this).text().length)*6);
        });
        colWidths[field] = Math.min(400, Math.max(...widths)) + 20;
    });
    return colWidths;
}

function updateTableWidth(colWidths) {
    let tableWidth = 0;
    $('.field_checkbox:checked').each(function() {
        tableWidth += colWidths[$(this).attr('data-field')];
    });
   
    $('#mainTable').css('width', tableWidth + 20);
    // $('#table-container').css('width', tableWidth + 20);
    $('tbody tr').css('width', tableWidth);
    $('thead tr').css('width', tableWidth);
    $('th, td').each(function() {
        $(this).css('width', colWidths[$(this).attr('data-field')]);
    });
    $('tbody').css('margin-top', parseInt($('th').first().css('height')));
}
