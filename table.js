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
    // let bgcolor = props.groupbyprimarykey ? '' : 'hsl(' + (props.groupindex * 85) % 360 + ', 45%, 95%)';    
    // style={{backgroundColor:bgcolor}}
    let rank = props.index;
    return (
        <tr data-group-index={props.groupindex}>
        <td key='count' data-field='count' className='count' data-count={props.count}><div className="count-number" style={{float:'left'}}>{props.count}</div><div style={{float:'right'}} className="expandcollapse">+</div></td>
        <td key='rank' data-field='rank'>{rank}</td>        
        {props.headers.filter(field => field != 'rank' && field != 'count').map((field, index) => {
            return <td key={field} data-field={field}>{props.row[field]}</td>;
        })}                            
        </tr>    
    );
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
                    {this.props.headers.map((field, i) => {
                        let groupby = this.props.groupfield == field ? 'groupby' : '';
                        return <th key={field} data-field={field} className={groupby}>
                            <a href="#" className="header" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                            <div className="dropdown-menu" aria-labelledby={field}>
                                <a className="dropdown-item rename" data-bs-toggle="modal" data-bs-target="#rename_column" onClick={() => this.ClickHandler(field)} href="#">Rename</a>                        
                                    <a className="dropdown-item group_by" data-field={field} href="#"  onClick={() => this.props.grouphandler(field)}>Group by</a>
                                    <a className="dropdown-item fields statistics" data-field={field} href="#" data-bs-toggle="modal" data-bs-target="#statistics" onClick={() => this.StatisticsHandler(field)}>Statistics</a>                        
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
            prevSortField:'',
            groupField:'',
            groupValues:[''],
            filter:'true',
            groups:[],      
        };
        this.handleSort = this.handleSort.bind(this);
        this.updateTable = this.updateTable.bind(this);
        this.GroupHandler = this.GroupHandler.bind(this);
    }

    GroupHandler(field) {
        let values = Object.keys(this.props.database).map(key => {
            return this.props.database[key][field];
        });
        let uniqueSorted;
        if(field != this.props.primarykey) {
            let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
            uniqueSorted = unique.sort((a, b) => {
                let clicked = this.state.sortArray[field];
                if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                    return clicked*(parseFloat(a) - parseFloat(b));
                } else {
                    return clicked*a.localeCompare(b); 
                }
            });            
        } else {
            uniqueSorted = [''];
        }
        this.setState({
            groupField:field,
            groupValues: uniqueSorted,
        }, function(){this.updateTable();});
    }

    updateTable() {
        console.log('updating table');
        
        let headers = this.props.headers;
        let filter = this.props.filter;
        let database = this.props.database;
        let groupField = this.state.groupField == '' ? this.props.primarykey : this.state.groupField;
        
        let uniqueSorted = this.state.groupValues.sort((a, b) => {
            let clicked = this.state.sortArray[groupField];
            if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                return clicked*(parseFloat(a) - parseFloat(b));
            } else {
                return clicked*a.localeCompare(b); 
            }
        });  
        
        let datalist;
        
        if (this.state.groups.length == 0) {
            datalist = [];
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
                datalist.push(datum);
            }
        } else {
            datalist = [].concat.apply([], this.state.groups);
        }
                
        let filterFunc =  new Function('item', 'return ' + filter);
        let datum;
        let groups = uniqueSorted.map(value => {
            let table = [];
            for (let i = 0; i < datalist.length; i++) {
                let item = datalist[i];
                if (item[groupField] != value && groupField != this.props.primarykey) {
                    continue;
                }
                datum = {};
                headers.map(field => {
                    if (item[field] == null || typeof item[field] == 'undefined') {
                        datum[field] = '';
                    } else {
                        datum[field] = item[field];
                    }
                });
                table.push(datum);
            }
            return table.filter(filterFunc)
                .sort((a, b) => {return this.sortByField(a, b, this.state.sortField, '')});
        });                
        console.log(groups);
        this.setState({
            groups:groups,
        }
        );
    }

    handleSort(field) {
        console.log(field);
        let sortArray = this.state.sortArray;
        let clicked = this.state.sortArray[field] == 1 ? -1 : 1;
        sortArray[field] = clicked;
        let prevSortField = this.state.sortField;
        console.log(prevSortField);
        this.setState({
            sortArray: sortArray,
            sortField: field,
            prevSortField:prevSortField
        }, function(){this.updateTable();});
    }

    sortByField(a, b, field, field2) {
        if (field == '') {
            return true;
        }
        let sortArray = this.state.sortArray;
        let clicked = this.state.sortArray[field];
        
        let diff, diff2;
        if (!(isNaN(parseFloat(a[field])) || isNaN(parseFloat(b[field])))) {
            diff =  clicked*(parseFloat(a[field]) - parseFloat(b[field]));
        } else {
            diff = clicked*a[field].localeCompare(b[field]); 
        }
        
        if (field2 == '') {
            diff2 = true;
        } else {
            let clicked2 = this.state.sortArray[field2];
            if (!(isNaN(parseFloat(a[field2])) || isNaN(parseFloat(b[field2])))) {
                diff2 = clicked2*(parseFloat(a[field2]) - parseFloat(b[field2]));
            } else {
                diff2 =  clicked2*(a[field2].localeCompare(b[field2])); 
            }
        }
        return diff || diff2;
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
        
        $('.field_checkbox').each(function() {
            let field = $(this).attr('data-field');
            if(this.checked) {                
                $('th[data-field="' + field + '"], td[data-field="' + field + '"]').show();
            } else {
                $('th[data-field="' + field + '"], td[data-field="' + field + '"]').hide();
            }
        });
        
        updateTableWidth(computeColWidths(this.props.headers));
        $('tr').off();
        $('tr').on('click', function() {
            $('td').css('color', '');
            $(this).find('td').css('color', 'red');
        });
        
        if (this.state.groupField != this.props.primarykey && this.state.groupField != '') {
            $('tbody tr').off();
            let groupCount = $('tbody').attr('data-group-count');
            for (let i = 0; i < groupCount; i++) {            
                $('tbody tr[data-group-index="' + i + '"]:not(:first)').hide();
                $('tbody tr[data-group-index="' + i + '"] td.count').click(() => {
                    if ($('tbody tr[data-group-index="' + i + '"]').length > 1) {
                        if ($('tbody tr[data-group-index="' + i + '"]:eq(1)').is(":visible")) {
                            $('tbody tr[data-group-index="' + i + '"]:not(:first)').hide();
                            $('tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                            $('tbody tr[data-group-index="' + i + '"]').css('background-color', '');
                        } else {
                            $('tbody tr[data-group-index="' + i + '"]').show();
                            $('tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('-');
                            let bgcolor = 'hsl(' + (i * 95) % 360 + ', 55%, 95%)';
                            $('tbody tr[data-group-index="' + i + '"]').css('background-color', bgcolor);
                        }
                    }
                });
            }
        } else {
            // $('div.count-number').hide();
            $('div.expandcollapse').hide();
        }
        
    }

    render() {        
        // let groups =  this.updateTable();
        // console.log(groups);
        return(
            <table id="mainTable" className="table table-bordered table-hover">
            <Header groups={this.state.groups} grouphandler={this.GroupHandler} groupfield={this.state.groupField} headers={this.props.headers} sortarray={this.state.sortArray} handlesort={this.handleSort} />
            <tbody data-group-count={this.state.groups.length}>
            {
                this.state.groups.map((group, groupIndex) => {
                    return group.map((row, index, group) => {
                        return <TableRow groupbyprimarykey={this.props.primarykey == this.state.groupField || this.state.groupField == ''} groupindex={groupIndex + 1} row={row} count={group.length} headers={this.props.headers} index={index + 1} key={group.toString() + (index + 1).toString()} />
                    })
                })
            }
            </tbody>
            </table>
        )
    }
}
