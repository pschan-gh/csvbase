function TableRow(props) {
 return (
    <tr>
        {props.headers.map(field => {
            return <td key={field} data-field={field}>{props.item[field]}</td>;
        })}                            
    </tr>    
  );
}

function Header(props) {
    return(
        <thead>
            <tr id="header_row" className="table-secondary">                
                {props.headers.map((field, i) => {
                    return <th key={field} data-field={field}>
                    <a href="#" className="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                    <div className="dropdown-menu" aria-labelledby={field}>
                        <a className="dropdown-item group_by" data-field={field} href="#">Group by</a>
                        <a className="dropdown-item fields statistics" data-field={field} href="#" >Statistics</a>
                        <a className="dropdown-item recalculate fields" data-toggle="modal" data-target="#column_bin" data-field={field} href="#">Recalculate</a>
                        <a className="dropdown-item fields hide" data-field={field} href="#">Hide</a></div>
                    <a className="triangle">&#x25BA;</a>
                    </th>;
                }
                )}
            </tr>
        </thead>
    );        
}

class Table extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            clickedArray:{},
        };        
    }
    // useEffect(() => {
    //     console.log('use effect');
    // });
    componentDidMount() {        
        console.log('did mount');
        let colWidths = {};
        this.props.headers.map(field => {
            console.log(document.querySelector('th[data-field="' + field + '"]'));
        });
        // console.log(colWidths);
    }
    componentDidUpdate() {
        console.log('use did update');
        let colWidths = {};
        let clickedArray = {...this.state.clickedArray};
        this.props.headers.map(field => {
            // colWidths[field] = document.querySelector('th[data-field="' + field + '"]').offsetWidth;
            if ( clickedArray[field] == null || typeof clickedArray[field] == 'undefined') {
                clickedArray[field] = 1;
            }
            colWidths[field] = Math.max($("td[data-field='" + field + "']").width(), $("th[data-field='" + field + "']").width()) + 50;
        });
        
        console.log(colWidths);
        
        let tableWidth = 0;
        $('th:visible').each(function() {
            tableWidth += colWidths[$(this).attr('data-field')];
        });

        $('#mainTable').css('width', tableWidth + 15);
        // $('#table-container').css('width', tableWidth + 15);
        $('tbody tr').css('width', tableWidth);
        $('thead tr').css('width', tableWidth);
        $('th, td').each(function() {
            $(this).css('width', colWidths[$(this).attr('data-field')]);
        });
        $('tbody').css('margin-top', parseInt($('th').first().css('height')));

        let groupField = this.props.primarykey;
        let primaryKey = this.props.primarkey;
        $("th .triangle").on('click', function() {
            $('th .triangle').html('&#x25ba;');
            let sortField = $(this).closest('th').attr('data-field');

            var clicked = clickedArray[sortField];
            clicked = clicked == 0 ? -1 : -1*clicked;
            clickedArray[sortField] = clicked;
            if (clickedArray[sortField] == 1) {
                $('th[data-field="' + sortField + '"] .triangle').html('&#x25B2;');
            } else if (clickedArray[sortField] == -1) {
                $('th[data-field="' + sortField + '"] .triangle').html('&#x25BC;');
            }    
            
            $(this).closest('th').attr('clicked', clicked);

            var aContent, bContent;
            var tbody = $('#mainTable').find('tbody');
            
            if (sortField != groupField && sortField != 'count' && groupField != primaryKey) {
                tbody.find('tr').sort(function(a, b) {
                    aContent = $('td[data-field="' + sortField + '"]', a).html();
                    bContent = $('td[data-field="' + sortField + '"]', b).html();

                    aContent = typeof aContent !== typeof undefined ? aContent : '';
                    bContent = typeof bContent !== typeof undefined ? bContent : '';

                    if (isNaN(aContent) || isNaN(bContent)) {
                        return ($('td[data-field="' + groupField + '"]', a).html().localeCompare($('td[data-field="' + groupField + '"]', b).html())) || clicked*(aContent.localeCompare(bContent));
                    } else {
                        return ($('td[data-field="' + groupField + '"]', a).html().localeCompare($('td[field="' + groupField + '"]', b).html())) || clicked*(+aContent - +bContent);
                    }
                }).appendTo(tbody);
            } else {
                tbody.find('tr').sort(function(a, b) {
                    aContent = $('td[data-field="' + sortField + '"]', a).text();
                    bContent = $('td[data-field="' + sortField + '"]', b).text();
                    if ((isNaN(aContent) || isNaN(bContent)) && sortField != 'count') {
                        return clicked*(aContent.localeCompare(bContent));
                    } else {
                        return clicked*(+aContent - +bContent);
                    }
                }).appendTo(tbody);
            }
                        
            $('tbody').find('tr').each(function(index) {
                $(this).find('td.col_rank').text(index + 1);
            });
            
        });
        

    }

    render() {
        console.log(this.props.database);
        return(
        <table id="mainTable" className="table table-bordered table-hover">
            <Header headers={this.props.headers}/>
            <tbody>
                { Object.keys(this.props.database).map(field => {
                    return <TableRow headers={this.props.headers} item={this.props.database[field]} key={field} />
                    })
                }
            </tbody>
        </table>
    )
    }
}