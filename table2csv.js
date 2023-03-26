// (function ($) {
//     "use strict";
//     const optionsDefaults = {
//         /* action='download' options */
//         filename: "table.csv",
//
//         /* action='output' options */
//         appendTo: "body",
//
//         /* general options */
//         separator: ",",
//         newline: "\n",
//         quoteFields: true,
//         trimContent: true,
//         excludeColumns: "",
//         excludeRows: ""
//     };
//
//     let options = {};
//
//     function quote(text) {
//         return "\"" + text.replace(/"/g, "\"\"") + "\"";
//     }
//
//     // taken from http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
//     function download(filename, text) {
//         const element = document.createElement("a");
//         element.setAttribute("href", "data:text/csv;charset=utf-8,\ufeff" + encodeURIComponent(text));
//         element.setAttribute("download", filename);
//
//         element.style.display = "none";
//         document.body.appendChild(element);
//
//         element.click();
//
//         document.body.removeChild(element);
//     }
//
//     function convert(table) {
//         let output = "";
//
//         const rows = table.find("tr").not(options.excludeRows);
//
//         const numCols = rows.first().find("td,th").filter(":visible").not(options.excludeColumns).length;
//
//         rows.each(function (ignore, elem) {
//             $(elem).find("td,th").filter(":visible").not(options.excludeColumns)
//                 .each(function (i, col) {
//                     const column = $(col).contents().eq(0);
//
//                     // Strip whitespaces
//                     const content = options.trimContent
//                         ? $.trim(column.text())
//                         : column.text();
//
//                     output += options.quoteFields
//                         ? quote(content)
//                         : content;
//                     if (i !== numCols - 1) {
//                         output += options.separator;
//                     } else {
//                         output += options.newline;
//                     }
//                 });
//         });
//
//         return output;
//     }
//
//     $.fn.table2csv = function (action, opt) {
//         if (typeof action === "object") {
//             opt = action;
//             action = "download";
//         } else if (action === undefined) {
//             action = "download";
//         }
//
//         // type checking
//         if (typeof action !== "string") {
//             throw new Error("\"action\" argument must be a string");
//         }
//         if (opt !== undefined && typeof opt !== "object") {
//             throw new Error("\"options\" argument must be an object");
//         }
//
//         options = $.extend({}, optionsDefaults, opt);
//
//         const table = this.filter("table"); // TODO use $.each
//
//         if (table.length <= 0) {
//             throw new Error("table2csv must be called on a <table> element");
//         }
//
//         if (table.length > 1) {
//             throw new Error("converting multiple table elements at once is not supported yet");
//         }
//
//         let csv = convert(table);
//
//         switch (action) {
//         case "download":
//             download(options.filename, csv);
//             break;
//         case "output":
//             $(options.appendTo).append($("<pre>").text(csv));
//             break;
//         case "return":
//             return csv;
//         default:
//             throw new Error("\"action\" argument must be one of the supported action strings");
//         }
//
//         return this;
//     };
//
// }(jQuery));

const optionsDefaults = {
    /* action='download' options */
    filename: "untitled.csv",

    /* action='output' options */
    appendTo: "body",

    /* general options */
    separator: ",",
    newline: "\n",
    quoteFields: true,
    trimContent: true,
    excludeColumns: "",
    excludeRows: ""
};

let options = {};

function quote(text) {
    return "\"" + text.replace(/"/g, "\"\"") + "\"";
}

// taken from http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
function download(filename, text) {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8,\ufeff" + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function convert(options, table) {
    let output = "";
    console.log(options);
    let trQuery = options.excludeRows != '' ? `tr:not(${options.excludeRows}` : "tr";

    console.log(trQuery);
    const rows = Array.from(table.querySelectorAll(trQuery));

    let tdQuery = options.excludeColumns != '' ? `td:not(${options.excludeColumns}), th:not(${options.excludeColumns})` : "td, th";

    console.log(tdQuery);

    const numCols = Array.from(rows[0].querySelectorAll(tdQuery))
        .filter(function(col) {
            return window.getComputedStyle(col).display !== 'none';
        }).length;

    rows.forEach(function(row) {
        Array.from(row.querySelectorAll(tdQuery))
            .filter(function(col) {
                return window.getComputedStyle(col).display !== 'none';
            }).forEach(function(col, i) {
                const column = col.childNodes[0];

                // Strip whitespaces
                const content = options.trimContent
                    ? column.textContent.trim()
                    : column.textContent;

                output += options.quoteFields
                    ? quote(content)
                    : content;
                if (i !== numCols - 1) {
                    output += options.separator;
                } else {
                    output += options.newline;
                }
            });
    });

    output = output.replace(/RenameGroup byStatistics/g, '');
    return output;
}

function table2csv(action, opt, table) {
    if (typeof action === "object") {
        opt = action;
        action = "download";
    } else if (action === undefined) {
        action = "download";
    }

    // type checking
    if (typeof action !== "string") {
        throw new Error("\"action\" argument must be a string");
    }
    if (opt !== undefined && typeof opt !== "object") {
        throw new Error("\"options\" argument must be an object");
    }

    const options = Object.assign({}, optionsDefaults, opt);

    // const table = document.querySelector(this); // TODO use [].forEach

    if (!table || table.tagName.toLowerCase() !== "table") {
        throw new Error("table2csv must be called on a <table> element");
    }

    const csv = convert(options, table);

    switch (action) {
        case "download":
            download(options.filename, csv);
            break;
        case "output":
            const pre = document.createElement("pre");
            pre.textContent = csv;
            document.querySelector(options.appendTo).appendChild(pre);
            break;
        case "return":
            return csv;
        default:
            throw new Error("\"action\" argument must be one of the supported action strings");
    }

    // return this;
}
