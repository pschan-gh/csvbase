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
    let bgcolor = props.groupbyprimarykey ? '' : 'hsl(' + (props.groupindex * 75) % 360 + ', 45%, 95%)';    
    // let rank = props.groupbyprimarykey ? props.groupindex : props.index;
    let rank = props.index;
    return (
        <tr data-group-index={props.groupindex} style={{backgroundColor:bgcolor}}>
        <td key='rank' data-field='rank'>{rank}</td>
        {props.headers.filter(field => field != 'rank').map((field, index) => {
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
        this.updateTable();
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

    // initializeGroups(headers, filter, groups, groupField) {
    // 
    // 
    //     let dataTable[];
    //     if (groups.length == 0) {
    //         dataTable = this.props.database;
    //         Object.keys(this.props.databse)
    //     } else {
    //         dataTable = 
    //     }
    // 
    // }

    updateTable() {
        console.log('updating table');
        
        let headers = this.props.headers;
        let filter = this.props.filter;
        let database = this.props.database;
        let groupField = this.state.groupField == '' ? this.props.primarykey : this.state.groupField;
        
        // let values = Object.keys(database).map(key => {
        //     return database[key][groupField];
        // });
        // console.log(values);
        
        let uniqueSorted = this.state.groupValues;
        // if(groupField != this.props.primarykey) {
        //     let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
        //     uniqueSorted = unique.sort((a, b) => {
        //         let clicked = this.state.sortArray[this.state.groupField];
        //         if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
        //             return clicked*(parseFloat(a) - parseFloat(b));
        //         } else {
        //             return clicked*a.localeCompare(b); 
        //         }
        //     });            
        // } else {
        //     uniqueSorted = [''];
        // }
        console.log(uniqueSorted);
        
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
        console.log(datalist);
                
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
            // if (this.state.prevSortField != '') {
            //     console.log('multiple sort ' + this.state.prevSortField + ' ' + this.state.sortField);
            //     return table.filter(filterFunc)
            //     .sort((a, b) => this.sortByField(a, b, this.state.prevSortField))
            //     .sort((a, b) => this.sortByField(a, b, this.state.sortField));
            // } else {
            //     return table.filter(filterFunc)
            //     .sort((a, b) => this.sortByField(a, b, this.state.sortField));
            // }
            // console.log('multiple sort ' + this.state.prevSortField + ' ' + this.state.sortField);
            console.log(table);
            return table.filter(filterFunc)
                .sort((a, b) => {return this.sortByField(a, b, this.state.sortField, '')});
        });                
        // return groups;
        console.log(groups);
        this.setState({groups:groups});            
    }

    handleSort(field) {
        console.log(field);
        let sortArray = this.state.sortArray;
        // this.props.headers.forEach(field => sortArray[field] = 0);
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
    }

    render() {        
        // let groups =  this.updateTable();
        // console.log(groups);
        return(
            <table id="mainTable" className="table table-bordered table-hover">
            <Header groups={this.state.groups} grouphandler={this.GroupHandler} groupfield={this.state.groupField} headers={this.props.headers} sortarray={this.state.sortArray} handlesort={this.handleSort} />
            <tbody>
            {
                this.state.groups.map((group, groupIndex) => {
                    return group.map((row, index) => {
                        return <TableRow groupbyprimarykey={this.props.primarykey == this.state.groupField || this.state.groupField == ''} groupindex={groupIndex + 1} row={row} headers={this.props.headers} index={index + 1} key={group.toString() + (index + 1).toString()} />
                    })
                })
            }
            </tbody>
            </table>
        )
    }
}
