function TableRow(props) {
 return (
    <tr>
        {props.headers.map(field => {
            return <td key={field} data-field={field}>{props.item[field]}</td>;
        })}                            
    </tr>    
  );
}

class Table extends React.Component {
    constructor(props) {
        super(props);        
    }
    // useEffect(() => {
    //     console.log('use effect');
    // });
    componentDidMount() {
        console.log('did mount');
        let colWidths = {};
        this.props.headers.map(field => {
            console.log(document.querySelector('th[data-field="' + field + '"]'));
        });
        // console.log(colWidths);
    }
    componentDidUpdate() {
        console.log('use did update');
        let colWidths = {};
        this.props.headers.map(field => {
            // colWidths[field] = document.querySelector('th[data-field="' + field + '"]').offsetWidth;
            colWidths[field] = Math.max($("td[data-field='" + field + "']").width(), $("th[data-field='" + field + "']").width());
        });
        console.log(colWidths);
        
        let tableWidth = 0;
        $('th:visible').each(function() {
            tableWidth += colWidths[$(this).attr('data-field')];
        });

        $('#mainTable').css('width', tableWidth);
        $('#table-container').css('width', tableWidth + 15);
        $('tbody tr').css('width', tableWidth);
        $('thead tr').css('width', tableWidth);
        $('th, td').each(function() {
            $(this).css('width', colWidths[$(this).attr('data-field')]);
        });
        $('tbody').css('margin-top', parseInt($('th').first().css('height')));

    }

    render() {
        console.log(this.props.database);
        return(
        <table id="mainTable" className="table table-bordered table-hover">
            <thead>
                <tr id="header_row" className="table-secondary">
                    {this.props.headers.map((field, i) => {
                        return <th key={field} data-field={field}>{field}</th>;
                    }
                    )}
                </tr>
            </thead>
            <tbody>
                { Object.keys(this.props.database).map(field => {
                    return <TableRow headers={this.props.headers} item={this.props.database[field]} key={field} />
                    })
                }
            </tbody>
        </table>
    )
    }
}


class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // selectedFile: null,
            tableContent: [], 
            data:null,
            database:[],
            headers: [],
            primarykey:null  
        };
        this.CsvHandler = this.CsvHandler.bind(this);
        this.KeyHandler = this.KeyHandler.bind(this);
        this.fileInput = React.createRef();    
    }
    
    sanitize(str) {
        var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
        str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
        return str;
    }

    CsvHandler(e) {
        e.preventDefault();        
        console.log(
        `Selected file - ${this.fileInput.current.files[0].name}`
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
            let headers = results.meta['fields']; 
            let sanitizedHeaders = headers.map(str => {return scope.sanitize(str);});
            scope.setState({
                data: results.data,
                headers:headers,
                sanitizedheaders: sanitizedHeaders
            });
        }
        reader.readAsText(this.fileInput.current.files[0]);
    }
    
    KeyHandler(e) {
        console.log('primary key selected');
        // console.log(e.target);
        let {name, value} = e.target;
        const scope = this;
        console.log(name);
        console.log(value);
        this.setState({'primarykey': value}, function() {
            console.log(this.state);
            let row;
            let primarykey = this.state.primarykey;
            let keyval;
            console.log(primarykey);
            let database = {};
            for (let i = 0; i < this.state.data.length; i++) {
                row = this.state.data[i];
                keyval = row[primarykey];
                if (!(keyval in database)) {
                    database[keyval] = {};
                    this.state.headers.map(field => {
                        database[keyval][field] = row[field];
                    });
                } else {
                    this.state.headers.map(field => {
                        if (row[field] != null && typeof row[field] != 'undefined' ) {
                            database[keyval][field] = row[field];
                        }
                    });
                }
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
            <Nav fileinput={this.fileInput} csvhandler={this.CsvHandler} keyhandler={this.KeyHandler} headers={this.state.headers}/>
            <div id="outer-table-container">
                <div id="table-container">
                    <Table headers={this.state.headers} database={this.state.database}/>
                </div>
            </div>
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))