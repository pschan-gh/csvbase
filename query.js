function QueryItem(props) {    
    return (
        <div className="row m-3">
            <div className="col">
                <select name={props.querykey} className="form-control" defaultValue="" onChange={props.handleselect}>
                    <option name={props.querykey} key='Show All' value='Show All'>Show All</option>
                    {
                        Object.keys(props.headers).map((field, i) => {
                            return <option name={props.querykey} key={field} data-field={field} value={field}>{field}</option>;
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
    
    componentDidUpdate(props) {
    }
    
    handleSelect(e) {
        let queryItems = [...this.state.queryItems];
        console.log(e.target.name);
        let item = {...queryItems[parseInt(e.target.name)]};
        item.field = e.target.value;
        queryItems[parseInt(e.target.name)] = item;
        this.setState({queryItems:queryItems});
        console.log(this.state);
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
            <div id="query_modal" className="modal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog" >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 style={{display:'inline'}} className="mb-0">Query</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={e => this.props.handlequery(e, this.state.queryItems)}>
                            {this.state.queryItems.map(item => {
                                return (
                                    <QueryItem key={item.id} querykey={item.id} field={item.field} conjunction={item.conjunction} condition={item.condition} headers={this.props.headers} handleselect={this.handleSelect} handlecondition={this.handleCondition} />
                                )
                            })}
                            <div className="col-auto">
                                <button type="submit" className="mx-3 btn btn-secondary btn-sm">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
        }
}
