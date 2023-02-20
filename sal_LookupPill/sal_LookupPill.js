import lookUp from '@salesforce/apex/sal_tableController.searchLookupPill';
import { api, LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
export default class customLookUp extends LightningElement {

    @api label ='';
    @api anotherPillUser ='';
    objName = 'User';
    iconName = "standard:user";
    searchPlaceholder='Search User';
    searchTerm = '';
    @track selectedName;
    @track records;
    @track isValueSelected;
    @track blurTimeout;
    @track currentSelectedUserId;
    @track boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    @track inputClass = '';

    //Purpose: Getting data from Apex
    @wire(lookUp, {searchTerm : '$searchTerm', objName : '$objName', filter : '$anotherPillUser', label : '$label'})
    wiredRecords({ error, data }) {
        if (data) {
            this.error = undefined;
            this.records = data;
        } else if (error) {
            this.error = error;
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

    //Purpose: Load records on pill load
    connectedCallback(){
        lookUp({searchTerm : this.searchTerm, objName : this.objName, filter : this.anotherPillUser , label : this.label})
        .then((data) => {
            this.error = undefined;
            this.records = data;
        })
        .catch((error) =>{  
            this.error = error;
            this.records = undefined;
            this.dispatchEvent( 
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Some error in retriving records',
                   variant: 'error',
                }),
                );
            }
        );
    }

    //Purpose: Setting css on click on box
    handleClick() {
        this.inputClass = 'slds-has-focus';
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
    }

    //Purpose: Setting css on losing focus on box
    onBlur() {
        this.blurTimeout = setTimeout(() =>  {this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus'}, 200);
    }
    
    //Purpose: Storing/sending value to main cmp when selected
    onSelect(event) {
        this.currentSelectedUserId = event.currentTarget.dataset.id;
        console.log('Select Runs'+this.currentSelectedUserId);
        this.selectedName = event.currentTarget.dataset.name;
        if(this.label === 'Transfer From'){
            const valueSelectedEvent = new CustomEvent('lookupselectedtransferfrom', {
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
        this.searchTerm = '';
        this.anotherPillUser = event.currentTarget.dataset.id;
        return refreshApex(this.records);
    }

    //Purpose: Dispatching event when pill is removed
    @api handleRemovePill() {
        this.isValueSelected = false;
        const selectedEvent = new CustomEvent('removepill',{
            detail : this.isValueSelected
        });
        this.dispatchEvent(selectedEvent);
        //this.searchTerm ='';
    }

    //Purpose: Changing searchTerm on input change
    onChange(event) 
    {
        this.searchTerm = event.target.value;
    }

    //Purpose: Getter for No record message
    get noRecordsMsg(){
        return (this.records == null || this.records == undefined || this.records == '') ? true : false;
    }
}