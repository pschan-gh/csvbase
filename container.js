class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // table: [], 
            data:null,
            database:{},
            headers: ['count', 'rank'],
            headers2: [],
            primarykey:null,
            filter:'true',
        };
        this.ExportHandler = this.ExportHandler.bind(this);
        this.ReorderHeaders = this.ReorderHeaders.bind(this);
        this.CsvPasteHandler = this.CsvPasteHandler.bind(this);
        this.CsvHandler = this.CsvHandler.bind(this);
        this.KeyHandler = this.KeyHandler.bind(this);
        this.handleQuery = this.handleQuery.bind(this);
        this.handleRenameColumn = this.handleRenameColumn.bind(this);
        this.handleAddColumn = this.handleAddColumn.bind(this);
        this.fileInput = React.createRef();    
        this.fileInput2 = React.createRef();
        this.table = React.createRef();
        this.nav = React.createRef()
    }

    ReorderHeaders() {
        // let menu = document.querySelector('#columns_menu');
        let $boxes = $('#columns_menu input');
        let headers = [];
        $boxes.each(function() {
            headers.push($(this).attr('data-field'));
        });
        this.setState({headers: headers});
    }
    
    ExportHandler() {
        $('th div.triangle').html('');
        
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

        csv = csv.replace(/RenameGroup byStatistics/g, '');

        // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
        var universalBOM = "\uFEFF";
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/csv;charset=UTF-8,'
        + encodeURIComponent(universalBOM + csv));
        a.setAttribute('download', 'untitled.csv');
        a.click()
        // window.location.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(universalBOM + csv);
        $('th div.triangle').html('&#x25ba;');
    }
    
    CsvPasteHandler(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const csv = form.elements["csv"].value;
        
        let results = Papa.parse(csv, {
            header: true,
            dynamicTyping: false,
        });
        console.log(results);
        let headers = this.state.headers.slice();
        results.meta['fields'].forEach(field => {
            if (!headers.includes(field)) {
                headers.push(field);
            }
        });
        
        this.setState({
            data: results.data,
            headers:headers,
            headers2:results.meta['fields']
        });
        console.log(this.state);
        $('select.key').show();
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
            
            let headerRow = plaintextDB.split('\n').shift();
            let headers = Papa.parse(plaintextDB, {
                header: true,
                dynamicTyping: false,
            }).meta['fields'];
            
            let sanitizedHeaders = [];
            let blankIndex = 0;
            headers.forEach(function(field) {
                if (field.trim() != '') {
                    sanitizedHeaders.push('"' + sanitize(field) + '"');
                } else {
                    sanitizedHeaders.push('"BLANK' + blankIndex++ + '"');
                }
            });
            
            let sanitizedDB = sanitizedHeaders.join(',') + "\n" 
            + plaintextDB.split('\n').slice(1).join("\n");
            console.log(sanitizedDB);
            let results = Papa.parse(sanitizedDB, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            headers = scope.state.headers.slice();
            results.meta['fields'].forEach(field => {
                if (!headers.includes(field)) {
                    headers.push(field);
                }
            });
            
            scope.setState({
                data: results.data,
                headers:headers,
                headers2:results.meta['fields']
                // sanitizedheaders: sanitizedHeaders
            });
            console.log(scope.state);
            $('select.key').show();
        }
        reader.readAsText(fileinput.current.files[0]);
    }
    
    KeyHandler(e, keyName) {
        console.log('key selected');
        this.table.current.setState({groups:[]});
        // console.log(e.target);
        let {name, value} = e.target;
        const scope = this;
        console.log(name);
        console.log(value);
        this.setState({[keyName]: value}, function() {
            console.log(this.state);
            let row;
            let primarykey = this.state.primarykey;
            // let secondarykey = this.state.secondarykey == null : primarykey ? this.state.secondarykey;
            console.log(primarykey);
            let keyval;
            let database = {...this.state.database};
            for (let i = 0; i < this.state.data.length; i++) {
                row = this.state.data[i];
                keyval = row[primarykey];
                if (!(keyval in database)) {
                    database[keyval] = {};
                }
                this.state.headers.map(field => {
                    if (row[field] != null && typeof row[field] != 'undefined' ) {
                        database[keyval][field] = row[field];
                    } else if (database[keyval] == null || typeof database[keyval] == 'undefined' ) {
                        database[keyval][field] = '';
                    }
                });
            }
        
            this.setState({
                database:database, 
                headers2:[]
            }, function(){
                this.table.current.GroupHandler(this.table.current.state.groupField);                
                $('.nav-item.calculated_column').show(); 
            });
        });                
    }    
    
    handleRenameColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const oldField = form.elements["old_col_name"].value;
        const field = form.elements["col_name"].value;
        let headers = this.state.headers.slice();
        const index = headers.indexOf(oldField);
        headers[index] = field;
        let database = {...this.state.database};
        Object.keys(database).map(key => {
            database[key][field] = database[key][oldField];
            delete database[key][oldField];
        });
        console.log(database);
        this.setState({
            database:database, 
            headers:headers
        });
    }
    
    handleAddColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const routine = form.elements["column_routine"].value;
        const field = form.elements["calc_col_name"].value;
        if (this.state.headers.includes(field)) {
            alert('FIELD NAME EXISTS');
            return 0;
        } else {
            let database = {...this.state.database};
            Object.keys(database).map(key => {
                let item = database[key];
                let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'item["$1"]');
                // console.log(routineStr);
                let routineFunc = new Function('item',  routineStr);
                let value =  routineFunc(item).toString();
                database[key][field] = value;
                console.log(database[key]);
            });
            let headers = this.state.headers;
            headers.push(field);
            this.setState({
                database:database, 
                headers:headers
            });
        }
    }

    handleQuery(e, queryItems) {
        e.preventDefault();
        queryItems.map(item => {
            let filter;
            if (item.field == 'Show All') { 
                filter = 'true';
            } else {
                filter = 'item["' + item.field + '"]' + ' ' + item.condition;
            }
            console.log(filter);
            this.setState({
                filter:filter,
            }, function(){this.table.current.updateTable();}); 
        });
    }

    render() {
        return (
        <div id="container">
            <Nav ref={this.nav} fileinput={this.fileInput} fileinput2={this.fileInput2} csvhandler={this.CsvHandler} csvpastehandler={this.CsvPasteHandler} keyhandler={this.KeyHandler} headers={this.state.headers} headers2={this.state.headers2} filter={this.state.filter} handlequery={this.handleQuery} handleaddcolumn={this.handleAddColumn} handlerenamecolumn={this.handleRenameColumn} reorderheaders={this.ReorderHeaders} exporthandler={this.ExportHandler}/>
            <div id="outer-table-container">
                <div id="table-container">
                    <Table ref={this.table} database={this.state.database} headers={this.state.headers} filter={this.state.filter} primarykey={this.state.primarykey}/>
                </div>
            </div>            
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))
