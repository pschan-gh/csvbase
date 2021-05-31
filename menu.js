class CsvPasteModal extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <div id="pastebin" className="modal" tabIndex="-1" role="dialog" aria-labelledby="pastebinlabel" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="dialog" >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="pastebinlabel">Paste</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={this.props.csvpastehandler}>
                            <div className="modal-body"  >
                                <textarea style={{width:'100%',height:'25em',fontFamily:'Courier'}} id="fields" name="csv" ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button id="csv_submit" type="submit" className="btn btn-primary" >Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class Key extends React.Component {
    constructor(props) {
        super(props);        
    }
    
    render() {        
        return (
        <select name={this.props.name} className="form-control form-control-sm key" title="Set Key" onChange={this.props.keyhandler}>
            <option value="default">Select Key...</option>
            <option value="ordinal_index">Ordinal Index</option>
            {Object.keys(this.props.headers).map((field, i) => {
                return <option key={field} value={field}>{field}</option>;
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

function XlsxInput(props) {
    return (
        <label className="dropdown-item">
            Import XLSX
            <input type="file" ref={props.xlsxinput} accept=".xlsx, .xls" style={{ display: "none" }} onChange={props.xlsxhandler}/>
        </label>
    );
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
                
                $chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).each(function() {
                    // if (this.checked != lastChecked.checked) {
                    //     this.click();
                    // }
                    this.checked = lastChecked.checked
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
            <li className="nav-item dropdown new_database">
            <a className="nav-link dropdown-toggle" href="#" id="databaseDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Update Database
            </a>
            <div className="dropdown-menu" aria-labelledby="databaseDropdown" >
            <CsvInput fileinput={this.props.fileinput} csvhandler={e => this.props.csvhandler(e, this.props.fileinput)}/>
            <XlsxInput xlsxinput={this.props.xlsxinput} xlsxhandler={e => this.props.xlsxhandler(e, this.props.xlsxinput)}/>
            <a className="pastebin dropdown-item" data-bs-toggle="modal" data-bs-target="#pastebin">Paste CSV</a>
            </div>
            </li>
            <li className="nav-item">
            <a className="nav-link" href="#" id="key_div">
        <Key name="primarykey" keyhandler={e => this.props.keyhandler(e, 'primarykey')} headers={this.props.headers2}/>
        </a>
        </li>
        <li className="nav-item dropdown" id="columns_toggle">
        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Columns
        </a>
        <CheckBoxes headers={this.props.headers} reorderheaders={this.props.reorderheaders} freezecolindex={this.props.freezecolindex} />
        </li>
        <li className="nav-item query">
        <a className="nav-link query" href="#" role="button" data-bs-toggle="modal" data-bs-target="#query_modal">Query</a>
        <Query filter={this.props.filter} handlequery={this.props.handlequery} headers={this.props.headers} />
        </li>
        <li className="nav-item calculated_column">
        <AddColumn />
        </li>
        <li className="nav-item dropdown" id="export">
            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Export
            </a>
            <div className="dropdown-menu">
                <a id="exportCSV" className="dropdown-item" onClick={this.props.exporthandler}>
                    Export to CSV
                </a>
                {/* <a id="exportJSON" class="dropdown-item">
                    Export to JSON
                </a>
                <a id="exportSqlite" class="dropdown-item">
                    Export to Sqlite
                </a> */}
            </div>
        </li>
        </ul>
        </div>
        <CsvPasteModal csvpastehandler={this.props.csvpastehandler} />
        <AddColumnModal headers={this.props.headers} handleaddcolumn={this.props.handleaddcolumn} />
        <RenameColumnModal handlerenamecolumn={this.props.handlerenamecolumn} />     
        </nav> 
        )
    }
}
