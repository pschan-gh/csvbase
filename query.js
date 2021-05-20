function QueryItem(props) {
    return (
        <div className="row mx-3 mb-3">
        <div className="col">
            <select name={props.querykey} className="form-control" defaultValue={props.field} onChange={props.handleselect}>
                <option name={props.querykey} value='Show All'>Show All</option>
                {
                    props.headers.map((field, i) => {
                    return <option key={field} className={field} name={props.querykey} value={field} >{field}</option>;
                    })
                }
            </select>
        </div>
        <div className="col">
            <input className="form-control" type="text" name={props.querykey} defaultValue={props.condition} onChange={props.handlecondition}/>
        </div>
        </div>
    );
}

class Query extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            queryItems:[{id:0, field:null, conjunction:'', condition:''}],
        };
        this.handleSelect = this.handleSelect.bind(this);
        this.handleCondition = this.handleCondition.bind(this);
    }
    
    handleSelect(e) {
        let queryItems = [...this.state.queryItems];
        console.log(e.target.name);
        let item = {...queryItems[parseInt(e.target.name)]};
        item.field = e.target.value;
        queryItems[parseInt(e.target.name)] = item;
        this.setState({queryItems:queryItems});
    }
    handleCondition(e) {
        let queryItems = [...this.state.queryItems];
        console.log(e.target.name);
        let item = {...queryItems[parseInt(e.target.name)]};
        item.condition = e.target.value;
        queryItems[parseInt(e.target.name)] = item;
        this.setState({queryItems:queryItems});
    }
    
    render() {
        return (
            <div className="dropdown-menu query" aria-labelledby="navbarDropdown" style={{width:'100%'}}>
                <form className="mb-0" onSubmit={e => this.props.handlequery(e, this.state.queryItems)}>
                    {this.state.queryItems.map(item => {
                        return (
                            <QueryItem key={item.id} querykey={item.id} field={item.field} conjunction={item.conjunction} condition={item.condition} headers={this.props.headers} handleselect={this.handleSelect} handlecondition={this.handleCondition} />
                        )
                    })}
                        <div className="col-auto">
                            <button type="submit" className="btn btn-secondary btn-sm">Submit</button>
                        </div>
                </form>
            </div>
        );
    }
}
