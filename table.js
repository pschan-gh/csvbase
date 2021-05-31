function Sort(props) {
    if (props.sortarray[props.field] == 1) {
        return(
            // <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25B2;</a>
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-up-fill"></i></a>
        );
    } else if (props.sortarray[props.field] == -1) {
        return(
            // <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25BC;</a>
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-down-fill"></i></a>
        );
    } else {
        return(
            /*<a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25BA;</a>*/
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-right"></i></a>
        );
    }
}

function TableRow(props) {
    let rank = props.index;
    return (
        <tr data-group-index={props.groupindex}>
        <td key='count' data-field='count' className='col_count' data-count={props.count}><div className="count-number" style={{float:'left'}}>{props.count}</div><div style={{float:'right'}} className="expandcollapse">+</div></td>
        <td key='rank' data-field='rank' className='col_rank' >{rank}</td>        
        {Object.keys(props.headers).filter(field => field != 'rank' && field != 'count').map((field, index) => {
            return <td key={field} data-field={field}>{props.row[field]}</td>;
        })}                            
        </tr>    
    );
}

function RecalculateColumn(props) {
    if (props.headers[props.field].routine != 'protected') {
        return (
            <a className="dropdown-item recalculate" data-bs-toggle="modal" data-bs-target="#recalculate_column_bin" href="#" onClick={()=>{$('#recalculate_column_bin input.column_name').val(props.field);$('#recalculate_column_bin textarea').val(props.headers[props.field].routine)}}>Recalculate Column</a>
        );
    } else {
        return '';
    }
}

class Header extends React.Component {
    constructor(props) {
        super(props); 
        this.StatisticsHandler = this.StatisticsHandler.bind(this);
        
    }    
    
    StatisticsHandler(field) {
        let table = [];
        this.props.groups.forEach(group => {
            group.map(element => {
                table.push(element);
            });
        });
        let values = table.map(item => {return item[field];});
        statistics(values, field);
    }
    
    ClickHandler(field) {
        console.log(field);
        $('#rename_column input[name="old_col_name"]').val(field);
    }
    
    render() {
        return(
            <thead>
                <tr id="header_row" className="table-secondary">
                    <th key='count' data-field='count' className='col_count'>Count</th>
                    <th key='rank' data-field='rank' className='col_rank'>Rank</th>                    
                    {Object.keys(this.props.headers).filter(field => {return (field != 'rank' && field != 'count');}).map((field, i) => {
                        let groupby = this.props.groupfield == field ? 'groupby' : '';
                        return (
                            <th key={field} data-field={field} className={groupby}>
                                <a href="#" className="header" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                                <div className="dropdown-menu" aria-labelledby={field}>
                                    <a className="dropdown-item rename" data-bs-toggle="modal" data-bs-target="#rename_column" onClick={() => this.ClickHandler(field)} href="#">Rename</a>
                                    <RecalculateColumn headers={this.props.headers} field={field} />
                                    <a className="dropdown-item group_by" data-field={field} href="#"  onClick={() => this.props.grouphandler(field)}>Group by</a>
                                    <a className="dropdown-item fields statistics" data-field={field} href="#" data-bs-toggle="modal" data-bs-target="#statistics" onClick={() => this.StatisticsHandler(field)}>Statistics</a>                        
                                </div>
                                <Sort handlesort={this.props.handlesort} field={field} sortarray={this.props.sortarray} />
                            </th>
                        )
                    })}
                </tr>
            </thead>
        );
    }
}

