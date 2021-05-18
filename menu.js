function AddColumn(props) {
    return (
        <a className="fields nav-link" data-toggle="modal" data-target="#column_bin" href="#" id="calculated_column">Add Calculated Column</a>
    );
}

class AddColumnModal extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidUpdate(props) {
        $('.field_reference button.field').off();
        $('.field_reference button.field').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            // console.log(e);
            insertAtCursor(document.getElementById('column_routine'), '+(@' + $(this).text() + ')');
        });
    }
    render() {
        return (
            <div id="column_bin" className="modal" tabIndex="-1" role="dialog" aria-labelledby="column_bin" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="dialog" >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 style={{display:'inline'}} className="modal-title">Calculate Column</h5>
                            <input style={{display:'inline'}} className="form-control column_name" style={{fontFamily:'Courier'}} type="text" id="calc_col_name" name="calc_col_name"/>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="field_reference" style={{padding:'10px'}}>
                            {this.props.headers.map(field =>
                                <button key={field} className="field btn btn-outline-info btn-sm">{field}</button>
                            )}
                        </div>
                        <form onSubmit={this.props.handleaddcolumn}>                
                            <div className="modal-body">                
                                <textarea style={{width:'100%',height:'25em',fontFamily:'Courier'}} id="column_routine"  name="column_routine" ></textarea>
                            </div>
                            <div className="modal-footer">
                                <input id="column_submit" className="form-control" type="submit" value="Submit" />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

function Query(props) {
    return (
        <form className="dropdown-menu query" aria-labelledby="navbarDropdown" onSubmit={props.handlequery} >
            <div className="form-row">
                <div className="form-group col-md-11">
                    <input className="form-control" type="text" id="query" name="query" defaultValue={props.filter}/>
                </div>
                <div className="form-group col-md-1">
                    <input id="query_submit" className="form-control" type="submit" value="Submit" />
                </div>
            </div>
        </form>
    );
}

class FieldCheckBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isChecked:true
        };
        
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    
    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        
        this.setState({
            [name]: value,
            isChecked: value
        }, () => {
            if (this.state.isChecked) {
                $('td[data-field="' + name + '"], th[data-field="' + name + '"]').show();
            } else {
                $('td[data-field="' + name + '"], th[data-field="' + name + '"]').hide();
            }
        });
    }
  render() {
      return (
          <a className="dropdown-item" key={this.props.field}>
          <input className='field_checkbox' checked={this.state.isChecked} type='checkbox' data-field={this.props.field} name={this.props.field} onChange={this.handleInputChange} /><span>{this.props.field}</span>
          </a>
      );
  }
}

class CheckBoxes extends React.Component {
    constructor(props){
        super(props);     
    }
    
    render() {
        console.log(this.props.headers);
        return (            
            <div className="dropdown-menu" id="columns_menu" aria-labelledby="dropdownMenuButton">
            {this.props.headers.map(field => {
                return <FieldCheckBox key={field} field={field} />
            })}
            </div>
        );
    }
}

class Key extends React.Component {
    constructor(props) {
        super(props);        
    }
        
    render() {
        return (
            <select name={this.props.name} className="form-control form-control-sm key" data-toggle="tooltip" data-placement="bottom" title="Set Key" onChange={this.props.keyhandler}>
                <option value="default">Select Key...</option>
                {this.props.headers.map((field, i) => {
                    return <option key={field} className={field} value={field}>{field}</option>;
                })}
            </select>
        );
    }
}

class CsvInput extends React.Component {
    constructor(props) {
        super(props);        
    }
        
    render() {
        return (
            <label className="dropdown-item" >
            Import CSV
            <input type="file" ref={this.props.fileinput} accept=".csv, .txt, .lst" style={{ display: "none" }} onChange={this.props.csvhandler}/>
            </label>
        );
    }
}

class Nav extends React.Component {
    constructor(props){
        super(props);     
    }
    componentDidUpdate(props) {
        var $chkboxes = $('.field_checkbox');
        var lastChecked = null;
        $chkboxes.click(function(e) {
            if (!lastChecked) {
                lastChecked = this;
                return;
            }

            if (e.shiftKey) {
                var start = $chkboxes.index(this);
                var end = $chkboxes.index(lastChecked);

                $chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).each(function(){
                    if(this.checked != lastChecked.checked) {
                         // this.click();
                         this.checked = lastChecked.checked;                         
                     }
                     let field = $(this).attr('field');
                     if (this.checked) {
                         $('th[field="' + field + '"], td[field="' + field + '"]').show();
                     } else {
                         $('th[field="' + field + '"], td[field="' + field + '"]').hide();
                     }
                 });                   
            }
            $chkboxes.each(function() {
                let field = $(this).attr('field');
                if ($(this).is(':checked')) {
                    $('th[field="' + field + '"], td[field="' + field + '"]').show();
                } else {
                    $('th[field="' + field + '"], td[field="' + field + '"]').hide();
                }
            });
            
            lastChecked = this;
            let colWidths = {};
            props.headers.map(field => {
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
            let tableWidth = 0;
            $('.field_checkbox:checked').each(function() {
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
        });
    }
    render() {
        return (
        <nav className="navbar navbar-expand-md">
            <div className="navbar-collapse collapse">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" href="#" id="reset">
                            <i className="material-icons">
                                refresh
                            </i>
                        </a>
                    </li>
                    <li className="nav-item dropdown new_database">
                        <a className="nav-link dropdown-toggle" href="#" id="databaseDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            Update Database
                        </a>
                        <div className="dropdown-menu" aria-labelledby="databaseDropdown" >
                            <CsvInput fileinput={this.props.fileinput} csvhandler={e => this.props.csvhandler(e, this.props.fileinput)}/>
                            <a className="pastebin dropdown-item" data-toggle="modal" data-target="#pastebin">Paste CSV</a>
                        </div>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" id="key_div">
                            <Key name="primarykey" keyhandler={e => this.props.keyhandler(e, 'primarykey')} headers={this.props.headers2}/>
                        </a>
                    </li>
                    <li className="nav-item dropdown" id="columns_toggle">
            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Columns
            </a>
                        <CheckBoxes headers={this.props.headers}/>
                    </li>
                    <li className="nav-item query">
                        <a className="nav-link query dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Query</a>
                            <Query filter={this.props.filter} handlequery={this.props.handlequery} />
                    </li>
                    <li className="nav-item calculated_column">
                        <AddColumn />
                    </li>
                </ul>
            </div>
            <AddColumnModal headers={this.props.headers} handleaddcolumn={this.props.handleaddcolumn} />
        </nav> 
        )
    }
}
