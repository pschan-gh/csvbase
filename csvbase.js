function sanitize(str) {
    return str.replace(/[^a-z0-9_\-]/ig, " ").replace(/\s+/g, ' ');
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
    let widths;
    Object.keys(headers).map(field => {
        widths = [];
        $("td[data-field='" + field + "']").each(function() {
            widths.push($(this).text().length);
        });
        $("th[data-field='" + field + "']").each(function() {
            widths.push($(this).find('a.header').text().length);
        });
        colWidths[field] = Math.min(400, Math.max(...widths)*10) + 20;
    });
    return colWidths;
}

function updateTableWidth(colWidths) {
    let tableWidth = 0;
    $('.field_checkbox:checked').each(function() {
        tableWidth += colWidths[$(this).attr('data-field')];
    });
   
    $('#mainTable').css('width', tableWidth + 20);
    $('th').each(function() {
        $(this).css('width', colWidths[$(this).attr('data-field')]);
    });
    $('tbody').css('margin-top', parseInt($('th').first().css('height')));
}

function freezeColumns(colWidths) {
    console.log('freezing columns');
    $('thead th').css('position', '');
    $('thead th').css('left', '');
    $('thead th').css('z-index', '');
    $('thead th').css('background-color', '');
    
    $('tr td').css('position', '');
    $('tr td').css('left', '');
    $('tr td').css('z-index', '');
    $('tr td').css('background-color', '');
    
    let colIndex = $(".sortable a").index($('#freezeCol')[0]);
    let offset = 0;
    let i;
    for (i = 0; i < colIndex; i++) {
        console.log(Object.keys(colWidths)[i]);        
        $('thead th').eq(i).css('position', 'sticky');
        $('thead th').eq(i).css('left', offset);
        $('thead th').eq(i).css('z-index', 2);
        // $('thead th').eq(i).css('background-color', '#ddd');
        
        $('tr td:nth-child(' + (i + 1) + ')').css('position', 'sticky');
        $('tr td:nth-child(' + (i + 1) + ')').css('left', offset);
        $('tr td:nth-child(' + (i + 1) + ')').css('z-index', 1);
        $('tr td:nth-child(' + (i + 1) + ')').css('background-color', '#eee');        
        offset += colWidths[Object.keys(colWidths)[i]];
    }
}
