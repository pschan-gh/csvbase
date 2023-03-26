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
    let tableWidth = 0;
    // let widths;
    // Object.keys(headers).map(field => {
    //     widths = [];
    //     $("td[data-field='" + field + "']").each(function() {
    //         widths.push($(this).text().length);
    //     });
    //     $("th[data-field='" + field + "']").each(function() {
    //         widths.push($(this).find('a.header').text().length);
    //     });
    //     colWidths[field] = Math.min(400, Math.max(...widths)*10) + 20;
    // });
    // return colWidths;
    //
    Object.keys(headers).map(field => {
        tableWidth += 400;
        // $('th[data-field="' + field + '"]').each(function() {
        //     $(this).css('width', 400);
        // });
        // $('td[data-field="' + field + '"]').each(function() {
        //     $(this).css('width', 400);
        // });
        // Select th elements with data-field attribute equal to the given field value and set their width to 400px
        document.querySelectorAll(`th[data-field="${field}"]`).forEach(th => {
            th.style.width = '400px';
        });

        // Select td elements with data-field attribute equal to the given field value and set their width to 400px
        document.querySelectorAll(`td[data-field="${field}"]`).forEach(td => {
            td.style.width = '400px';
        });

    });

    // $('table').css('width', tableWidth + 20);
    document.querySelectorAll('table').forEach(function(tableElement) {
        tableElement.style.width = (tableWidth + 20) + 'px';
    });

    let width;
    let currWidth;
    Object.keys(headers).map(field => {
        width = 0;
        // $("td[data-field='" + field + "']").each(function() {
        //     if ($(this).find('span, div').length) {
        //         currWidth = $(this).find('span, div')[0].offsetWidth;
        //         width = currWidth > width ? currWidth : width;
        //     }
        // });
        // if ($("th[data-field='" + field + "'] a").length) {
        //     currWidth = $("th[data-field='" + field + "'] a")[0].offsetWidth;
        //     width = currWidth/3 > width ? currWidth/3 : width;
        // }
        document.querySelectorAll(`td[data-field="${field}"]`).forEach(function(tdElement) {
            let elements = Array.from(tdElement.querySelectorAll('span, div'));
            if (elements.length > 0) {
                let currWidth = elements[0].offsetWidth;
                width = currWidth > width ? currWidth : width;
            }
        });

        let thLink = document.querySelector(`th[data-field="${field}"] a`);
        if (thLink) {
            let currWidth = thLink.offsetWidth;
            width = currWidth / 3 > width ? currWidth / 3 : width;
        }

        colWidths[field] = field.match(/count|rank/i) ? Math.max(30, width) + 20 : Math.min(400, width) + 40;
    });
    console.log(colWidths);
    return colWidths;
}

function updateTableWidth(colWidths) {
    let tableWidth = 0;
    // $('.field_checkbox:checked').each(function() {
    //     tableWidth += colWidths[$(this).attr('data-field')];
    // });
    //
    // $('table').css('width', tableWidth + 20);
    // $('th').each(function() {
    //     $(this).css('width', colWidths[$(this).attr('data-field')]);
    // });
    // $('td').each(function() {
    //     $(this).css('width', colWidths[$(this).attr('data-field')]);
    // });
    // $('tbody').css('margin-top', parseInt($('th').first().css('height')));

    document.querySelectorAll('.field_checkbox:checked').forEach(checkbox =>  {
        tableWidth += colWidths[ checkbox.dataset.field ];
    });

    document.querySelectorAll('table').forEach( tableElement => {
        tableElement.style.width = (tableWidth + 20) + 'px';
    });

    document.querySelectorAll('th').forEach( thElement => {
        thElement.style.width = colWidths[ thElement.dataset.field ] + 'px';
    });

    document.querySelectorAll('td').forEach( tdElement => {
        tdElement.style.width = colWidths[ tdElement.dataset.field ] + 'px';
    });

}

function freezeColumns(colWidths) {

    // $('thead th').css('position', '');
    // $('thead th').css('left', '');
    // $('thead th').css('z-index', '');
    // $('thead th').css('background-color', '');
    //
    // $('tr td').css('position', '');
    // $('tr td').css('left', '');
    // $('tr td').css('z-index', '');
    // $('tr td').css('background-color', '');
    //
    // let colIndex = $(".sortable a").index($('#freezeCol')[0]);
    // let $frozen = $(".sortable a").slice(0, colIndex);
    // let offset = 0;
    // let i;
    // for (i = 0; i < colIndex; i++) {
    //     console.log($frozen.eq(i));
    //     $('thead th').eq(i).css('position', 'sticky');
    //     $('thead th').eq(i).css('left', offset);
    //     $('thead th').eq(i).css('z-index', 2);
    //     // $('thead th').eq(i).css('background-color', '#ddd');
    //
    //     $('tr td:nth-child(' + (i + 1) + ')').css('position', 'sticky');
    //     $('tr td:nth-child(' + (i + 1) + ')').css('left', offset);
    //     $('tr td:nth-child(' + (i + 1) + ')').css('z-index', 1);
    //     $('tr td:nth-child(' + (i + 1) + ')').css('background-color', '#eee');
    //     offset += colWidths[$frozen.eq(i).find('input').attr('data-field')];
    // }

    // Clear styles
    document.querySelectorAll('thead th, tr td').forEach(element => {
        element.style.position = '';
        element.style.left = '';
        element.style.zIndex = '';
        element.style.backgroundColor = '';
    });

    // Freeze columns
    const freezeCol = document.querySelector('#freezeCol');
    const sortableLinks = document.querySelectorAll('.sortable a');

    if (freezeCol && sortableLinks) {
        const colIndex = Array.from(sortableLinks).indexOf(freezeCol);
        const frozen = Array.from(sortableLinks).slice(0, colIndex);
        let offset = 0;
        let th, td;
        const trElements = document.querySelectorAll('#mainTable tr');
        for (let i = 0; i < colIndex; i++) {
            // console.log(frozen[i]);
            th = document.querySelectorAll('thead th')[i];
            if (th) {
                th.style.position = 'sticky';
                th.style.left = offset + 'px';
                th.style.zIndex = '2';
            }

            trElements.forEach( tr => {
                td = tr.querySelector(`td:nth-child(${i + 1})`);
                if (td) {
                    td.style.position = 'sticky';
                    td.style.left = offset + 'px';
                    td.style.zIndex = '1';
                    td.style.backgroundColor = '#eee';
                }
            });
            offset += colWidths[frozen[i].querySelector('input').dataset.field];
        }
    }
}
