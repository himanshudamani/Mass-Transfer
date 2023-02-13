import { LightningElement,wire,track, api } from 'lwc';
import getRecordList from '@salesforce/apex/sal_tableController.getRecordList';
import updateSelectedRecords from '@salesforce/apex/sal_tableController.updateSelectedRecords';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class MassDelete_LWC extends LightningElement {
    @api userId; //Transfer From User
    @api objectName;
    @api transferTo;
    @track accounts=[];
    @track noRecords;
    @track sortBy;
    @track sortDirection;
    @track error;
    @track refreshTable = [];
    @track selectedAccountIdList = [];
    @track message;
    @track columns = [
        {label:'Parent Account',fieldName:'Name',type:'text',sortable : "true"},
        {label:'CVIF ID',fieldName:'CVIF__c',type:'text',sortable : "true"},
        {label:'Account Type',fieldName:'Type',type:'text',sortable : "true"},
        {label:'Market Segment',fieldName:'Industry',type:'text',sortable : "true"}
    ];
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
    
    @wire(getRecordList,{ 'objName' : '$objectName', 'userId' : '$userId'}) getAcc(result) {
        this.refreshTable = result;        
        if (result.data) {
            this.items = result.data;
            this.items = this.items.map( row => {
                return {...row, CVIF__c:  row.CVIF__c !== undefined ? row.CVIF__c : 'N/A'};
            });
            this.totalRecountCount = this.items.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            //here we slice the data according page size
            this.accounts = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
        }
        else if (result.error) {
            this.error = result.error;
            this.data = undefined;
            this.showToast('Error!', 'There\'s some error in record retrival', 'error');
        }
        setTimeout(() => {
            this.noRecords  = this.showMsg;
        }, 1000);
    }

    updateSelectedRcrds(){
        this.isLoaded = false;
        updateSelectedRecords({selectedRecIdList:this.selectedRows, userId :this.transferTo, objName :this.objectName})
        .then(result => {
            this.isLoaded = true;
            this.showToast('Success','Selected Records are Updated Successfully!','success');
            /*this.dispatchEvent( 
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Selected Records are Updated Successfully!',
                    variant: 'success',
                }),
            ); */   
            //for clearing selected row indexs 
            this.template.querySelector('lightning-datatable').selectedRows = [];
            this.recordSelected = true;
            this.parentMessage();
            
            return refreshApex(this.refreshTable);    
        })
        .catch(error => {
            this.isLoaded = true;
            this.message = undefined;
            this.error = error;
            //if(error.body.pageErrors[0].message.startsWith('Owner ID:')){
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
            /*this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error in record transfer',
                    message: this.message,
                    variant: 'error',
                }),
            );*/
        })
        .finally(() => {
            // check if the last record was transferred
            if(this.refreshTable.data === null){
                this.noRecords = true;
            } else {
                this.noRecords = false;
            }
        });
    }

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

        this.accounts.map((ele) => {
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
       
        this.parentMessage();
    }

    //Method to send recordselected to parent for closeConfirm popup
    parentMessage(){
        //Passing recordsSelected value to parent
        const ParEvent = new CustomEvent('isrecordselected', {
            detail: {recordSelected: this.recordSelected}
            });
        this.dispatchEvent(ParEvent);
    }

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

    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.accounts));
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
        this.accounts = parseData;
    } 
    
    //press on prev button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordPerPage(this.page);
        }
    }

    //press on next button this method will be called
    nextHandler() {
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.displayRecordPerPage(this.page);
        }
    }

   
    //this method displays records page by page
    displayRecordPerPage(page) {
        this.startingRecord = ((page - 1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount)
            ? this.totalRecountCount : this.endingRecord;

        this.accounts = this.items.slice(this.startingRecord, this.endingRecord);

        //increment by 1 to display the startingRecord count, 
        //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
        this.startingRecord = this.startingRecord + 1;
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.selectedRows;
    }

    get isNextDisable() {
        return this.page === this.totalPage;
    }
   
    get isPreviousDisable()
    {
        return this.page === 1;
    }

    //Generic showToast Message Method
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
