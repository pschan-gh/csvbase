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

function Header(props) {
    return(
        <thead>
            <tr id="header_row" className="table-secondary">                
                {props.headers.map((field, i) => {
                    return <th key={field} data-field={field}>
                    <a href="#" className="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                    <div className="dropdown-menu" aria-labelledby={field}>
                        <a className="dropdown-item group_by" data-field={field} href="#">Group by</a>
                        <a className="dropdown-item fields statistics" data-field={field} href="#" >Statistics</a>
                        <a className="dropdown-item recalculate fields" data-toggle="modal" data-target="#column_bin" data-field={field} href="#">Recalculate</a>
                        <a className="dropdown-item fields hide" data-field={field} href="#">Hide</a>
                    </div>
                    <Sort handlesort={props.handlesort} field={field} sortarray={props.sortarray} />
                    </th>;                    
                }
                )}
            </tr>
        </thead>
    );        
}

class Table extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            sortArray:{},
            sortField:'',
        };
        this.handleSort = this.handleSort.bind(this);
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
        if (!isNaN(a) && !isNaN(b)) {
            return clicked*(a - b);
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
        return(
        <table id="mainTable" className="table table-bordered table-hover">
            <Header headers={this.props.headers} sortarray={this.state.sortArray} handlesort={this.handleSort} />
            <tbody>
                { this.props.table.sort((a, b) => this.sortByField(a, b, this.state.sortField)).map((row, index) => {
                    return <TableRow row={row} headers={this.props.headers} index={index + 1} key={index + 1} />
                    })
                }
            </tbody>
        </table>
    )
    }
}