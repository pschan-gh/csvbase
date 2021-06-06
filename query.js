function QueryItem(props) {
    return (
        <div className="row my-1 g-3">
            <div className="col-auto">
                <input type="button" value="-" className="btn btn-sm btn-outline-secondary" onClick={() => {props.removequery(props.querykey);}} />
            </div>
            <div className="col-auto">
                <select name={props.querykey} className="form-control" defaultValue="&&" disabled={props.querykey == 0} readOnly={props.querykey == 0} onChange={props.handleconjunction}>
                    <option name={props.querykey} key='and' value='&&'>AND</option>
                    <option name={props.querykey} key='or' value='||'>OR</option>
                </select>
            </div>
            <div className="col-auto">
                <select name={props.querykey} className="form-control" defaultValue="" onChange={props.handleselect}>
                    <option name={props.querykey} key='Show All' value='Show All'>Show All</option>
                    {
                        Object.keys(props.headers).map((field, i) => {
                            return <option name={props.querykey} key={field} data-field={field} value={field}>{field}</option>;
                        })
                    }
                </select>
            </div>
            <div className="col-auto">
                <input className="form-control" type="text" name={props.querykey} defaultValue={props.condition} onChange={props.handlecondition}/>
            </div>
        </div>
    );
}

class Query extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            headers:{},
            // queryItems:[{id:0, field:null, conjunction:'', condition:''}],
            queryItems:[{field:null, conjunction:'&&', condition:''}],
        };
        this.handleSelect = this.handleSelect.bind(this);
        this.handleConjunction = this.handleConjunction.bind(this);
        this.handleCondition = this.handleCondition.bind(this);
    }
    
    componentDidUpdate(props) {
    }
    
    handleConjunction(e) {
        let queryItems = [...this.state.queryItems];
        console.log(e.target.name);
        let item = {...queryItems[parseInt(e.target.name)]};
        item.conjunction = e.target.value;
        queryItems[parseInt(e.target.name)] = item;
        this.setState({queryItems:queryItems});
        console.log(this.state);
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
        // console.log(e.target.name);
        let item = {...queryItems[parseInt(e.target.name)]};
        item.condition = e.target.value;
        queryItems[parseInt(e.target.name)] = item;
        this.setState({queryItems:queryItems});
    }
    
    addQuery() {
        this.setState(prevState => ({ 
            queryItems: [...prevState.queryItems, {field:null, conjunction:'&&', condition:''}]
        }));
    }
    
    removeQuery(index){
        let items = this.state.queryItems.slice();
        items.splice(index, 1);
        this.setState({ queryItems:items });
    }
    
    render() {
        console.log(this.state.queryItems);
        return (
            <div id="query_modal" className="modal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog" >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 style={{display:'inline'}} className="mb-0">Query</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>                        
                        <form onSubmit={e => this.props.handlequery(e, this.state.queryItems)}>
                            <div className="modal-body">
                                {this.state.queryItems.map((item, index) => {
                                    return (
                                        <QueryItem key={index} querykey={index} field={item.field} conjunction={item.conjunction} condition={item.condition} headers={this.props.headers} handleconjunction={this.handleConjunction} handleselect={this.handleSelect} handlecondition={this.handleCondition} removequery={this.removeQuery.bind(this)}/>
                                    )
                                })}
                                <div className="row my-1 g-3"> 
                                    <div className="col-auto">
                                        <input type="button" name="add_query" value="+" className="btn btn-sm btn-outline-secondary form-control" onClick={this.addQuery.bind(this)}/>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <div className="row mx-3 w-50 ms-auto">                                                         
                                    <div className="col">
                                        <button type="submit" className="form-control btn btn-secondary btn-sm">Submit</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
        }
}
