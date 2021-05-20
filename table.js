function Sort(props) {
    if (props.sortarray[props.field] == 1) {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25B2;</a>
        );
    } else if (props.sortarray[props.field] == -1) {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25BC;</a>
        );
    } else {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25BA;</a>
        );
    }
}

function TableRow(props) {
 return (
    <tr>
        <td key='rank' data-field='rank'>{props.index}</td>
        {props.headers.filter(field => field != 'rank').map((field, index) => {
            return <td key={field} data-field={field}>{props.row[field]}</td>;
        })}                            
    </tr>    
  );
}

class Header extends React.Component {
    constructor(props) {
        super(props); 
        // this.handleSort = this.handleSort.bind(this);
    }
    
    ClickHandler(field) {
        console.log(field);
        $('#rename_column input[name="old_col_name"]').val(field);
    }
    
    render() {
        return(
            <thead>
                <tr id="header_row" className="table-secondary">                
                    {this.props.headers.map((field, i) => {
                        return <th key={field} data-field={field}>
                            <a href="#" className="header" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                            <div className="dropdown-menu" aria-labelledby={field}>
                                <a className="dropdown-item rename" data-bs-toggle="modal" data-bs-target="#rename_column" onClick={() => this.ClickHandler(field)} href="#">Rename</a>                        
                                    <a className="dropdown-item group_by" data-field={field} href="#">Group by</a>
                                    <a className="dropdown-item fields statistics" data-field={field} href="#" >Statistics</a>                        
                                    </div>
                                    <Sort handlesort={this.props.handlesort} field={field} sortarray={this.props.sortarray} />
                                </th>;                    
                            }
                        )}
                    </tr>
                </thead>
            );
        }
}

class Table extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            sortArray:{},
            sortField:'',
            filter:'true'
        };
        this.handleSort = this.handleSort.bind(this);
        this.updateTable = this.updateTable.bind(this);
    }

    updateTable() {
        console.log('updating table');
        
        let headers = this.props.headers;
        let filter = this.props.filter;
        let database = this.props.database;
        
        let table = [];
        let datum;
        
        for (let key in database) {
            datum = {};
            headers.map(field => {
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

    handleSort(field) {
        console.log(field);
        let sortArray = {};
        this.props.headers.forEach(field => sortArray[field] = 0);
        let clicked = this.state.sortArray[field] == 1 ? -1 : 1;
        sortArray[field] = clicked;
        
        this.setState({
            sortArray: sortArray,
            sortField: field
        });
        return true;
    }

    sortByField(a, b, field) {
        if (field == '') {
            return true;
        }
        let sortArray = this.state.sortArray;
        let clicked = this.state.sortArray[field] 
        if (!(isNaN(parseFloat(a[field])) || isNaN(parseFloat(b[field])))) {
            return clicked*(parseFloat(a[field]) - parseFloat(b[field]));
        } else {
            return clicked*a[field].localeCompare(b[field]); 
        }
    }
    
    componentDidUpdate() {
        console.log('use did update');
        let sortArray = {...this.state.sortArray};
        let colWidths = {}

        this.props.headers.map(field => {
            if ( sortArray[field] == null || typeof sortArray[field] == 'undefined') {
                sortArray[field] = 1;
            }
            
        });
        updateTableWidth(computeColWidths(this.props.headers));    
    }

    render() {        
        let table =  this.updateTable();
        console.log(table);
        return(
        <table id="mainTable" className="table table-bordered table-hover">
            <Header headers={this.props.headers} sortarray={this.state.sortArray} handlesort={this.handleSort} />
            <tbody>
                { table.sort((a, b) => this.sortByField(a, b, this.state.sortField)).map((row, index) => {
                    return <TableRow row={row} headers={this.props.headers} index={index + 1} key={index + 1} />
                    })
                }
            </tbody>
        </table>
    )
    }
}
