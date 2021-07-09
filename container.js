class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // table: [], 
            data:null,
            database:{},
            headers: {'count':{routine:'protected'}, 'rank':{routine:'protected'}},
            headers2: {},
            primarykey:null,
            prevPrimarykey:null,
            filter:'true',
            freezeColIndex:1
        };
        this.sanitizeDB = this.sanitizeDB.bind(this);
        this.ExportHandler = this.ExportHandler.bind(this);
        this.ReorderHeaders = this.ReorderHeaders.bind(this);
        this.CsvPasteHandler = this.CsvPasteHandler.bind(this);
        this.CsvHandler = this.CsvHandler.bind(this);
        this.XlsxHandler = this.XlsxHandler.bind(this);
        this.KeyHandler = this.KeyHandler.bind(this);
        this.handleQuery = this.handleQuery.bind(this);
        this.handleRenameColumn = this.handleRenameColumn.bind(this);
        this.handleAddColumn = this.handleAddColumn.bind(this);
        this.handleRecalculateColumn = this.handleRecalculateColumn.bind(this);
        this.recalculateDatabase = this.recalculateDatabase.bind(this);
        this.fileInput = React.createRef(); 
        this.xlsxInput = React.createRef();    
        this.table = React.createRef();
        this.nav = React.createRef();
        this.renamecolumn = React.createRef();
        this.recalculatecolumn = React.createRef();
    }

    sanitizeDB(plaintextDB, headers) {
        
        let prelimDB = Papa.parse(plaintextDB, {
            header: true,
            dynamicTyping: false,
        });
        
        let headerArray = prelimDB.meta['fields'];
        let delimiter = prelimDB.meta['delimiter'];
        
        let sanitizedHeaders = [];
        let blankIndex = 0;
        headerArray.forEach(function(field) {
            if (field.trim() != '') {
                sanitizedHeaders.push('"' + sanitize(field) + '"');
            } else {
                while ( ((('"BLANK' + blankIndex + '"') in headers) 
                || sanitizedHeaders.includes('"BLANK' + + blankIndex + '"'))
                && blankIndex < 1000) {
                    blankIndex++
                }
                sanitizedHeaders.push('"BLANK' + blankIndex++ + '"');
            }
        });
        // let delimiter = plaintextDB.split('\n')[0].match(/\t/g) ? "\t" : ",";
        let sanitizedDB = sanitizedHeaders.join(delimiter) + "\n" 
            + plaintextDB.split('\n').slice(1).join("\n");

        console.log(sanitizedDB);
        return Papa.parse(sanitizedDB, {
            header: true,
            dynamicTyping: false,
        });
    }

    ReorderHeaders() {
        let $boxes = $('#columns_menu input');
        let oldHeaders = {...this.state.headers};
        let headers = {};
        let freezeColIndex = $(".sortable a").index($('#freezeCol')[0]) - 1;
        $boxes.each(function() {
            headers[$(this).attr('data-field')] = oldHeaders[$(this).attr('data-field')];
        });
        this.setState({
            headers: headers,
            freezeColIndex:freezeColIndex
        }, function(){
            this.table.current.setState({headers:headers});
        });
    }
    
    ExportHandler() {
        // $('th .triangle').html('');
        
        let $table = $('#mainTable');
        var csv = $table.table2csv('return', {
            "separator": ",",
            "newline": "\n",
            "quoteFields": true,
            "excludeColumns": ".col_count, .col_rank",
            "excludeRows": "",
            "trimContent": true,
            "filename": "table.csv"
        });

        // csv = csv.replace(/RenameGroup byStatistics/g, '');

        // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
        var universalBOM = "\uFEFF";
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/csv;charset=UTF-8,'
        + encodeURIComponent(universalBOM + csv));
        a.setAttribute('download', 'untitled.csv');
        a.click()
        // window.location.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(universalBOM + csv);
        // $('th .triangle').html('&#x25ba;');
    }
    
    CsvPasteHandler(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const csv = form.elements["csv"].value;
        
        let results = this.sanitizeDB(csv, this.state.headers);
        console.log(results);
        let headers = {...this.state.headers};
        let headers2 = {};
        
        results.meta['fields'].forEach(field => {
            if (!(field in headers)) {
                headers[field] = {'routine':'protected'};
            }
            headers2[field] = {'routine':'protected'};
        });
        
        this.setState({
            data: results.data,
            headers:headers,
            headers2:headers2
        });
        console.log(this.state);
        $('select.key').show();
        $('select.key').prop('disabled', false);
    }

    CsvHandler(e, fileinput) {
        e.preventDefault();        
        console.log(
        `Selected file - ${fileinput.current.files[0].name}`
        );
        const reader = new FileReader();
        const scope = this;
        reader.onload = function(e) {
            let plaintextDB = e.target.result;            
            
            let results = scope.sanitizeDB(plaintextDB, scope.state.headers);
                        
            let headers = {...scope.state.headers};
            let headers2 = {};
            
            results.meta['fields'].forEach(field => {
                if (!(field in headers)) {
                    headers[field] = {'routine':'protected'};
                }
                headers2[field] = {'routine':'protected'};
            });
            
            scope.setState({
                data: results.data,
                headers:headers,
                headers2:headers2
            });
            console.log(scope.state);
            $('select.key').show();
            $('select.key').prop('disabled', false);
        }
        reader.readAsText(fileinput.current.files[0]);
    }
    
    XlsxHandler(e, fileinput) {
        e.preventDefault();        
        console.log(
        `Selected file - ${fileinput.current.files[0].name}`
        );
        const reader = new FileReader();
        const scope = this;
        reader.onload = function(e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, {
                type: 'binary'
            });
            const sheetName = workbook.SheetNames[0];
            const XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            let headers2 = {};
            Object.keys(XL_row_object[0]).forEach(field => {
                headers2[field] = {routine:'protected'};
            });
            
            let headers = {...scope.state.headers};
            Object.keys(headers2).forEach(field => {
                if (!(field in headers)) {
                    headers[field] = {routine:'protected'};
                }
            });
            
            scope.setState({
                data: XL_row_object,
                headers:headers,
                headers2:headers2
            });
            console.log(scope.state);
            $('select.key').show();
            $('select.key').prop('disabled', false);
        }
        reader.readAsBinaryString(e.target.files[0]);
    }
    
    KeyHandler(e, keyName) {
        console.log('key selected');
        this.table.current.setState({groups:[]});
        // console.log(e.target);
        let {name, value} = e.target;
        const primarykey = value;        
        const scope = this;
        
        console.log(primarykey);
                
        let keyval;
        let database = {...this.state.database};
        let headers = {}
        if (primarykey == 'ordinal_index') {
            headers = {'count':{routine:'protected'}, 'rank':{routine:'protected'}};
            headers['ordinal_index'] = {routine:'protected'};
            for (let key in this.state.headers) {
                headers[key] = {...this.state.headers[key]};
            }
        } else {
            headers = {...this.state.headers};
        }
        let row;        
        for (let i = 0; i < this.state.data.length; i++) {
            row = this.state.data[i];
            if (primarykey != 'ordinal_index') {
                keyval = row[primarykey];
                if (keyval == null || typeof keyval == 'undefined' || keyval == '') {
                    keyval = 'undefined';
                }
                if (!(keyval in database)) {
                    database[keyval] = {};
                }
            } else {
                keyval = i;
                database[keyval] = { ordinal_index : i };
            }
            Object.keys(this.state.headers).map(field => {
                if (row[field] != '' && row[field] != null && typeof row[field] != 'undefined' ) {
                    database[keyval][field] = row[field];
                } else if (database[keyval][field] == null || typeof database[keyval][field] == 'undefined') {
                    database[keyval][field] = '';
                }                
            });            
        }
        
        this.recalculateDatabase(database, headers, primarykey);
        $('.nav-item.calculated_column').show(); 
        $('#key_div select').prop('disabled', true);
    }    
    
    handleRenameColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const oldField = form.elements["old_col_name"].value;
        let field = form.elements["col_name"].value;
        let headers = {...this.state.headers};
        
        if (field in headers) {
            alert('FIELD NAME EXISTS');
            return 0;
        }
        
        let blankIndex = 0;
        if (field.trim() == '') {
            while ( (('BLANK' + blankIndex) in headers)
            && blankIndex < 1000) {
                blankIndex++;
            }
            field = 'BLANK' + blankIndex++;
        }
        
        headers[field] = {...headers[oldField]};        
        let database = {...this.state.database};
        Object.keys(database).map(key => {
            database[key][field] = database[key][oldField];
            delete database[key][oldField];
        });
        delete headers[oldField];
        $('#rename_column').modal('toggle'); 
        this.setState({
            database:database, 
            headers:headers
        }, function(){this.table.current.resetGroups(database, headers, this.state.primarykey);});
    }
    
    recalculateDatabase(database, headers, primarykey = this.state.primarykey) {
        let routineStr = '';
        let value;
        let routineFunc;        
        let item;
        
        const prevPrimarykey = this.state.prevPrimarykey;
        
        if(prevPrimarykey != null) {
            Object.keys(database).map(keyval => {
                if (database[keyval][primarykey] == '' 
                || database[keyval][primarykey] == null 
                || database[keyval][primarykey] == 'undefined') {
                    database[keyval][primarykey] = database[keyval][prevPrimarykey];
                }
            });
        }
        
        for (let field in headers) {
            if (headers[field].routine != 'protected') {
                Object.keys(database).map((key, index) => {
                    item = database[key];
                    routineStr = headers[field].routine.replace(/\(@([^\)]+)\)/g, 'item["$1"]');                    
                    // console.log(routineStr);
                    routineFunc = new Function('item', 'index',  routineStr);
                    // console.log(routineFunc(item));
                    try {
                        value = routineFunc(item, index).toString();
                        database[key][field] = value;
                    } catch (error) {
                        database[key][field] = 'undefined';
                    }
                });
            }
        };
        this.setState({
            primarykey:primarykey,
            prevPrimarykey:primarykey,
            database:database,
            headers:headers,
            headers2:{}
        },  function(){this.table.current.resetGroups(database, headers, primarykey);});
    }
    
    handleAddColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const routine = form.elements["column_routine"].value;
        let field = form.elements["calc_col_name"].value;
        let routineStr = '';
        let value;
        let routineFunc;
        if (field in this.state.headers) {
            alert('FIELD NAME EXISTS');
            return 0;
        } else {
            let headers = {...this.state.headers};
            let blankIndex = 0;
            if (field.trim() == '') {
                while ( (('BLANK' + blankIndex) in headers)
                && blankIndex < 1000) {
                    blankIndex++;
                }
                field = 'BLANK' + blankIndex++;
            }
            headers[field] = {'routine':routine}
            $('#column_bin').modal('toggle'); 
            this.recalculateDatabase({...this.state.database}, headers);
        }
    }
    
    handleRecalculateColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const routine = form.elements["column_routine"].value;
        const field = form.elements["calc_col_name"].value;
        
        let headers = {...this.state.headers};
        headers[field] = {'routine':routine}
        $('#recalculate_column_bin').modal('toggle'); 
        this.recalculateDatabase({...this.state.database}, headers);
        
    }

    handleQuery(e, queryItems) {
        e.preventDefault();
        console.log(e);
        console.log(queryItems);
        let filter = 'true';
        queryItems.map(query => {            
            if (query.field == 'Show All') { 
                filter = 'true';
            } else {
                filter += ' ' + query.conjunction +  ' (item["' + query.field + '"] ' + query.condition + ')';
            }
            console.log(filter);            
        });
        $('#query_modal').modal('toggle');
        console.log(filter);
        this.setState({
            filter:filter,
        }, function(){
            $('#query_modal').modal('toggle');
            this.table.current.resetGroups(this.state.database, this.state.headers, this.state.primarykey);
        }); 
    }

    // handleQuery(e, queryItems) {
    //     e.preventDefault();
    //     let filter;
    //     queryItems.map(item => {            
    //         if (item.field == 'Show All') { 
    //             filter = 'true';
    //         } else {
    //             filter = 'item["' + item.field + '"]' + ' ' + item.condition;
    //         }
    //         console.log(filter);            
    //     });
    //     // $('.dropdown-menu.query').dropdown('toggle');                        
    //     this.setState({
    //         filter:filter,
    //     }, function(){$('#query_modal').modal('toggle');this.table.current.resetGroups(this.state.database, this.state.headers, this.state.primarykey);}); 
    // }
    
    handleScroll() {
        const height = this.offsetHeight;
        const scrollTop = this.scrollTop;
        // console.log(height);
        // console.log(scrollTop);
        if (scrollTop / height > 0.75) {
            // console.log(scrollTop);
        }
    }
    
    componentDidUpdate() {
        $('#table-container').scroll(this.handleScroll);
    }

    render() {
        return (
        <div className="inner-container">
            <Nav ref={this.nav} fileinput={this.fileInput} xlsxinput={this.xlsxInput} csvhandler={this.CsvHandler} xlsxhandler={this.XlsxHandler} csvpastehandler={this.CsvPasteHandler} keyhandler={this.KeyHandler} headers={this.state.headers} freezecolindex={this.state.freezeColIndex} headers2={this.state.headers2} filter={this.state.filter} handlequery={this.handleQuery} handleaddcolumn={this.handleAddColumn} handlerenamecolumn={this.handleRenameColumn} reorderheaders={this.ReorderHeaders} exporthandler={this.ExportHandler}/>
            <div id="outer-table-container">
                <div id="table-container">
                    <Table ref={this.table} renamecolumn={this.renamecolumn} recalculatecolumn={this.recalculatecolumn} filter={this.state.filter} />
                </div>
            </div>
            <RenameColumnModal ref={this.renamecolumn} handlerenamecolumn={this.handleRenameColumn} /> 
            <RecalculateColumnModal ref={this.recalculatecolumn} headers={this.state.headers} handlerecalculatecolumn={this.handleRecalculateColumn} />
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))