class Tbody extends React.Component {
    constructor(props) {
        super(props); 
    }    
    componentDidUpdate() {
        console.log('tbody did update');
        
        const groupField = this.props.groupfield;
        const primaryKey = this.props.primarykey;
        
        // $(function() {
        $('tbody tr').off();
        $('td.col_count').off();
        $('tbody tr').click(function() {
            $('td').css('color', '');
            $(this).find('td').css('color', 'red');
        });
        if (groupField != primaryKey && groupField != '') {
            let groupCount = $('tbody').attr('data-group-count');
            for (let i = 1; i <= groupCount; i++) {            
                $('tbody tr[data-group-index=' + i + ']').not(":eq(0)").hide();
                $('tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                $('tbody tr[data-group-index="' + i + '"] td.col_count').click(() => {
                    if ($('tbody tr[data-group-index="' + i + '"]').length > 1) {
                        if ($('tbody tr[data-group-index="' + i + '"]:eq(1)').is(":visible")) {
                            $('tbody tr[data-group-index="' + i + '"]:not(:first)').hide();
                            $('tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                            $('tbody tr[data-group-index="' + i + '"]').css('background-color', '');
                        } else {
                            $('tbody tr[data-group-index="' + i + '"]').show();
                            $('tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('-');
                            let bgcolor = 'hsl(' + (i * 150) % 360 + ', 55%, 95%)';
                            $('tbody tr[data-group-index="' + i + '"]').css('background-color', bgcolor);
                        }
                    }
                });
            }
        } else {
            $('div.expandcollapse').hide();
        }
        // });
    }
    
    render() {
        return (
            <tbody data-group-count={this.props.groups.length}>
            {
                this.props.groups.map((group, groupIndex) => {
                    return group.map((row, index, group) => {
                        return <TableRow groupbyprimarykey={this.props.groupbyprimarykey} groupindex={groupIndex + 1} row={row} count={group.length} headers={this.props.headers} index={index + 1} key={group.toString() + (index + 1).toString()} />
                    })
                })
            }
            </tbody>
        );
    }
    
}

class Table extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            sortArray:{},
            sortField:'',
            groupField:'',
            groupValues:[''],
            filter:'true',
            groups:[],
            datalist:[]
        };
        this.handleSort = this.handleSort.bind(this);
        this.updateTable = this.updateTable.bind(this);
        // this.GroupHandler = this.GroupHandler.bind(this);
    }    

    resetGroups() {
        console.log('resetting groups');

        let sortArray = {};
        let datalist = [];
        let datum;
        const database = this.props.database;
        const headers = this.props.headers;
          
        for (let key in database) {
            datum = {};
            Object.keys(headers).map(field => {
                if (database[key][field] == null || typeof database[key][field] == 'undefined') {
                    datum[field] = '';
                } else {
                    datum[field] = database[key][field];
                }
            });
            datalist.push(datum);
        }
        Object.keys(this.props.headers).map(field => {
            sortArray[field] = 0;
        });
        this.updateTable(this.props.primarykey, sortArray, this.state.sortField, datalist);        
    }

    updateTable(gf = this.state.groupField, sortArray = {...this.state.sortArray}, sortField = this.state.sortField, datalist = this.state.datalist.slice()) {
        console.log('updating table');
        
        const headers = this.props.headers;
        const filter = this.props.filter;
        const database = this.props.database;
        const groupField = gf == '' ? this.props.primarykey : gf;
    
        let values = datalist.map(item => {
            return item[groupField];
        });
        
        let uniqueSorted = [''];
        
        if(groupField != this.props.primarykey) {
            let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
            let clicked = sortArray[groupField];
            uniqueSorted = unique.sort((a, b) => {                
                if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                    return clicked*(parseFloat(a) - parseFloat(b));
                } else {
                    return clicked*a.localeCompare(b); 
                }
            });            
        }
    
        let filterFunc =  new Function('item', 'return ' + filter);
        let datum;
        let updatedGroups = uniqueSorted.map(value => {
            let table = [];
            for (let i = 0; i < datalist.length; i++) {
                let item = datalist[i];
                if (item[groupField] != value && groupField != this.props.primarykey) {
                    continue;
                }
                datum = {};                
                for (let field in headers) {
                    if (item[field] == null || typeof item[field] == 'undefined') {
                        datum[field] = '';
                    } else {
                        datum[field] = item[field];
                    }
                }
                table.push(datum);
            }
            return table.filter(filterFunc)
                .sort((a, b) => {return this.sortByField(sortArray, a, b, sortField);});
        });                
        
        datalist = [].concat.apply([], updatedGroups);
        
        this.setState({
            groups:updatedGroups,
            groupField:groupField,
            sortArray:{...sortArray},
            sortField:sortField,
            datalist: datalist,
        });
    }

    handleSort(field) {
        console.log(field);
        let sortArray = {...this.state.sortArray};
        sortArray[field] = this.state.sortArray[field] == 1 ? -1 : 1;
        this.updateTable(this.state.groupField, sortArray, field);
    }

    sortByField(sortArray, a, b, field) {
        if (field == '') {
            return true;
        }
        
        let clicked = sortArray[field];
        
        let diff;
        if (!(isNaN(a[field]) || isNaN(b[field]))) {
            diff =  clicked*(+a[field] - +b[field]);
        } else {
            diff = clicked*a[field].toString().localeCompare(b[field].toString()); 
        }
        
        return diff;
    }
    
    componentDidUpdate() {
        console.log('table.js did update');
        const sortArray = {...this.state.sortArray};
        let colWidths = {}
        const headers = this.props.headers;
        Object.keys(this.props.headers).map(field => {
            if ( sortArray[field] == null || typeof sortArray[field] == 'undefined') {
                sortArray[field] = 1;
            }            
        });
        
        // $(function() {
            $('.field_checkbox').each(function() {
                let field = $(this).attr('data-field');
                if(this.checked) {                
                    $('th[data-field="' + field + '"], td[data-field="' + field + '"]').show();
                } else {
                    $('th[data-field="' + field + '"], td[data-field="' + field + '"]').hide();
                }
            });
            let widths = computeColWidths(headers);
            updateTableWidth(widths);
            freezeColumns(widths);
        // });        
    }

    render() {        
        return(
            <table id="mainTable" className="table table-bordered table-hover">
            <Header groups={this.state.groups} grouphandler={this.updateTable} groupfield={this.state.groupField} headers={this.props.headers} sortarray={this.state.sortArray} handlesort={this.handleSort} />
            <Tbody groups={this.state.groups} groupfield={this.state.groupField} primarykey={this.props.primarykey} groupbyprimarykey={this.props.primarykey == this.state.groupField || this.state.groupField == ''} headers={this.props.headers} />
            </table>
        )
    }
}
