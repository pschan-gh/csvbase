class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            table: [], 
            data:null,
            database:{},
            headers: ['rank'],
            headers2: [],
            primarykey:null,
            filter:'true',
        };
        this.ReorderHeaders = this.ReorderHeaders.bind(this);
        this.CsvPasteHandler = this.CsvPasteHandler.bind(this);
        this.CsvHandler = this.CsvHandler.bind(this);
        this.KeyHandler = this.KeyHandler.bind(this);
        this.handleQuery = this.handleQuery.bind(this);
        this.handleAddColumn = this.handleAddColumn.bind(this);
        this.fileInput = React.createRef();    
        this.fileInput2 = React.createRef();  
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

    UpdateTable(database, filter) {
        let table = [];
        let datum;
        for (let key in database) {
            datum = {};
            this.state.headers.map(field => {
                if (database[key][field] == null || typeof database[key][field] == 'undefined') {
                    datum[field] = '';
                } else {
                    datum[field] = database[key][field];
                }
            });
            table.push(datum);
        }
        let filterFunc =  new Function('item', 'return ' + filter);
        return table.filter(filterFunc);

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
            let results = Papa.parse(plaintextDB, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            let headers = scope.state.headers.slice();
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
                table:this.UpdateTable(database, this.state.filter)
            }, function(){
                $('.nav-item.calculated_column').show(); 
                console.log(this.state.table)
            });
        });                
    }    
    
    handleAddColumn(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const routine = form.elements["column_routine"].value;
        const field = $('#column_bin').find('.column_name').val();
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
                let value =  routineFunc(item);
                database[key][field] = value;
                console.log(database[key]);
            });
            let headers = this.state.headers;
            headers.push(field);
            this.setState({
                database:database, 
                table:this.UpdateTable(database, this.state.filter),
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
                table:this.UpdateTable(this.state.database, filter)
            }, function(){console.log(this.state.table)}); 
        });
    }

    render() {
        return (
        <div id="container">
            <Nav fileinput={this.fileInput} fileinput2={this.fileInput2} csvhandler={this.CsvHandler} csvpastehandler={this.CsvPasteHandler} keyhandler={this.KeyHandler} headers={this.state.headers} headers2={this.state.headers2} filter={this.state.filter} handlequery={this.handleQuery} handleaddcolumn={this.handleAddColumn} reorderheaders={this.ReorderHeaders}/>
            <div id="outer-table-container">
                <div id="table-container">
                    <Table table={this.state.table} headers={this.state.headers} primarykey={this.state.primarykey}/>
                </div>
            </div>            
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))