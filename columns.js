class RecalculateColumnModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            field:null,
        }
        // $('#recalculate_column_bin input.column_name').val(props.field);$('#recalculate_column_bin textarea').val(props.headers[props.field].routine)
    }
    componentDidUpdate(props) {
        $('.field_reference button.field').off();
        $('.field_reference button.field').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            // console.log(e);
            insertAtCursor($(this).closest('.modal').find('textarea')[0], '+(@' + $(this).text() + ')');
        });
        $('.dropdown-menu.query').off();
        $('.dropdown-menu.query').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    }
    render() {
        const field = this.state.field == null ? '' : this.state.field;
        const routine = this.state.field == null ? '' : this.props.headers[this.state.field].routine;
        return (
        <div id="recalculate_column_bin" className="modal" tabIndex="-1" role="dialog" aria-labelledby="column_bin" aria-hidden="true">
            <div className="modal-dialog modal-lg" role="dialog" >
                <div className="modal-content">
                    <form onSubmit={this.props.handlerecalculatecolumn}>
                        <div className="modal-header">
                            <h5 style={{display:'inline'}} className="modal-title">Calculate Column</h5>
                            <input style={{display:'inline'}} className="form-control column_name" style={{fontFamily:'Courier'}} type="text" name="calc_col_name" defaultValue={field} readOnly/>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="field_reference" style={{padding:'10px'}}>
                            {Object.keys(this.props.headers).map(field =>
                                <button key={field} className="field btn btn-outline-info btn-sm">{field}</button>
                            )}
                        </div>                                    
                        <div className="modal-body">                
                            <textarea style={{width:'100%',height:'25em',fontFamily:'Courier'}} id="column_routine"  name="column_routine" defaultValue={routine}></textarea>
                        </div>
                        <div className="modal-footer">
                            <button id="column_recalculate" type="submit" className="btn btn-primary" >Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        );
    }
}


class RenameColumnModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name:'',
        };
    }
    
    render() {
        return (
        <div id="rename_column" className="modal" tabIndex="-1" role="dialog" aria-labelledby="rename_column_label" aria-hidden="true">
            <div className="modal-dialog" >
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="rename_column_label">Rename Column</h5>                        
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form onSubmit={this.props.handlerenamecolumn}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col">
                                    <input style={{display:'inline'}} className="form-control column_name" style={{fontFamily:'Courier'}} type="text" name="old_col_name" value={this.state.name} readOnly/>
                                </div>
                                <div className="col" style={{textAlign:'center',marginTop:'10px'}}><i className="bi bi-arrow-right"></i></div>
                                <div className="col">
                                    <input style={{display:'inline'}} className="form-control column_name" style={{fontFamily:'Courier'}} type="text" name="col_name"/>
                                </div>             
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button id="rename_submit" type="submit" className="btn btn-primary" >Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        );
    }
}

function AddColumn(props) {
    return (
        <a className="fields nav-link" data-bs-toggle="modal" data-bs-target="#column_bin" href="#" id="calculated_column">Add Calculated Column</a>
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
            insertAtCursor($(this).closest('.modal').find('textarea')[0], '+(@' + $(this).text() + ')');
        });
    }
    render() {
        return (
        <div id="column_bin" className="modal" tabIndex="-1" role="dialog" aria-labelledby="column_bin" aria-hidden="true">
            <div className="modal-dialog modal-lg" role="dialog" >
                <div className="modal-content">
                    <form onSubmit={this.props.handleaddcolumn}>
                        <div className="modal-header">
                            <h5 style={{display:'inline'}} className="modal-title">Calculate Column</h5>
                            <input style={{display:'inline'}} className="form-control column_name" style={{fontFamily:'Courier'}} type="text" name="calc_col_name"/>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="field_reference" style={{padding:'10px'}}>
                            {Object.keys(this.props.headers).map(field =>
                                <button key={field} className="field btn btn-outline-info btn-sm">{field}</button>
                            )}
                        </div>                                    
                        <div className="modal-body">                
                            <textarea style={{width:'100%',height:'25em',fontFamily:'Courier'}} className="column_routine"  name="column_routine" ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button id="column_submit" type="submit" className="btn btn-primary" >Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        );
    }
}

class FieldCheckBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    
    render() {
        return (
            <a className="dropdown-item field" key={this.props.field}>
            <input className='field_checkbox' defaultChecked={true} type='checkbox' data-field={this.props.field} name={this.props.field} onClick={this.props.handlecheckboxes} /><span>{this.props.field}</span>
            </a>
        );
    }
}

class CheckBoxes extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            visible:{},
        }
        this.handleCheckboxes = this.handleCheckboxes.bind(this);
    }
    
    handleCheckboxes(e) {
        const target = event.target;
        
        let updated = Object.keys({...this.props.headers});
        let scope = this;
        $('.field_checkbox').each(function() {
            let checked = this.checked;
            let name = $(this).attr('name');
            if (!checked) {
                updated = updated.filter(field => field != name);            
            } else {
                if (!updated.includes(name)) {
                    updated.push(name);            
                } 
            }
            console.log(updated);
            
        });
        this.setState({visible:updated}, () => {
            Object.keys(this.props.headers).map(field => {
                if(scope.state.visible.includes(field)) {
                    $('th[data-field="' + field + '"], td[data-field="' + field + '"]').show();
                } else {
                    $('th[data-field="' + field + '"], td[data-field="' + field + '"]').hide();
                }
            });
            let widths = computeColWidths(this.props.headers);
            updateTableWidth(widths);            
        });
    }
    
    componentDidUpdate() {
        console.log(this.props.freezecolindex);
        $(".freezeCol").remove();
        $('<a id="freezeCol" class="dropdown-item freezeCol" key="freezeCol"><hr/></a>').insertAfter($('.sortable a.field').eq(this.props.freezecolindex));
        $( function() {                        
            $( ".sortable" ).sortable();
            $( ".sortable" ).disableSelection();
        } );
    }
    
    render() {
        return (            
        <div className="dropdown-menu sortable" id="columns_menu" aria-labelledby="dropdownMenuButton">
            {Object.keys(this.props.headers).map((field, index) => {
                return <FieldCheckBox headers={this.props.headers}  key={field} field={field} handlecheckboxes={this.handleCheckboxes} />
            })}
            <button className="btn btn-outline-secondary btn-sm ms-2" onClick={this.props.reorderheaders}>Reorder</button>
        </div>
        );
    }
}
