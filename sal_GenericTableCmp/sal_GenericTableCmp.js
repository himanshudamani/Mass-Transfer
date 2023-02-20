import { LightningElement,wire,track, api } from 'lwc';
import getRecordList from '@salesforce/apex/sal_tableController.getRecordList';
import updateSelectedRecords from '@salesforce/apex/sal_tableController.updateSelectedRecords';
import updateTeamMemRecords from '@salesforce/apex/sal_tableController.updateTeamMemRecords';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class sal_GenericTable extends LightningElement {
    @api userId = ''; //Transfer From User
    @api objectName = '';
    @api transferTo;
    @track objectRecords=[];
    @track noRecords;
    @track sortBy;
    @track sortDirection;
    @track error;
    //@track refreshTable = [];
    @track refreshTable ={ data: null, error: null };
    @track selectedAccountIdList = [];
    @track message ='';
    @api columns = [];
    isLoaded = true; //for spinner

    //Pagination variables
    page = 1;
    startingRecord = 1; //start record position per page
    endingRecord = 0; //end record position per page
    pageSize = 10; //default value we are assigning
    totalRecountCount = 0; //total record count received from all retrieved records
    totalPage = 0; //total number of page is needed to display all records
    selectedRows = [];
    items = [];
    recordSelected=true;
   
    //@api refreshOtherTable='';
    
    //Purpose: Getting and Mapping data from Apex for DataTable
    @wire(getRecordList,{ 'objName' : '$objectName', 'userId' : '$userId'}) getAcc(result) {
        this.refreshTable = result;        
        if (result.data) {
            this.items = result.data;
            const transformationFunctions = {
                'contact': row => ({...row, AccName: row.Account?.Name ?? 'N/A', Email: row.Email ?? 'N/A'}),
                'account': row => ({...row, CVIF__c: row.CVIF__c ?? 'N/A'}),
                'accountTeamMember': row => ({...row, Name: row.Account.Name, UserName: row.User.Name}),
                'opportunityTeamMember': row => ({...row, Name: row.Opportunity.Name, UserName: row.User.Name}),
                'opportunity': row => ({...row, AccName: row.Account?.Name ?? 'N/A', OwnerName: row.Owner.Name})
            };
        
            const transform = transformationFunctions[this.objectName] || (row => row);
        
            this.items = this.items.map(transform);
            
            this.totalRecountCount = this.items.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            //here we slice the data according page size
            this.objectRecords = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
        }
        else if (result.error) {
            this.error = result.error;
            this.data = undefined;
            this.showToast('Error!', 'There\'s some error in record retrival', 'error');
        }
        this.noRecords  = this.showMsg;
        /*setTimeout(() => {
            this.noRecords  = this.showMsg;
        }, 1000);*/
    }

    //Purpose: Updating Data on Transfer Button Click through Apex
    updateSelectedRcrds(){
        if(this.objectName == 'accountTeamMember' || this.objectName == 'opportunityTeamMember'){
            this.updateSelectedRcrds_ATMOTM();
        }
        else{
            this.updateSelectedRcrds_OtherObj();
        }
    }

    //Purpose: (FOR AccTM/OppTM)Updating Data on Transfer Button Click through Apex
    updateSelectedRcrds_ATMOTM(){
        this.isLoaded = false;
        updateTeamMemRecords({selectedRecIdList:this.selectedRows, userId :this.transferTo, objName :this.objectName})
        .then(result => {    
            this.isLoaded = true;
           
            this.page = 1;
            this.showToast('Success','Selected Records are Updated Successfully!','success');
            //for clearing selected row indexs 
            this.template.querySelector('lightning-datatable').selectedRows = [];
            this.recordSelected = true;
            
            return refreshApex(this.refreshTable);        
        })
        .catch(error => {
            this.isLoaded = true;
            this.message = undefined;
            this.error = error;
            if(error.body.message.includes('Owner ID:')){
                this.message = 'Please provide User value in `Transfer To` field';
            }
            else if(error.body.message.includes('Async job for Account')){
                this.message = 'Please wait for few seconds for next transfer';
            }
            else{
                this.message = error.body.message;
            }
            this.showToast('Error in record transfer', this.message, 'error');
        })
        .finally(() => {
            // check if the last record was transferred
            this.objectRecords = this.items.slice((this.page-1)*this.pageSize, (this.page-1)*this.pageSize + this.pageSize);
            //this.page = this.totalPage;
            if(this.refreshTable.data === null){
                this.noRecords = true;
            } else {
                this.noRecords = false;
            }
        });
    }

    //Purpose: (For Other objects)Updating Data on Transfer Button Click through Apex
    updateSelectedRcrds_OtherObj(){
        this.isLoaded = false;
        updateSelectedRecords({selectedRecIdList:this.selectedRows, userId :this.transferTo, objName :this.objectName})
        .then(result => {
            this.isLoaded = true;
           
            this.page = 1;
            this.showToast('Success','Selected Records are Updated Successfully!','success');
            //for clearing selected row indexs 
            this.template.querySelector('lightning-datatable').selectedRows = [];
            this.recordSelected = true;
           
            //this.parentMessage();
            /*if(this.objectName =='account'){
                const refreshOtherTable = new CustomEvent('refreshothertable', {
                    detail: {refreshothertable: this.recordSelected}
                    });
                this.dispatchEvent(refreshOtherTable);
                console.log('event dispatcheds');
            }*/
            return refreshApex(this.refreshTable); 
        })
        .catch(error => {
            this.isLoaded = true;
            this.message = undefined;
            this.error = error;
            if(error.body.message.includes('Owner ID:')){
                this.message = 'Please provide User value in `Transfer To` field';
            }
            else if(error.body.message.includes('Async job for Account')){
                this.message = 'Please wait for few seconds for next transfer';
            }
            else{
                this.message = error.body.message;
            }
            this.showToast('Error in record transfer', this.message, 'error');
        })
        .finally(() => {
            // check if the last record was transferred
            this.objectRecords = this.items.slice((this.page-1)*this.pageSize, (this.page-1)*this.pageSize + this.pageSize);
            //this.page = this.totalPage;
            if(this.refreshTable.data === null){
                this.noRecords = true;
            } else {
                this.noRecords = false;
            }
        });
    }

    //Purpose: Pagination - Persistance
    prepareSelectedRows(event){
        const selectedRows=event.detail.selectedRows; 
        this.selectedAccountIdList = []; 
        for (let i = 0; i < selectedRows.length; i++){           
            this.selectedAccountIdList.push(selectedRows[i].Id);
        }
        if(this.selectedAccountIdList.length ==0)
        {
          this.recordSelected = true;
        }
        else 
        {
            this.recordSelected = false;
        }

        /*Pagination code starts*/ 

        let updatedItemsSet = new Set();
        // List of selected items we maintain.
        let selectedItemsSet = new Set(this.selectedRows);
        // List of items currently loaded for the current view.
        let loadedItemsSet = new Set();

        this.objectRecords.map((ele) => {
            loadedItemsSet.add(ele.Id);
        });

        if (event.detail.selectedRows) {
            event.detail.selectedRows.map((ele) => {
                updatedItemsSet.add(ele.Id);
            });

            // Add any new items to the selectedRows list
            updatedItemsSet.forEach((id) => {
                if (!selectedItemsSet.has(id)) {
                    selectedItemsSet.add(id);
                }
            });
        }

        loadedItemsSet.forEach((id) => {
            if (selectedItemsSet.has(id) && !updatedItemsSet.has(id)) {
                // Remove any items that were unselected.
                selectedItemsSet.delete(id);
            }
        });
       
        this.selectedRows = [...selectedItemsSet];
        if(this.selectedRows.length ==0)
        {
          this.recordSelected = true;
        }
        else 
        {
            this.recordSelected = false;
        }
        //this.parentMessage();
    }

    //Purpose: Method to send recordselected to parent for closeConfirm popup
    /*parentMessage(){
        //Passing recordsSelected value to parent
        const ParEvent = new CustomEvent('isrecordselected', {
            detail: {recordSelected: this.recordSelected}
            });
        this.dispatchEvent(ParEvent);
    }*/

    //Purpose: Getter for checking no records
    get showMsg()
    {
       if(this.refreshTable.data === null || this.refreshTable.data == '')
       {
        return true;
       }
       else 
       {
        return false;
       }
    }

    //Purpose: Sorting Data in DataTable
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    //Purpose: Sorting Data in DataTable
    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.objectRecords));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.objectRecords = parseData;
    } 
    
    //Purpose: Press on prev button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordPerPage(this.page);
        }
    }

    //Purpose: Press on next button this method will be called
    nextHandler() {
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.displayRecordPerPage(this.page);
        }
    }

   
    //Purpose: This method displays records page by page in DataTable
    displayRecordPerPage(page) {
        this.startingRecord = ((page - 1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount)
            ? this.totalRecountCount : this.endingRecord;

        this.objectRecords = this.items.slice(this.startingRecord, this.endingRecord);

        //increment by 1 to display the startingRecord count, 
        //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
        this.startingRecord = this.startingRecord + 1;
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.selectedRows;
    }

    //Purpose: Check when to disable 'Next'
    get isNextDisable() {
        return this.page === this.totalPage;
    }
   
    //Purpose: Check when to disable 'Prev'
    get isPreviousDisable()
    {
        return this.page === 1;
    }

    //Purpose: Check if Account DataTable
    get checkifaccount(){
        return this.objectName ==='account' ? true : false;
    }

    //Purpose: Generic showToast Message Method
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}