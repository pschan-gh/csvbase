class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // selectedFile: null,
            tableContent: [], 
            data:null,
            database:{},
            headers: ['rank', 'count'],
            headers2: [],
            primarykey:null,
            // secondarykey:null
        };
        this.CsvHandler = this.CsvHandler.bind(this);
        this.KeyHandler = this.KeyHandler.bind(this);
        this.fileInput = React.createRef();    
        this.fileInput2 = React.createRef();  
    }
    
    sanitize(str) {
        var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
        str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
        return str;
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
            // let sanitizedHeaders = headers.map(str => {return scope.sanitize(str);});
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
            // this.setState({database:database}, function() {
            //     this.UpdateTable();
            // });
            this.setState({database:database});            
        });                
    }
    
    UpdateTable() {
        let table = [];
        let row;
        let database = this.state.database;
        let headers = this.state.headers;
        for (let key in database) {
            row = [];
            headers.forEach(field => {
                row.push(database[key][field]);
            });
            table.push(row);
        }
        this.setState({tableContent: table});
    }
    
    render() {
        return (
        <div id="container">
            <Nav fileinput={this.fileInput} fileinput2={this.fileInput2} csvhandler={this.CsvHandler} keyhandler={this.KeyHandler} headers={this.state.headers} headers2={this.state.headers2} />
            <div id="outer-table-container">
                <div id="table-container">
                    <Table headers={this.state.headers} database={this.state.database} primarykey={this.state.primarykey}/>
                </div>
            </div>            
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))