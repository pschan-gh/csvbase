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
    componentDidUpdate() {
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
                         this.click();
                     }
                 });

                $chkboxes.each(function() {
                    var field = $(this).attr('field');
                    if ($(this).is(':checked')) {
                        $('th[field="' + field + '"], td[field="' + field + '"]').show();
                    } else {
                        $('th[field="' + field + '"], td[field="' + field + '"]').hide();
                    }

                    var tableWidth = 0;
                    let colWidths = {};
                    colWidths[field] = Math.max($("td[data-field='" + field + "']").width(), $("th[data-field='" + field + "']").width()) + 50;
                    $('th:visible').each(function() {
                        tableWidth += colWidths[$(this).attr('field')];
                    });

                    $('#table-container').css('width', tableWidth + 45);
                    $('#mainTable').css('width', tableWidth);
                    $('#mainTable > thead > tr').css('width', tableWidth);
                });
            }

            lastChecked = this;
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
                    <CheckBoxes headers={this.props.headers}/>
                </ul>
            </div>
        </nav> 
        )
    }
}

class CheckBoxes extends React.Component {
    constructor(props){
        super(props);     
    }
    
    render() {
        console.log(this.props.headers);
        return (
            <li className="nav-item dropdown" id="columns_toggle">
            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Columns
            </a>
            <div className="dropdown-menu" id="columns_menu" aria-labelledby="dropdownMenuButton">
            {this.props.headers.map(field => {
                return <FieldCheckBox key={field} field={field} />
            })}
            </div>
            </li>
        );
    }
}