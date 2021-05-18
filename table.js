function Sort(props) {
    if (props.clickedarray[props.field] == 1) {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25B2;</a>
        );
    } else if (props.clickedarray[props.field] == -1) {
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
                    <Sort handlesort={props.handlesort} field={field} clickedarray={props.clickedarray} />
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
            clickedArray:{},
            sortField:'',
            // sort: function(a, b) {return true;},
            // colWidths:{}
        };
        this.handleSort = this.handleSort.bind(this);
    }

    handleSort(field) {
        console.log(field);
        let clickedArray = {};
        this.props.headers.forEach(field => clickedArray[field] = 0);
        let clicked = this.state.clickedArray[field] == 1 ? -1 : 1;
        clickedArray[field] = clicked;
        
        this.setState({
            clickedArray: clickedArray,
            sortField: field
            // sort: function(a, b) { 
            //     if 
            //     return clicked*a[field].localeCompare(b[field]); 
            // }
        });
        return true;
    }

    sortByField(a, b, field) {
        if (field == '') {
            return true;
        }
        let clickedArray = this.state.clickedArray;
        let clicked = this.state.clickedArray[field] 
        if (!isNaN(a) && !isNaN(b)) {
            return clicked*(a - b);
        } else {
            return clicked*a[field].localeCompare(b[field]); 
        }
    }
    
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
        let clickedArray = {...this.state.clickedArray};
        let colWidths = {}

        this.props.headers.map(field => {
            // colWidths[field] = document.querySelector('th[data-field="' + field + '"]').offsetWidth;
            if ( clickedArray[field] == null || typeof clickedArray[field] == 'undefined') {
                clickedArray[field] = 1;
            }
            let widths = [];
            $("td[data-field='" + field + "']").each(function() {
                widths.push(($(this).text().length)*12);
            });
            $("th[data-field='" + field + "'] > a.header").each(function() {
                widths.push(($(this).text().length)*12);
            });
            // colWidths[field] = Math.min(400, Math.max(...widths));
            colWidths[field] = Math.min(1000, Math.max(...widths) + 15);
        });
        console.log(colWidths);
        let tableWidth = 0;
        $('th:visible').each(function() {
            tableWidth += colWidths[$(this).attr('data-field')];
        });
       
        $('#mainTable').css('width', tableWidth + 15);
        $('#table-container').css('width', tableWidth + 15);
        $('tbody tr').css('width', tableWidth);
        $('thead tr').css('width', tableWidth);
        $('th, td').each(function() {
            $(this).css('width', colWidths[$(this).attr('data-field')]);
        });
        $('tbody').css('margin-top', parseInt($('th').first().css('height')));

        let groupField = this.props.primarykey;
        let primaryKey = this.props.primarkey;
    
    }

    render() {
        // console.log(this.props.database);
        // console.log(this.state.table);
        console.log(this.props.table);
        return(
        <table id="mainTable" className="table table-bordered table-hover">
            <Header headers={this.props.headers} clickedarray={this.state.clickedArray} handlesort={this.handleSort} />
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
