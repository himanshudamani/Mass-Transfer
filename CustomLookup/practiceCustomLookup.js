import lookUp from '@salesforce/apex/sal_tableController.searchLookupPill';
import { api, LightningElement, track, wire } from 'lwc';

export default class customLookUp extends LightningElement {

    @api label;
    @api anotherPillUser ='';
    objName = 'User';
    iconName = "standard:user";
    searchPlaceholder='Search';
    searchTerm;
    @track selectedName;
    @track records;
    @track isValueSelected;
    @track blurTimeout;
    @track currentSelectedUserId;
    @track boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    @track inputClass = '';
  
    @wire(lookUp, {searchTerm : '$searchTerm', objName : '$objName', filter : '$anotherPillUser'})
    wiredRecords({ error, data }) {
        if (data) {
            this.error = undefined;
            this.records = data;
        } else if (error) {
            this.error = error;
            console.log('Error-->'+JSON.stringify(this.error));
            this.records = undefined;
            this.dispatchEvent( 
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Some error in retriving records',
                    variant: 'error',
                }),
            );
        }
    }
    handleClick() {
        console.log('UesrId(prac)---> '+this.anotherPillUser);
        this.searchTerm = '';
        this.inputClass = 'slds-has-focus';
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
        console.log(' clicked');
    }

    onBlur() {
        this.blurTimeout = setTimeout(() =>  {this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus'}, 200);
    }
    
    onSelect(event) {
        this.currentSelectedUserId = event.currentTarget.dataset.id;
        this.selectedName = event.currentTarget.dataset.name;
        if(this.label === 'Transfer From'){
            const valueSelectedEvent = new CustomEvent('lookupselected', {
                detail:{selectedId : this.currentSelectedUserId,selectedName : this.selectedName },   
            });
            this.dispatchEvent(valueSelectedEvent);
        }
        if(this.label === 'Transfer To'){
            const valueSelectedEvent = new CustomEvent('lookupselectedtransferto', {
                detail:{selectedId : this.currentSelectedUserId,selectedName : this.selectedName},   
                });
            this.dispatchEvent(valueSelectedEvent);
        }

        this.isValueSelected = true;
        if(this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    }

    @api handleRemovePill() {
        this.isValueSelected = false;
        const selectedEvent = new CustomEvent('progressvaluechange',{
            detail : this.isValueSelected
        });
        this.dispatchEvent(selectedEvent);
    }

    onChange(event) 
    {
        this.searchTerm = event.target.value;
    }
}
