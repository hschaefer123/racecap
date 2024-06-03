import ExtensionAPI from 'sap/fe/core/ExtensionAPI';
import UI5Event from 'sap/ui/base/Event';
import FilterBar from 'sap/fe/macros/filterBar/FilterBarAPI';
import Context from 'sap/ui/model/odata/v4/Context';

export function onSearch(this: ExtensionAPI, event: UI5Event) {
    let filterBar = event.getSource() as FilterBar;
    let filterValues = filterBar.getFilters() as any;
    if(filterValues.filters.length === 0){
        let bindingContext = filterBar.getBindingContext() as Context;
        let match = window.location.href.match(/\(([^)]+)\)/);
        if(bindingContext) {
            bindingContext?.requestObject().then(function(result: any) {
            //set the filter value to the current session ID
            filterBar.setFilterValues("session_ID", result.ID);
            //fallback in case no binding context is available
        })} else if(match) {
              filterBar.setFilterValues("session_ID",  match.pop());
        }
    }
}