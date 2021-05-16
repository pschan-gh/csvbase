class Key extends React.Component {
    constructor(props) {
        super(props);        
    }
        
    render() {
        return (
            <select name={this.props.name} className="form-control form-control-sm" data-toggle="tooltip" data-placement="bottom" title="Set Key" onChange={this.props.keyhandler}>
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
                    
                </ul>
            </div>    
        </nav> 
        )
    }
}