function Sort(props) {
    if (props.sort == 1) {
        return(
            // <a className="triangle" onClick={() => props.handlesort(props.field)}>&#x25B2;</a>
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-up-fill"></i></a>
        );
    } else if (props.sort == -1) {
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
            <a className="dropdown-item recalculate" data-bs-toggle="modal" data-bs-target="#recalculate_column_bin" href="#" onClick={()=>{props.recalculatecolumn.current.setState({field:props.field});}}>Recalculate Column</a>
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
    
    handleRename(field) {
        this.props.renamecolumn.current.setState({
            name:field,
        });
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
                                    <a className="dropdown-item rename" data-bs-toggle="modal" data-bs-target="#rename_column" onClick={() => {this.handleRename(field);}} href="#">Rename</a>
                                    <RecalculateColumn recalculatecolumn={this.props.recalculatecolumn} headers={this.props.headers} field={field} />
                                    <a className="dropdown-item group_by" data-field={field} href="#"  onClick={() => this.props.grouphandler(field)}>Group by</a>
                                    <a className="dropdown-item fields statistics" data-field={field} href="#" data-bs-toggle="modal" data-bs-target="#statistics" onClick={() => this.StatisticsHandler(field)}>Statistics</a>                        
                                </div>
                                <Sort handlesort={this.props.handlesort} sort={this.props.headers[field].sort} field={field} />
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
        // if (groupField != primaryKey && groupField != '') {
        if (this.props.groups.length > 1) {
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
                        return <TableRow groupindex={groupIndex + 1} row={row} count={group.length} headers={this.props.headers} index={index + 1} key={group.toString() + (index + 1).toString()} />
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
            // sortArray:{},
            sortField:'',
            groupField:'',
            primarykey:null,
            groupValues:[''],
            filter:'true',
            groups:[],
            datalist:[],
            displayedGroups:[],
            headers:{}
        };
        this.handleSort = this.handleSort.bind(this);
        this.updateTable = this.updateTable.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        // this.GroupHandler = this.GroupHandler.bind(this);
    }    

    updateDisplay() {
        let displayedGroups;
        if (this.state.groups.length == 1) {
            displayedGroups = this.state.displayedGroups.slice();
            displayedGroups.push(this.state.groups[0].slice(this.state.displayedGroups.length, this.state.displayedGroups.length + 50));
            console.log(displayedGroups);
        } else {
            displayedGroups = this.state.groups;
        }
        this.setState({
            displayedGroups:displayedGroups
        });
    }

    resetGroups(database, headers, primarykey) {
        console.log('resetting groups');

        // let sortArray = {};
        let datalist = [];
        let datum;
        // const database = this.props.database;
        // const headers = this.props.headers;        
        const filterFunc =  new Function('item', 'return ' + this.props.filter);
        
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
        // Object.keys(headers).map(field => {
        //     sortArray[field] = 0;
        // });
        
        let updatedHeaders = {...headers}
        Object.keys(updatedHeaders).map(field => {
            updatedHeaders[field].sort = 0;
        });
        
        this.updateTable(primarykey, this.state.sortField, datalist.filter(filterFunc), updatedHeaders, primarykey);     
    }

    updateTable(
        gf = this.state.groupField, 
        sortField = this.state.sortField, 
        datalist = this.state.datalist.slice(), 
        headers = this.state.headers,
        primarykey = this.state.primarykey
    ) {        
        console.log('updating table');
        
        const groupField = gf == '' ? primarykey : gf;
    
        let values = datalist.map(item => {
            return item[groupField];
        });
        
        let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
        // let clicked = sortArray[groupField];
        let clicked = headers[groupField].sort;
        let uniqueSorted = unique.sort((a, b) => {                
            if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                return clicked*(parseFloat(a) - parseFloat(b));
            } else {
                return clicked*a.localeCompare(b); 
            }
        });            
    
        // let filterFunc =  new Function('item', 'return ' + filter);
        let datum;
        let updatedGroups;
        console.log(uniqueSorted.length);
        console.log(datalist.length);
        if (uniqueSorted.length == datalist.length) {
            updatedGroups = [ datalist.sort((a, b) => {return this.sortByField(headers, a, b, sortField);}) ];
        } else {
            updatedGroups = uniqueSorted.map(value => {
                let table = [];
                for (let i = 0; i < datalist.length; i++) {
                    let item = datalist[i];
                    if (item[groupField] != value && groupField != primarykey) {
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
                // return table.filter(filterFunc)
                //     .sort((a, b) => {return this.sortByField(sortArray, a, b, sortField);});
                return table.sort((a, b) => {return this.sortByField(headers, a, b, sortField);});
            });
            datalist = [].concat.apply([], updatedGroups);
        }        
        
        let displayedGroups = [];
        if (updatedGroups.length == 1) {            
            displayedGroups.push(updatedGroups[0].slice(this.state.displayedGroups.length, this.state.displayedGroups.length + 50));
            console.log(displayedGroups);
        } else {
            displayedGroups = updatedGroups;
        }
        
        this.setState({
            groups:updatedGroups,
            groupField:groupField,
            // sortArray:{...sortArray},
            sortField:sortField,
            datalist: datalist,
            displayedGroups : displayedGroups,
            headers:{...headers},
            primarykey:primarykey
        });
    }

    handleSort(field) {
        console.log(field);
        // let sortArray = {...this.state.sortArray};
        // sortArray[field] = this.state.sortArray[field] == 1 ? -1 : 1;
        // this.updateTable(this.state.groupField, sortArray, field);
        let headers = {...this.state.headers};
        headers[field].sort = headers[field].sort == 1 ? -1 : 1;
        this.updateTable(this.state.groupField, field, this.state.datalist.slice(), headers);
    }

    sortByField_old(sortArray, a, b, field) {
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
    
    sortByField(headers, a, b, field) {
        if (field == '') {
            return true;
        }
        
        let clicked = headers[field].sort;
        
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
        // const sortArray = {...this.state.sortArray};
        let colWidths = {}
        const headers = this.state.headers;
        // Object.keys(this.props.headers).map(field => {
        //     if ( sortArray[field] == null || typeof sortArray[field] == 'undefined') {
        //         sortArray[field] = 1;
        //     }            
        // });
        
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
            <Header groups={this.state.groups} headers={this.state.headers} renamecolumn={this.props.renamecolumn} recalculatecolumn={this.props.recalculatecolumn} grouphandler={this.updateTable} groupfield={this.state.groupField} handlesort={this.handleSort} />
            <Tbody groups={this.state.groups} headers={this.state.headers} groupfield={this.state.groupField} primarykey={this.state.primarykey} />
            </table>
        )
    }
}
