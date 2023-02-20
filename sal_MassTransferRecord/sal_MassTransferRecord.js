import { LightningElement, track, api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import LightningConfirm from 'lightning/confirm';

export default class sal_MassTransferRecord extends NavigationMixin(LightningElement) 
{
  showAccounts = false;
  showContacts = false;
  showOpp = false;
  showLeads = false;
  showATM = false;
  showOTM = false;
  showAP = false;
  searchAccount = false;
  searchApproval = false;
  searchContact = false;
  searchLead = false;
  searchOpportunity = false;
  searchAccountTeamMember = false;
  searchOpportunityTeamMember = false;
  @track objName;
  @track account =[] ;
  @track lead =[] ;
  @track contact =[] ;
  @track opportunity =[] ;
  @track ApprovalProcess = [];
  @track AccountTeamMember =[] ;
  @track OpportunityTeamMember =[] ;
  @track userId = '';
  @track transferFrom;
  @track transferTo = '';
  @track transferToName;
  @track recordSelected = true;
  selectedTab = '';
  val = '';
  tab = '';
  showTable = false;
  tabBool ;
  disableCheckbox = true;
  disableSearchBtnVar = true;
  //refreshTable=true;

  //Columns for All dataTables
  columnsAcc = [
    {label:'Parent Account',fieldName:'Name',type:'text',sortable : "true"},
    {label:'CVIF ID',fieldName:'CVIF__c',type:'text',sortable : "true"},
    {label:'Account Type',fieldName:'Type',type:'text',sortable : "true"},
    {label:'Market Segment',fieldName:'Industry',type:'text',sortable : "true"}
  ];
  columnsCon = [
    {label:'Contact Name',fieldName:'Contact_Name_Title__c',type:'text',sortable : "true"},
    {label:'Account Name',fieldName:'AccName',type:'text',sortable : "true"},
    {label:'Email',fieldName:'Email',type:'text',sortable : "true"}
  ];
  columnsLead = [
    {label:'Contact Name',fieldName:'Name',type:'text',sortable : "true"},
    {label:'Lead Status',fieldName:'Status',type:'text',sortable : "true"},
    {label:'Account Name',fieldName:'Company',type:'text',sortable : "true"}
  ];
  columnsOpp = [
    {label:'Name',fieldName:'Name',type:'text',sortable : "true"},
    {label:'Account Name',fieldName:'AccName',type:'text',sortable : "true"},
    {label:'Stage',fieldName:'StageName',type:'text',sortable : "true"},
    {label:'Owner',fieldName:'OwnerName',type:'text',sortable : "true"}
  ];
  columnsAccTM = [
    {label:'Account Name',fieldName:'Name',type:'text',sortable : "true"},
    {label:'Team Role',fieldName:'TeamMemberRole',type:'text',sortable : "true"},
    {label:'User Name',fieldName:'UserName',type:'text',sortable : "true"}
  ];
  columnsOppTM = [
    {label:'Opportunity Name',fieldName:'Name',type:'text',sortable : "true"},
    {label:'Team Role',fieldName:'TeamMemberRole',type:'text',sortable : "true"},
    {label:'User Name',fieldName:'UserName',type:'text',sortable : "true"}
  ]; 
  
  //List of tabs for generic component
  get tabs(){
    return [
      {
        label: 'Accounts', value: 'Account', id: 'Account', objectName: 'account',
        columns: this.columnsAcc, visible: this.searchAccount
      },
      {
        label: 'Leads', value: 'Lead', id: 'Lead', objectName: 'lead',
        columns: this.columnsLead, visible: this.searchLead
      },
      {
        label: 'Contacts', value: 'Contact', id: 'Contact', objectName: 'contact',
        columns: this.columnsCon, visible: this.searchContact
      },
      {
        label: 'Opportunities', value: 'Opportunity', id: 'Opportunity', objectName: 'opportunity',
        columns: this.columnsOpp, visible: this.searchOpportunity
      },
      {
        label: 'Account Team Members', value: 'AccountTeamMember', id: 'AccountTeamMember', objectName: 'accountTeamMember',
        columns: this.columnsAccTM, visible: this.searchAccountTeamMember
      },
      {
        label: 'Opportunity Team Members', value: 'OpportunityTeamMember', id: 'OpportunityTeamMember', objectName: 'opportunityTeamMember',
        columns: this.columnsOppTM, visible: this.searchOpportunityTeamMember
      }
    ];
  }

  //Purpose: Setting values when checkboxes are selected
  handleCheckbox(event) 
  {
    this.disableSearchBtnVar = false;
    const checked = event.target.checked;
    const name = event.target.value;
    let showProperty = "";
    let objProperty = "";
    //let objName = "";
    
    switch (name) 
    {
        case "Account":
            showProperty = "showAccounts";
            objProperty = "account";
            //objName = "searchAccount";
            break;
        case "Lead":
            showProperty = "showLeads";
            objProperty = "lead";
            //objName = "searchLead";
            break;
        case "Contact":
            showProperty = "showContacts";
            objProperty = "contact";
            //objName = "searchContact";
            break;
        case "Opportunity":
            showProperty = "showOpp";
            objProperty = "opportunity";
            //objName = "searchOpportunity";
            break;
        case "AccountTeamMember":
            showProperty = "showATM";
            objProperty = "AccountTeamMember";
            //objName = "searchAccountTeamMember";
            break;
        case "OpportunityTeamMember":
            showProperty = "showOTM";
            objProperty = "OpportunityTeamMember";
            //objName = "searchOpportunityTeamMember";
            break;
        case "ApprovalProcess":
            showProperty = "showAP";
            objProperty = "ApprovalProcess";
            //objName = "searchApproval";
            break;
    }
    
    this[showProperty] = checked;
    if (checked)
    {
      this[objProperty] = name;
      //this.objName = name;
      this.selectedTab = event.target.value;
    } 
    else
    {
      this[objProperty] = '';
      //this.objName = '';
      this.selectedTab = '';
      //this[searchProperty] = false;
    }
  }  
  
  //Purpose: Setting values when TransferFrom is selected
  handleTransferFrom(event){
    this.userId = event.detail.selectedId;
    // this.tabBool = true;
    this.disableCheckbox = false;
    this.transferFrom = event.detail.selectedName;
  }

  //Purpose: Setting values when TransferTo is selected
  handleTransferTo(event)
  {
    this.transferTo = event.detail.selectedId;
    this.transferToName = event.detail.selectedName;
  }

  //Purpose: Setting values when Search Button is clicked
  handleSearchButton(){
    this.tabBool = true;
    this.disableSearchBtnVar = true;
    this.tab = this.selectedTab;
    this.searchAccount = this.showAccounts;
    this.searchContact = this.showContacts;
    this.searchLead = this.showLeads;
    this.searchOpportunity = this.showOpp;
    this.searchAccountTeamMember = this.showATM;
    this.searchOpportunityTeamMember = this.showOTM;
    this.searchApproval = this.showAP;
  }

  //Purpose: Setting values when TransferFrom Pill is removed
  handleRemovePillTransferFrom(event){
    this.tabBool = event.detail;
    if(this.tabBool == false){
      this.showAccounts = false;
      this.showLeads = false;
      this.showContacts = false;
      this.showOpp = false;
      this.showATM = false;
      this.showOTM = false;
      this.showAP = false;
      eval("$A.get('e.force:refreshView').fire();");
    }
  }

  //Purpose: Setting values when TransferTo Pill is removed
  handleRemovePillTransferTo(event){
    if(event.detail == false){
      this.transferTo = '';
    }
  }

  //Purpose: When to disable search button
  get disableSearchBtn(){
    if(this.account == '' && this.lead == '' &&  this.contact == '' && this.opportunity == '' && this.AccountTeamMember == '' && this.OpportunityTeamMember == '' && this.ApprovalProcess == ''){
        return true;
    }
    else if(this.disableSearchBtnVar){
        return true;
    }
    else {
        return false;
    }
  }
    
  //Purpose: Reset model on close
  hideModalBox(event){
    const objChild = this.template.querySelectorAll('c-sal-_-lookup-pill');
    objChild.forEach(obj => 
    {
      obj.handleRemovePill();
    })
    this.disableCheckbox = true;
  
    // Navigate to the Accounts's Recent list view.
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        objectApiName: 'Account',
        actionName: 'list'
      },
      state: {
        filterName: 'Recent' 
      }
    });
  }

  //Purpose: PopUp on closing the model
  async confirmClose(event){
    if(this.userId){
      const result = await LightningConfirm.open({
        message: 'Are you sure you want to close?',
        variant: 'header',
        label: 'Please Confirm',
        theme: 'error',
      });
      if(result==true){
          this.hideModalBox(event);
      }
    }
    else{
      this.hideModalBox(event);
    }
  }

  /*handleRefreshTable(event){
    //this.refreshTable = event.detail.refreshothertable;
    this.refreshTable = !this.refreshTable;
  }*/
}