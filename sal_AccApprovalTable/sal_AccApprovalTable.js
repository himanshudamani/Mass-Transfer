import { LightningElement,wire,track, api } from 'lwc';
import accountApprovalDataGet from '@salesforce/apex/sal_tableController.accountApprovalDataGet';
import approveOrRejectAccounts from '@salesforce/apex/sal_tableController.approveOrRejectAccounts';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class sal_AccApprovalTable extends LightningElement {
    @api userId; //Transfer From User
    @api objectName;
    @api transferTo;
    @api transferFrom;
    @track accounts=[];
    @track noRecords;
    @track noSelection=true;
    @track sortBy;
    @track sortDirection;
    @track dropdownLabel;
    buttonLabel;
    @track error;
    @api userName;
    @track refreshTable = [];
    @track selectedAccountIdList = [];
    @track message;
    @track columns = [
        {label:'Name',fieldName:'Name',type:'text',sortable : "true"},
        {label : 'Current Owner', fieldName : 'OwnerName', type : 'text',sortable : "true"},
        {label : 'Proposed Owner',fieldName : 'ProposedAccountOwner',type : 'text',sortable : "true"}
    ];
    @track options =[
        {label : 'Approval Request where User is proposed owner of Account' , value : 'Approval Request where User is proposed owner of Account'},
        {label : 'Approval Request where User is Current owner of Account' , value : 'Approval Request where User is Current owner of Account'},
        {label : 'Approval Request where User is the Approver' , value : 'Approval Request where User is the Approver'},
        {label : 'Approval Request initiated by User' , value : 'Approval Request initiated by User'}
    ];

    isLoaded = true;
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

    //Purpose: Get Account Approval records
    @wire(accountApprovalDataGet,{ 'userId' : '$transferFrom', 'label' : '$dropdownLabel'}) ApprovalDataget(result) {
        this.refreshTable = result;
        if (result.data) {
            let tempRecords = JSON.parse( JSON.stringify( result.data ) );
            tempRecords = tempRecords.map( row => {
                return {...row , ProposedAccountOwner: row.Proposed_Account_Owner__r.Name,OwnerName : row.Owner.Name };
            })

            this.items =tempRecords;
            this.totalRecountCount = this.items.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            //here we slice the data according page size
            this.accounts = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
        }
        else if (result.error) {
            this.error = result.error;
            this.data = undefined;
            this.showToast('Error!!', 'Error in record retriving', 'error');
        }
        this.noRecords  = this.showMsg;
        /*setTimeout(() => {
            this.noRecords  = this.showMsg;
        }, 1000);*/
    }

    //Purpose: On dropdown value change - wire method will recalled
    handleApprovalChange(event){
        this.noSelection = false;
        this.dropdownLabel  = event.target.value;
    }

    //Purpose: Update Approval records on Approve/Reject Button click
    approveOrRejectMethod(event){
        this.isLoaded = false; 
        this.buttonLabel = event.target.label;
        approveOrRejectAccounts({ IdList: this.selectedRows,userName : this.userName , action: this.buttonLabel})
        .then(result => {
            this.isLoaded = true; 
            this.showToast('Success', 'Selected Records are Updated Successfully!', 'success');
         //for clearing selected row indexs 
         this.recordSelected = true;
         this.page = 1;
         //this.parentMessage();
         return refreshApex(this.refreshTable);
        })
        .catch(error => {
            this.isLoaded = true; 
            this.message = undefined;
            this.error = error;
            if(error.body.message.startsWith('Async job for Account')){
                this.message = 'Please wait for 15 seconds for next transfer';
            }
            else{
                this.message = error.body.pageErrors[0].message;
            }
            this.showToast('Error updating records', this.message, 'error');
        })
        .finally(() => {
            // check if the last record was transferred
            this.objectRecords = this.items.slice((this.page-1)*this.pageSize, (this.page-1)*this.pageSize + this.pageSize);
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
      
        if(this.selectedAccountIdList.length ==0){
          this.recordSelected = true;
        }
        else {
            this.recordSelected = false;
        }

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
        //this.parentMessage();
    }

    //Method to send recordselected to parent for closeConfirm popup
    /*parentMessage(){
        //Passing recordsSelected value to parent
        const ParEvent = new CustomEvent('isrecordselected', {
            detail: {recordSelected: this.recordSelected}
            });
        this.dispatchEvent(ParEvent);
    }*/

    //Purpose: Getter for checking no records
    get showMsg(){
       if(this.refreshTable.data === null || this.refreshTable.data == ''){
        return true;
       }
       else {
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
        let parseData = JSON.parse(JSON.stringify(this.accounts));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // checking reverse direction
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

        this.accounts = this.items.slice(this.startingRecord, this.endingRecord);

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